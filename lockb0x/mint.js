// mint.js — FINAL CLEAN VERSION
// ---------------------------------------------------------------------

import {
    connectWallet,
    getSigner,
    getContract,
    readParams,
    checkOwnership,
    TIER_PRICE,
    getTokenGatingState,
    registerWalletEventHandlers,
    setDebugMode,
    setGatingErrorHandler
} from "./utils.js";
// Enable debug mode for development (set to false in production)
setDebugMode(true);

// Global error handler for gating failures
setGatingErrorHandler((err) => {
    mintStatus.textContent = 'Token-gating error: ' + err;
    mintStatus.style.color = '#f66';
    console.error('[TokenGating] Error:', err);
});

// Register wallet/account/chain event handlers to always update UI (optional for mint page)
registerWalletEventHandlers(() => {
    mintStatus.textContent = 'Wallet/account changed. Please verify again.';
    mintStatus.style.color = '#f66';
    mintBtn.disabled = false;
    mintBtn.style.opacity = "1";
});

const mintBtn = document.getElementById("mintBtn");
const tierSelect = document.getElementById("tierSelect");
const tierPrice = document.getElementById("tierPrice");
const secretCodeWrapper = document.getElementById("secretCodeWrapper");
const mintStatus = document.getElementById("mintStatus");
const variantSelect = document.getElementById("variantSelect");

// Wallet connection is now handled centrally via utils.js and index.html gating logic.

// ---------------------------------------------------------------------
// 2. TIER UI logic
// ---------------------------------------------------------------------

tierSelect.addEventListener("change", () => {
    const tier = tierSelect.value;
    secretCodeWrapper.style.display = tier === "intermediate" ? "block" : "none";
    if(tier === "intermediate") {
        tierPrice.innerText = `Price: .01 ETH + secret code`;
        variant4.style.display = "block";
        variant5.style.display = "block";
        variant6.style.display = "block";
        variant7.style.display = "block";
        variant8.style.display = "block";
        variant9.style.display = "block";
        
    } else if(tier === "standard") {
        variant4.style.display = "none";
        variant5.style.display = "none";
        variant6.style.display = "none";
        variant7.style.display = "none";
        variant8.style.display = "none";
        variant9.style.display = "none";
        
        tierPrice.innerText = `Price: .01 ETH`;
    }
    else if(tier === "premium") {
        tierPrice.innerText = `Price: .05 ETH`;
        variant4.style.display = "block";
        variant5.style.display = "block";
        variant6.style.display = "block";
        variant7.style.display = "block";
        variant8.style.display = "block";
        variant9.style.display = "block";
    }

});
// 3. MINT NFT
// ---------------------------------------------------------------------

mintBtn.addEventListener("click", async () => {
    try {
        // Centralized gating check
        const { connected, wallet, poh, error } = await getTokenGatingState();
        if (!connected || !wallet || !poh) {
            mintStatus.textContent = error ? `Mint blocked: ${error}` : "Mint blocked: PoH verification and wallet connection required.";
            mintStatus.style.color = "#f66";
            mintBtn.disabled = false;
            mintBtn.style.opacity = "1";
            return;
        }
        mintStatus.textContent = "Preparing mint…";
        mintStatus.style.color = "#ccc";

        // Retrieve PoH signature from localStorage, keyed by wallet address
        // This must be set after successful PoH verification elsewhere in the app
        const pohSignature = localStorage.getItem(`pohSig:${wallet}`);
        if (!pohSignature) {
            mintStatus.textContent = "PoH signature missing. Please re-verify your humanity.";
            mintStatus.style.color = "#f66";
            return;
        }

        // Make sure wallet is connected (throws if not)
        const signer = await getSigner();

        // Check for existing NFT again (safety)
        const already = await checkOwnership();
        if (already) {
            mintStatus.textContent = "You already minted this NFT.";
            mintStatus.style.color = "#f66";
            mintBtn.disabled = true;
            return;
        }

        const tier = tierSelect.value;
        const params = readParams(tier);     // safe validation included
        const contract = await getContract();
        const priceWei = TIER_PRICE[tier];

        // Log parameters for debugging
        console.log("Mint parameters:", { tier, params, priceWei, wallet });

        let tx;
        let codeHash = null;

        if (tier === "standard") {
            console.log("Calling mintStandard", params);
            // Pass PoH signature as required by contract
            tx = await contract.mintStandard(params, pohSignature, { value: priceWei });
        }
        else if (tier === "intermediate") {
            const code = document.getElementById("secretCode").value.trim();
            if (!code) {
                mintStatus.textContent = "Secret code required.";
                mintStatus.style.color = "#f66";
                return;
            }
            codeHash = window.ethers.keccak256(
                window.ethers.toUtf8Bytes(code)
            );
            console.log("Calling mintIntermediate", { params, codeHash });
            tx = await contract.mintIntermediate(params, codeHash, pohSignature, {
                value: priceWei
            });
        }
        else if (tier === "premium") {
            console.log("Calling mintPremium", params);
            tx = await contract.mintPremium(params, pohSignature, { value: priceWei });
        }

        if (!tx) {
            throw new Error("Transaction creation failed.");
        }

        mintStatus.textContent = "Minting… awaiting confirmation.";
        mintStatus.style.color = "#fff";

        const receipt = await tx.wait();

        mintStatus.textContent = `Mint successful! Tx: ${receipt.hash}`;
        mintStatus.style.color = "#8f8";
    }
    catch (err) {
        // Enhanced error reporting
        console.error("Mint error:", err);
        let details = err?.message || "Mint failed. Check console.";
        if (err?.reason) details += `\nReason: ${err.reason}`;
        if (err?.code) details += `\nCode: ${err.code}`;
        if (err?.data) details += `\nData: ${JSON.stringify(err.data)}`;
        if (err?.transaction) details += `\nTx: ${JSON.stringify(err.transaction)}`;
        mintStatus.textContent = `Mint failed.\n${details}`;
        mintStatus.style.color = "#f66";
    }
// Documentation:
// - PoH signature is stored in localStorage after successful verification, keyed as `pohSig:<walletAddress>`
// - This signature is required for all minting contract calls and is passed as a bytes argument
// - If the signature is missing, the user is prompted to re-verify their humanity
// - All other UI and blockchain logic is preserved
});

document.addEventListener("DOMContentLoaded", () => {
    // Set initial tier selection
    tierSelect.value = "standard";
    // Show only variants 1-3, hide 4-6
    variant4.style.display = "none";
    variant5.style.display = "none";
    variant6.style.display = "none";
    variant7.style.display = "none";
    variant8.style.display = "none";
    variant9.style.display = "none";
    
    // Set price display
    tierPrice.innerText = `Price: .01 ETH`;
    // Hide secret code input
    secretCodeWrapper.style.display = "none";
});