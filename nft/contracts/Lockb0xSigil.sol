// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;
import "@openzeppelin/contracts/utils/Strings.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Base64.sol";



struct Params {
    uint16 bgHue;
    uint16 primaryHue;
    uint16 secondaryHue;
    int8 tilt;
    uint8 strokeTenths;
    uint8 glowPercent;
    uint8 variant;
}

contract Lockb0xSigil is ERC721, Ownable, ReentrancyGuard {
            error InvalidCode(address sender, bytes32 codeHash);
        // Helper for int to string (for tilt)
        function intToString(int256 value) internal pure returns (string memory) {
            if (value >= 0) {
                return Strings.toString(uint256(value));
            } else {
                return string(abi.encodePacked("-", Strings.toString(uint256(-value))));
            }
        }
    // --- Custom Errors for Gas-Efficient Error Reporting ---
    error CodeAlreadyUsed();
    error WalletAlreadyMinted();
    error IncorrectPayment();
    error MaxSupplyReached();
    error ParamOutOfRange(string param);
    error ZeroAddress();
    error NoFunds();
    error WithdrawFailed();
    using Base64 for bytes;

    event PoHCheck(address indexed wallet, bool success);
    event SymbolMinted(address indexed minter, uint256 indexed tokenId, uint8 tier, Params params);
    event CodeUsed(bytes32 indexed codeHash, address indexed minter, uint256 indexed tokenId);
    event ContractDeployed(address indexed owner, uint256 maxSupply);
    event FundsWithdrawn(address indexed to, uint256 amount);

    uint256 internal constant PRICE_STANDARD = 0.01 ether;
    uint256 internal constant PRICE_INTERMEDIATE = 0.01 ether;
    uint256 internal constant PRICE_PREMIUM = 0.05 ether;

    uint256 private _nextId = 1;
    //mapping(address minter => bool hasMinted) public hasMinted;
    mapping(uint256 tokenId => Params params) public paramsOf;
    mapping(bytes32 codeHash => bool used) private usedCodes;
    mapping(bytes32 codeHash => address allowedWallet) private validCodes;
    // --- Whitelist Code Management ---
    event CodeAdded(bytes32 indexed codeHash, address indexed wallet);
    event CodeRemoved(bytes32 indexed codeHash, address indexed wallet);

    function addValidCode(bytes32 codeHash, address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid wallet");
        validCodes[codeHash] = wallet;
        emit CodeAdded(codeHash, wallet);
    }

    function removeValidCode(bytes32 codeHash) external onlyOwner {
        address wallet = validCodes[codeHash];
        validCodes[codeHash] = address(0);
        emit CodeRemoved(codeHash, wallet);
    }
    uint256 public immutable maxSupply;

    constructor(uint256 _maxSupply) ERC721("Lockb0x Sigil", "lbx-sigil") Ownable(msg.sender) {
        maxSupply = _maxSupply;
        emit ContractDeployed(owner(), maxSupply);
    }

    function mintStandard(Params calldata p) external payable nonReentrant {
        _validateParams(p, 3);
        _mintInternal(p, PRICE_STANDARD, 0);
    }

    function mintIntermediate(Params calldata p, bytes32 codeHash) external payable nonReentrant {
        if (validCodes[codeHash] != msg.sender) revert InvalidCode(msg.sender, codeHash);
        if (usedCodes[codeHash]) revert CodeAlreadyUsed();
        _validateParams(p, 15);
        uint256 tokenId = _nextId;
        _mintInternal(p, PRICE_INTERMEDIATE, 1);
        usedCodes[codeHash] = true;
        // Optionally, remove the code after use to prevent reuse:
        validCodes[codeHash] = address(0);
        emit CodeUsed(codeHash, msg.sender, tokenId);
    }

    function mintPremium(Params calldata p) external payable nonReentrant {
        _validateParams(p, 15);
        _mintInternal(p, PRICE_PREMIUM, 2);
    }

    function _validateParams(Params calldata p, uint8 maxVariant) internal pure {
        if (p.bgHue >= 360) revert ParamOutOfRange("bgHue");
        if (p.primaryHue >= 360) revert ParamOutOfRange("primaryHue");
        if (p.secondaryHue >= 360) revert ParamOutOfRange("secondaryHue");
        if (p.tilt < -18 || p.tilt > 18) revert ParamOutOfRange("tilt");
        if (p.strokeTenths < 10 || p.strokeTenths > 40) revert ParamOutOfRange("strokeTenths");
        if (p.glowPercent < 20 || p.glowPercent > 90) revert ParamOutOfRange("glowPercent");
        if (p.variant < 1 || p.variant > maxVariant) revert ParamOutOfRange("variant");
    }

    function _mintInternal(Params calldata p, uint256 priceWei, uint8 tier) internal {
        //if (hasMinted[msg.sender]) revert WalletAlreadyMinted();
        if (msg.value != priceWei) revert IncorrectPayment();
        uint256 tokenId = _nextId;
        uint256 maxSupply_ = maxSupply;
        if (maxSupply_ != 0 && tokenId > maxSupply_) revert MaxSupplyReached();
        paramsOf[tokenId] = p;
        //hasMinted[msg.sender] = true;
        _nextId++;
        _safeMint(msg.sender, tokenId);
        emit SymbolMinted(msg.sender, tokenId, tier, p);
    }


    function totalMinted() external view returns (uint256) {
        return _nextId - 1;
    }

    // CBOR Metadata (renamed)
    function tokenURI_CBOR(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        _requireOwned(tokenId);
        Params storage p = paramsOf[tokenId];
        bytes memory cbor = abi.encodePacked(
            hex"A8",
            hex"617601",
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

    // Wallet-friendly JSON/SVG Metadata
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(ownerOf(tokenId) != address(0), "No such token");
        Params memory p = paramsOf[tokenId];

        string memory svg = _generateSVG(p);
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

    // SVG generator helper
    function _generateSVG(Params memory p)
        internal
        pure
        returns (string memory)
    {
        return string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>",
                    "<rect width='512' height='512' fill='hsl(", Strings.toString(p.bgHue), ",100%,50%)'/>",
                    "<g transform='translate(256,256) rotate(", intToString(p.tilt), ")'>",
                        "<circle r='120' fill='hsl(", Strings.toString(p.primaryHue), ",100%,50%)' ",
                            "stroke='hsl(", Strings.toString(p.secondaryHue), ",100%,50%)' ",
                            "stroke-width='", Strings.toString(p.strokeTenths), "' ",
                            "filter='url(#glow)'/>",
                    "</g>",
                    "<filter id='glow'>",
                        "<feGaussianBlur stdDeviation='", Strings.toString(p.glowPercent), "' />",
                    "</filter>",
                "</svg>"
            )
        );
    }

    function _u(uint256 x) internal pure returns (bytes memory) {
        if (x < 24) return abi.encodePacked(uint8(x));
        if (x < 256) return abi.encodePacked(hex"18", uint8(x));
        return abi.encodePacked(hex"19", uint16(x));
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


    // Withdraw Function (Owner Only)
    // ---------------------------------------------------------------------
    /**
     * @dev Withdraws all Ether from the contract to the specified address.
     * Only callable by the contract owner.
     */
    function withdraw(address payable to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = address(this).balance;
        if (amount == 0) revert NoFunds();
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert WithdrawFailed();
        emit FundsWithdrawn(to, amount);
    }
}