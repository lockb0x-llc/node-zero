
// mint.js - NFT minting logic for Lockb0x
// ---------------------------------------------------------------------
import {
    connectWallet,
    getSigner,
    getContract,
    readParams,
    getMintEligibility,
    getTokenGatingState,
    registerWalletEventHandlers,
    setDebugMode,
    setGatingErrorHandler,
    checkPohStatus
} from "./utils.js";
import { mintPoh } from "./mint-poh.js";



// Enable debug mode for development (set to false in production)
setDebugMode(true);

const mintBtn = document.getElementById("mintBtn");
const tierSelect = document.getElementById("tierSelect");
const tierPrice = document.getElementById("tierPrice");
const secretCodeWrapper = document.getElementById("secretCodeWrapper");
const mintStatus = document.getElementById("mintStatus");
const variantSelect = document.getElementById("variantSelect");




async function updateTierUI() {
    const tier = tierSelect.value;
    // Ensure all variant option elements are available
    const variant4 = document.getElementById("variant4");
    const variant5 = document.getElementById("variant5");
    const variant6 = document.getElementById("variant6");
    const variant7 = document.getElementById("variant7");
    const variant8 = document.getElementById("variant8");
    const variant9 = document.getElementById("variant9");
    // Secret code wrapper
    secretCodeWrapper.style.display = tier === "vip" ? "block" : "none";
    if (tier === "vip") {
        if (variant4) variant4.style.display = "block";
        if (variant5) variant5.style.display = "block";
        if (variant6) variant6.style.display = "block";
        if (variant7) variant7.style.display = "block";
        if (variant8) variant8.style.display = "block";
        if (variant9) variant9.style.display = "block";
    } else if (tier === "standard") {
        if (variant4) variant4.style.display = "none";
        if (variant5) variant5.style.display = "none";
        if (variant6) variant6.style.display = "none";
        if (variant7) variant7.style.display = "none";
        if (variant8) variant8.style.display = "none";
        if (variant9) variant9.style.display = "none";
    } else if (tier === "premium") {
        if (variant4) variant4.style.display = "block";
        if (variant5) variant5.style.display = "block";
        if (variant6) variant6.style.display = "block";
        if (variant7) variant7.style.display = "block";
        if (variant8) variant8.style.display = "block";
        if (variant9) variant9.style.display = "block";
    }

    // Show eligibility and price
    const { connected, wallet } = await getTokenGatingState();
    const hasSecretCode = tier === "vip" && document.getElementById("secretCode").value.trim().length > 0;
    if (!connected || !wallet) {
        tierPrice.innerText = `Connect your wallet to see price and eligibility.`;
        mintBtn.disabled = true;
        return;
    }
    const eligibility = await getMintEligibility(wallet, tier, hasSecretCode);
    if (!eligibility.eligible) {
        tierPrice.innerText = eligibility.reason || "Not eligible to mint.";
        mintBtn.disabled = true;
    } else {
        if (eligibility.free) {
            tierPrice.innerText = `Free mint! (gas required)`;
        } else {
            if (tier === "vip" && hasSecretCode) {
                tierPrice.innerText = `Free with secret code! (gas required)`;
            } else {
                tierPrice.innerText = `Price: ${(tier === "premium") ? ".05" : ".01"} LineaETH${tier === "vip" ? " + secret code" : ""}`;
            }
        
        mintBtn.disabled = false;
    }
}
}

tierSelect.addEventListener("change", updateTierUI);
if (document.getElementById("secretCode")) {
    document.getElementById("secretCode").addEventListener("input", updateTierUI);
}
registerWalletEventHandlers(updateTierUI);
document.addEventListener("DOMContentLoaded", updateTierUI);
// 3. MINT NFT
// ---------------------------------------------------------------------

