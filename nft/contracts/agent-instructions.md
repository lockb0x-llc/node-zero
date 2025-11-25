✅ GitHub Copilot Agent Instructions — Add Wallet-Compatible SVG JSON Metadata Without Refactoring CBOR

Objective:
Enhance the Lockb0xSymbolLinea smart contract so that MetaMask, OpenSea, and other wallets can display the SVG artwork.
Do not remove, replace, or refactor the existing CBOR metadata logic.
You will add a new JSON/SVG tokenURI() function that wraps the existing system.

⸻

✅ 1. DO NOT modify existing mint logic, Params struct, CBOR encoding, or _mintInternal
	•	Leave all existing logic exactly as-is.
	•	Leave the CBOR metadata generator exactly as-is.
	•	Do not remove or modify any existing public functions other than renaming tokenURI.

⸻

✅ 2. Rename the existing tokenURI to tokenURI_CBOR

Rename only the function signature and override removal:

function tokenURI_CBOR(uint256 tokenId)
    public
    view
    returns (string memory)
{
    // body remains exactly the same
}

⚠️ Do NOT change its internal logic or the CBOR encoding.
Only rename the function.

⸻

✅ 3. Add a new wallet-friendly tokenURI(uint256) override

Add this below the renamed CBOR function:

function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory)
{
    require(_exists(tokenId), "No such token");
    Params memory p = paramsOf[tokenId];

    string memory svg = _generateSVG(p);
    string memory svgBase64 = Base64.encode(bytes(svg));

    string memory json = string(
        abi.encodePacked(
            "{",
                "\"name\":\"Lockb0x Sigil #", tokenId.toString(), "\",",
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


⸻

✅ 4. Implement the _generateSVG(Params) helper

Add this new internal function:

function _generateSVG(Params memory p)
    internal
    pure
    returns (string memory)
{
    return string(
        abi.encodePacked(
            "<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>",
                "<rect width='512' height='512' fill='hsl(", p.bgHue.toString(), ",100%,50%)'/>",
                "<g transform='translate(256,256) rotate(", Strings.toString(p.tilt), ")'>",
                    "<circle r='120' fill='hsl(", p.primaryHue.toString(), ",100%,50%)' ",
                        "stroke='hsl(", p.secondaryHue.toString(), ",100%,50%)' ",
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

You may slightly adjust attributes to match UI rendering, but preserve the structure unless instructed otherwise.

⸻

✅ 5. Ensure ABI is regenerated

After modifying the contract:
	•	Recompile the contract with Hardhat/Foundry.
	•	Export a new abi.json file containing:
	•	tokenURI_CBOR(uint256)
	•	New tokenURI(uint256) override
	•	_generateSVG is internal → not included in ABI, which is correct.

Do not remove mint functions or params struct definitions from ABI.

⸻

✅ 6. Do not modify any JavaScript files (utils.js, mint.js, preview.js)

The JS dapp does not need any changes.
It will continue using the CBOR metadata or the new JSON seamlessly.

⸻

📌 Expected Result

After Copilot completes these modifications:
	•	The smart contract returns:
	•	SVG image preview for wallets
	•	Base64 JSON metadata formatted according to ERC-721
	•	MetaMask, OpenSea, and Linea explorers will display the generated SVG image.
	•	Your existing CBOR metadata remains untouched and usable for Lockb0x/Codex integrations.
	•	No refactoring of UI or minting code required.
