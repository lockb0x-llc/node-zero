import { getSigner, getContract, readParams } from "./utils.js";
import { getPohSignatureFromAPI } from "./session.js";

/**
 * Mint NFT using PoH free mint
 * @param {string} address - Wallet address
 * @param {string} tier - Minting tier
 * @param {HTMLElement} statusElement - Element to display status messages
 */
export async function mintPoh(address, tier, statusElement) {
    try {
        if (statusElement) {
            statusElement.textContent = "Requesting PoH signature…";
            statusElement.style.color = "#ccc";
        }

        const signer = await getSigner();
        const contract = await getContract();

        // Fetch signature from PoH Signer API
        const signatureHex = await getPohSignatureFromAPI(address);
        if (!signatureHex) {
            throw new Error("Failed to retrieve PoH signature. Please ensure you have completed Proof of Humanity verification.");
        }

        // Convert hex string to bytes for contract
        const signature = window.ethers.getBytes(signatureHex);

        const params = readParams(tier);

        if (statusElement) {
            statusElement.textContent = "Submitting PoH transaction…";
        }

        const tx = await contract.mintPoHFree(params, signature);
        const receipt = await tx.wait();

        if (statusElement) {
            statusElement.textContent = `PoH mint successful! Tx: ${receipt.hash}`;
            statusElement.style.color = "#8f8";
        }
    }
    catch (err) {
        console.error("PoH mint error:", err);
        const errorMsg = err?.reason || err?.message || "PoH mint failed.";
        if (statusElement) {
            statusElement.textContent = errorMsg;
            statusElement.style.color = "#f66";
        }
        throw err;
    }
}
