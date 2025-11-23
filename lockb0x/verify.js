// verify.js — Lockb0x NFT Verification Engine (ESM)
// ---------------------------------------------------------------------------
// This script:
//   • Connects to Linea via ethers v6 BrowserProvider
//   • Fetches tokenURI(tokenId)
//   • Extracts Base64 CBOR from the data URI
//   • Decodes CBOR using verify_cbor_decode.js
//   • Reconstructs SVG using verify_svg_renderer.js
//   • Displays the results in the verification panel
// ---------------------------------------------------------------------------

import { decodeCBOR } from "./verify_cbor_decode.js";
import { renderVerifiedSVG } from "./verify_svg_renderer.js";
import { fetchABI, fetchAddress, getEthers } from "./utils.js";

const verifyBtn = document.getElementById("verifyBtn");
const tokenInput = document.getElementById("tokenIdInput");

const statusEl = document.getElementById("status");
const metadataEl = document.getElementById("metadataOutput");
const svgEl = document.getElementById("verifiedPreview");

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function showStatus(msg, color = "#35eaff") {
    statusEl.innerHTML = `<span style="color:${color};">${msg}</span>`;
}

function showMetadata(obj) {
    let html = "<pre style='text-align:left; font-size:13px;'>";
    html += JSON.stringify(obj, null, 2);
    html += "</pre>";
    metadataEl.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Main Verification Handler
// ---------------------------------------------------------------------------

verifyBtn.addEventListener("click", async () => {
    try {
        const tokenId = parseInt(tokenInput.value.trim());
        if (isNaN(tokenId) || tokenId < 1) {
            showStatus("Invalid Token ID.", "#ff4b62");
            return;
        }

        showStatus("Connecting to network...");

        const { ethers } = await getEthers();
        const provider = new ethers.BrowserProvider(window.ethereum);

        const abi = await fetchABI();
        const address = await fetchAddress();

        const contract = new ethers.Contract(address, abi, provider);

        showStatus("Retrieving tokenURI...");

        let uri;
        try {
            uri = await contract.tokenURI(tokenId);
        } catch {
            showStatus("Token does not exist.", "#ff4b62");
            return;
        }

        if (!uri.startsWith("data:application/cbor;base64,")) {
            showStatus("Token URI format invalid or unsupported.", "#ff4b62");
            return;
        }

        // Extract Base64 payload
        const base64 = uri.split("base64,")[1];
        const rawBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        showStatus("Decoding CBOR...");

        let metadata;
        try {
            metadata = decodeCBOR(rawBytes);
        } catch (err) {
            console.error("CBOR decode error:", err);
            showStatus("Failed to parse CBOR metadata.", "#ff4b62");
            return;
        }

        showMetadata(metadata);

        // -------------------------------------------------------------------
        // Reconstruct SVG deterministically
        // -------------------------------------------------------------------

        showStatus("Reconstructing SVG...");

        svgEl.innerHTML = ""; // clear old preview

        const svg = renderVerifiedSVG(metadata);
        svgEl.appendChild(svg);

        showStatus("Verification complete.", "#5bffb5");

    } catch (err) {
        console.error(err);
        showStatus("Unexpected verification error.", "#ff4b62");
    }
});
