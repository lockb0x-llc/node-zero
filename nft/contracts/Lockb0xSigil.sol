// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

// Struct for sigil parameters (must be before contract and interface definitions)
struct Params {
    uint16 bgHue;
    uint16 primaryHue;
    uint16 secondaryHue;
    int8  tilt;
    uint8 strokeTenths;
    uint8 glowPercent;
    uint8 variant;
}

/// @notice Minimal Linea PoH verifier interface (Signed Onchain Verification v2).
/// See: Linea PoH docs + IPohVerifier reference. 
interface IPohVerifier {
    /**
     * @notice Check if the provided signature has been signed by the registered PoH signer
     *         for the given human address.
     * @param signature Signature bytes returned by the Linea PoH API.
     * @param human     Address that was signed as part of the PoH payload.
     * @return True if the signature is valid for `human`, false otherwise.
     */
    function verify(bytes memory signature, address human) external view returns (bool);

    /// @notice Exposes the PoH signer address (for off-chain validation / monitoring).
    function getSigner() external view returns (address);
}

contract Lockb0xSigil is ERC721, Ownable, ReentrancyGuard {

    /// @notice Allow contract to receive ETH directly (for admin/test purposes)
    receive() external payable {}
    using Base64 for bytes;

    // =============================================================
    //                            ERRORS
    // =============================================================

    /// @notice Intermediate-tier code is invalid for caller.
    error InvalidCode(address sender, bytes32 codeHash);
    /// @notice Intermediate-tier code has already been used.
    error CodeAlreadyUsed();
    /// @notice Wallet has already claimed the PoH free mint.
    error FreeMintAlreadyClaimed();
    /// @notice msg.value does not match required price.
    error IncorrectPayment();
    /// @notice Max supply has been reached.
    error MaxSupplyReached();
    /// @notice A parameter is out of the allowed range.
    error ParamOutOfRange(string param);
    /// @notice Provided address is zero.
    error ZeroAddress();
    /// @notice No funds available to withdraw.
    error NoFunds();
    /// @notice Low-level withdraw call failed.
    error WithdrawFailed();
    /// @notice PoH verification failed for caller.
    error PoHVerificationFailed();
    /// @notice PoH verifier address is invalid (zero).
    error InvalidPohVerifier(address verifier);

    // =============================================================
    //                            EVENTS
    // =============================================================

    /// @notice Emitted on every PoH check attempt (success or failure).
    event PoHCheck(address indexed wallet, bool success);

    /// @notice Emitted whenever a symbol is minted.
    event SymbolMinted(
        address indexed minter,
        uint256 indexed tokenId,
        uint8   tier,
        Params  params
    );

    /// @notice Emitted when an intermediate-tier code is consumed.
    event CodeUsed(
        bytes32 indexed codeHash,
        address indexed minter,
        uint256 indexed tokenId
    );

    /// @notice Emitted at contract deployment.
    event ContractDeployed(address indexed owner, uint256 maxSupply);

    /// @notice Emitted when contract funds are withdrawn.
    event FundsWithdrawn(address indexed to, uint256 amount);

    /// @notice Emitted when a whitelist code is added.
    event CodeAdded(bytes32 indexed codeHash, address indexed wallet);

    /// @notice Emitted when a whitelist code is removed.
    event CodeRemoved(bytes32 indexed codeHash, address indexed wallet);

    /// @notice Emitted whenever the PoH verifier address is updated.
    event PoHVerifierUpdated(address indexed verifier);

    // =============================================================
    //                      PRICING & SUPPLY
    // =============================================================

    uint256 internal constant PRICE_STANDARD = 0.01 ether;
    uint256 internal constant PRICE_VIP = 0.00 ether;
    uint256 internal constant PRICE_PREMIUM = 0.05 ether;
    
    /// @notice Next token id to be minted (starts at 1).
    uint256 private _nextId = 1;

    /// @notice Optional hard cap on total supply (0 means uncapped).
    uint256 public immutable maxSupply;

    // =============================================================
    //                        STATE STORAGE
    // =============================================================

    /// @notice Parameters for each minted token id.
    mapping(uint256 tokenId => Params params) public paramsOf;

    /// @notice Tracks whether a whitelist code has already been used.
    mapping(bytes32 codeHash => bool used) private usedCodes;

    /// @notice Whitelist of valid codes and the wallet they are reserved for.
    mapping(bytes32 codeHash => address allowedWallet) private validCodes;

    /// @notice PoH verifier contract (Linea Signed Onchain Verification v2).
    IPohVerifier public pohVerifier;

    /// @notice One-time PoH free mint tracking: wallet => hasClaimedFreeMint.
    mapping(address => bool) public hasClaimedFreeMint;

    // =============================================================
    //                          CONSTRUCTOR
    // =============================================================

    constructor(uint256 _maxSupply)
        ERC721("Lockb0x Sigil", "lbx-sigil")
        Ownable(msg.sender)
    {
        maxSupply = _maxSupply;
        emit ContractDeployed(owner(), maxSupply);
    }

    // =============================================================
    //                       ADMIN / OWNER API
    // =============================================================

    /// @notice Set the Linea PoH verifier contract.
    /// @dev Must be called at least once before `mintPoHFree` is usable.
    function setPohVerifier(address verifier) external onlyOwner {
        if (verifier == address(0)) revert InvalidPohVerifier(verifier);
        pohVerifier = IPohVerifier(verifier);
        emit PoHVerifierUpdated(verifier);
    }

    /// @notice Add a valid vip-tier secret code for a specific wallet.
    function addValidCode(bytes32 codeHash, address wallet) external onlyOwner {
        if (wallet == address(0)) revert ZeroAddress();
        validCodes[codeHash] = wallet;
        emit CodeAdded(codeHash, wallet);
    }

    /// @notice Remove a previously registered vip-tier secret code.
    function removeValidCode(bytes32 codeHash) external onlyOwner {
        address wallet = validCodes[codeHash];
        validCodes[codeHash] = address(0);
        emit CodeRemoved(codeHash, wallet);
    }

    // =============================================================
    //                         PUBLIC MINTS
    // =============================================================

    /**
     * @notice Standard paid mint.
     * @param p Sigil parameters to be encoded into the SVG + metadata.
     */
    function mintStandard(Params calldata p) external payable nonReentrant {
        _validateParams(p, 3);
        _mintInternal(p, PRICE_STANDARD, 0);
    }

    /**
     * @notice VIP mint, requires a valid secret code reserved for caller.
     * @param p        Sigil parameters.
     * @param codeHash keccak256 hash of the user-supplied secret code.
     */
        function mintVIP(Params calldata p, bytes32 codeHash)
        external
        payable
        nonReentrant
    {
        // Verify code ownership and one-time use
        if (validCodes[codeHash] != msg.sender) revert InvalidCode(msg.sender, codeHash);
        if (usedCodes[codeHash]) revert CodeAlreadyUsed();

        _validateParams(p, 15);

        uint256 tokenId = _nextId;
        _mintInternal(p, PRICE_VIP, 1);

        usedCodes[codeHash] = true;
        validCodes[codeHash] = address(0); // optional: clear mapping after use

        emit CodeUsed(codeHash, msg.sender, tokenId);
    }

    /**
     * @notice Premium paid mint.
     * @param p Sigil parameters.
     */
    function mintPremium(Params calldata p) external payable nonReentrant {
        _validateParams(p, 15);
        _mintInternal(p, PRICE_PREMIUM, 2);
    }

    /**
     * @notice Free PoH-gated mint using Linea PoH verifier (Signed Onchain Verification v2).
     *
     * Flow (frontend):
     *  1. Frontend calls Linea PoH API and obtains a signature bound to the user's address.
     *  2. Frontend sends `signature` to this function.
     *  3. This contract calls `pohVerifier.verify(signature, msg.sender)`.
     *  4. If verified and caller has not claimed before, one free sigil is minted.
     *
     * @param p         Sigil parameters.
     * @param signature Signature bytes returned by the PoH API for `msg.sender`.
     */
    function mintPoHFree(Params calldata p, bytes calldata signature)
        external
        nonReentrant
    {
        // Ensure verifier configured
        address verifierAddr = address(pohVerifier);
        if (verifierAddr == address(0)) revert InvalidPohVerifier(verifierAddr);

        // Enforce one free mint per wallet
        if (hasClaimedFreeMint[msg.sender]) revert FreeMintAlreadyClaimed();

        // Validate params (same constraints as standard tier)
        _validateParams(p, 3);

        // Call Linea PoH verifier
        bool verified = pohVerifier.verify(signature, msg.sender);
        emit PoHCheck(msg.sender, verified);
        if (!verified) revert PoHVerificationFailed();

        // Mark as claimed and mint for free (priceWei = 0, tier = 0)
        hasClaimedFreeMint[msg.sender] = true;
        _mintInternal(p, 0, 0);
    }

    // =============================================================
    //                    INTERNAL MINTING / VALIDATION
    // =============================================================

    /// @notice Internal mint logic shared by all mint paths.
    /// @param p        Sigil parameters.
    /// @param priceWei Required payment in wei for this tier (0 for free PoH mint).
    /// @param tier     Tier code: 0=standard/PoH, 1=intermediate, 2=premium.
    function _mintInternal(Params calldata p, uint256 priceWei, uint8 tier) internal {
        // Exact price match to avoid stuck Ether patterns
        if (msg.value != priceWei) revert IncorrectPayment();

        uint256 tokenId = _nextId;
        uint256 maxSupply_ = maxSupply;

        if (maxSupply_ != 0 && tokenId > maxSupply_) revert MaxSupplyReached();

        paramsOf[tokenId] = p;
        _nextId++;

        _safeMint(msg.sender, tokenId);
        emit SymbolMinted(msg.sender, tokenId, tier, p);
    }

    /// @notice Parameter guards (kept tight for on-chain integrity + gas-efficient errors).
    function _validateParams(Params calldata p, uint8 maxVariant) internal pure {
        if (p.bgHue >= 360)         revert ParamOutOfRange("bgHue");
        if (p.primaryHue >= 360)    revert ParamOutOfRange("primaryHue");
        if (p.secondaryHue >= 360)  revert ParamOutOfRange("secondaryHue");
        if (p.tilt < -18 || p.tilt > 18)
                                     revert ParamOutOfRange("tilt");
        if (p.strokeTenths < 10 || p.strokeTenths > 40)
                                     revert ParamOutOfRange("strokeTenths");
        if (p.glowPercent < 20 || p.glowPercent > 90)
                                     revert ParamOutOfRange("glowPercent");
        if (p.variant < 1 || p.variant > maxVariant)
                                     revert ParamOutOfRange("variant");
    }

    // =============================================================
    //                      METADATA & RENDERING
    // =============================================================

    /// @notice Total minted tokens (including burned if you ever add burn logic).
    function totalMinted() external view returns (uint256) {
        return _nextId - 1;
    }

    /// @notice Returns CBOR-encoded metadata as data:application/cbor;base64,...
    /// @dev Kept for protocol / Lockb0x tooling compatibility.
    function tokenURI_CBOR(uint256 tokenId) public view returns (string memory) {
        _requireOwned(tokenId);

        Params storage p = paramsOf[tokenId];
        bytes memory cbor = abi.encodePacked(
            hex"A8",              // map(8)
            hex"617601",          // "v": 1
            hex"626267", _u(p.bgHue),
            hex"627031", _u(p.primaryHue),
            hex"627032", _u(p.secondaryHue),
            hex"6474696C74", _i(p.tilt),
            hex"627377", _u(p.strokeTenths),
            hex"64676C6F77", _u(p.glowPercent),
            hex"63766172", _u(p.variant)
        );

        return string(
            abi.encodePacked(
                "data:application/cbor;base64,",
                Base64.encode(cbor)
            )
        );
    }

    /// @notice Standard wallet-friendly metadata with embedded SVG as data URI.
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        Params memory p = paramsOf[tokenId];

        string memory svg       = _generateSVG(p);
        string memory svgBase64 = Base64.encode(bytes(svg));

        string memory json = string(
            abi.encodePacked(
                "{",
                    "\"name\":\"Lockb0x Sigil #", Strings.toString(tokenId), "\",",
                    "\"description\":\"Procedurally generated Lockb0x sigil.\",",
                    "\"image\":\"data:image/svg+xml;base64,", svgBase64, "\"",
                "}"
            )
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(json))
            )
        );
    }

    /// @dev Simple SVG generator; uses HSL and Params to shape the symbol.
    function _generateSVG(Params memory p)
        internal
        pure
        returns (string memory)
    {
        return string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>",
                    "<rect width='512' height='512' fill='hsl(",
                        Strings.toString(p.bgHue), ",100%,50%)'/>",
                    "<g transform='translate(256,256) rotate(",
                        intToString(p.tilt), ")'>",
                        "<circle r='120' fill='hsl(",
                            Strings.toString(p.primaryHue), ",100%,50%)' ",
                            "stroke='hsl(",
                                Strings.toString(p.secondaryHue), ",100%,50%)' ",
                            "stroke-width='",
                                Strings.toString(p.strokeTenths), "' ",
                            "filter='url(#glow)'/>",
                    "</g>",
                    "<filter id='glow'>",
                        "<feGaussianBlur stdDeviation='",
                            Strings.toString(p.glowPercent), "' />",
                    "</filter>",
                "</svg>"
            )
        );
    }

    // =============================================================
    //                      CBOR ENCODING HELPERS
    // =============================================================

    function _u(uint256 x) internal pure returns (bytes memory) {
        if (x < 24)   return abi.encodePacked(uint8(x));
        if (x < 256)  return abi.encodePacked(hex"18", uint8(x));
        return         abi.encodePacked(hex"19", uint16(x));
    }

    function _i(int8 x) internal pure returns (bytes memory) {
        if (x >= 0) {
            return _u(uint256(uint8(x)));
        }
        int8 n = x;
        if (n < -18) revert ParamOutOfRange("tilt");
        uint8 ai = uint8(-1 - n);
        return abi.encodePacked(uint8(0x20 + ai));
    }

    // =============================================================
    //                     UTILITY / WITHDRAWALS
    // =============================================================

    /// @dev Helper for int -> string (used in SVG rotation).
    function intToString(int256 value) internal pure returns (string memory) {
        if (value >= 0) {
            return Strings.toString(uint256(value));
        } else {
            return string(abi.encodePacked("-", Strings.toString(uint256(-value))));
        }
    }

    /**
     * @notice Withdraw all Ether from the contract to `to`.
     * @dev Owner only. Uses custom errors for gas efficiency.
     */
    function withdraw(address payable to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = address(this).balance;
        if (amount == 0) revert NoFunds();

        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert WithdrawFailed();

        emit FundsWithdrawn(to, amount);
    }

    /**
     * @notice PoH free mint integration notes (for frontend / infra):
     *
     * 1. Frontend calls Linea PoH API with the user’s wallet address.
     * 2. PoH API returns a signature bound to that address.
     * 3. Frontend calls `mintPoHFree(p, signature)` on this contract.
     * 4. This contract calls `pohVerifier.verify(signature, msg.sender)`.
     * 5. If verification passes and the wallet has not claimed yet, a free
     *    Lockb0x Sigil is minted with `priceWei = 0`.
     *
     * See Linea PoH docs (Signed Onchain Verification v2) for verifier
     * deployment addresses and API request format.
     */
}