mintBtn.addEventListener("click", async () => {
    async function performMint() {
        try {
        mintStatus.textContent = "Preparing mint...";
        mintStatus.style.color = "#ccc";
        try {
            // Centralized gating check
            const { connected, wallet, error } = await getTokenGatingState();
            if (!connected || !wallet) {
                let msg = error ? `Mint blocked: ${error}` : "Mint blocked: Wallet connection required.";
                if(!connected) {
                    msg = "Mint blocked: Wallet not connected.";
                } else if (!wallet) {
                    msg = "Mint blocked: Wallet address not found.";
                }

                mintStatus.textContent = msg;
                mintStatus.style.color = "#f66";
                mintBtn.disabled = false;
                mintBtn.style.opacity = "1";
                return;
            }

            const tier = tierSelect.value;
            const hasSecretCode = tier === "vip" && document.getElementById("secretCode").value.trim().length > 0;
            // Use centralized eligibility logic
            const eligibility = await getMintEligibility(wallet, tier, hasSecretCode);
            if (!eligibility.eligible) {
                mintStatus.textContent = eligibility.reason || "You are not eligible to mint.";
                mintStatus.style.color = "#f66";
                mintBtn.disabled = true;
                return;
            }

            // Make sure wallet is connected (throws if not)
            const signer = await getSigner();
            const params = readParams(tier); // safe validation included
            const contract = await getContract();
            const priceWei = eligibility.priceWei;

            // Log parameters for debugging
            console.log("Mint parameters:", { tier, params, priceWei, wallet, eligibility });

            let tx;
            let codeHash = null;

            // Check if user is PoH verified for free standard tier mint
            if (tier === "standard") {
                const isPoh = await checkPohStatus(wallet);
                if (isPoh) {
                    // Use mintPoh function for free PoH mint
                    try {
                        await mintPoh(wallet, tier, mintStatus);
                        return; // mintPoh handles the transaction and status updates
                    } catch (err) {
                        // Error already handled in mintPoh, just return
                        return;
                    }
                }
                // Fall through to paid standard mint if not PoH verified
            }
            
            // Paid minting paths (standard without PoH, VIP, Premium)
            if (tier === "standard") {
                tx = await contract.mintStandard(params, { value: priceWei });
            } else if (tier === "vip") {
                const code = document.getElementById("secretCode").value.trim();
                if (!hasSecretCode) {
                    mintStatus.textContent = "Secret code required.";
                    mintStatus.style.color = "#f66";
                    return;
                }
                codeHash = window.ethers.keccak256(
                    window.ethers.toUtf8Bytes(code)
                );
                tx = await contract.mintVIP(params, codeHash, { value: priceWei });
            } else if (tier === "premium") {
                tx = await contract.mintPremium(params, { value: priceWei });
            }

            if (!tx) {
                throw new Error("Transaction creation failed.");
            }

            // Wait for transaction and handle errors
            try {
                const receipt = await tx.wait();
                mintStatus.textContent = "Mint successful!";
                mintStatus.style.color = "#0f0";
            } catch (err) {
                let errorMsg = "Mint failed. ";
                if (err?.reason) {
                    errorMsg += err.reason;
                } else if (err?.error?.message) {
                    errorMsg += err.error.message;
                } else if (err?.data) {
                    errorMsg += `Error data: ${err.data}`;
                } else if (err?.message) {
                    errorMsg += err.message;
                } else {
                    errorMsg += JSON.stringify(err);
                }
                mintStatus.textContent = errorMsg;
                mintStatus.style.color = "#f66";
                console.error("Mint error:", err);
            }
        } catch (err) {
            // Enhanced error reporting for outer errors
            console.error("Mint error:", err);
            let details = err?.message || "Mint failed. Check console.";
            if (err?.reason) details += `\nReason: ${err.reason}`;
            if (err?.code) details += `\nCode: ${err.code}`;
            if (err?.data) details += `\nData: ${JSON.stringify(err.data)}`;
            if (err?.transaction) details += `\nTx: ${JSON.stringify(err.transaction)}`;
            mintStatus.textContent = `Mint failed.\n${details}`;
            mintStatus.style.color = "#f66";
        }
        } catch (err) {
            // Enhanced error reporting for outer errors
            console.error("Mint error:", err);
            let details = err?.message || "Mint failed. Check console.";
            if (err?.reason) details += `\nReason: ${err.reason}`;
            if (err?.code) details += `\nCode: ${err.code}`;
            if (err?.data) details += `\nData: ${JSON.stringify(err.data)}`;
            if (err?.transaction) details += `\nTx: ${JSON.stringify(err.transaction)}`;
            mintStatus.textContent = `Mint failed.\n${details}`;
            mintStatus.style.color = "#f66";
        }
    }
    performMint();
});
// ---------------------------------------------------------------------
// END OF FILE
// ---------------------------------------------------------------------