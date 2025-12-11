import {
    getTokenGatingState,
    checkPohAndPersist,
    checkPoh,
    checkPohStatus,
    getPohSignatureFromAPI
} from './session.js';

const POH_API_BASE = (window.APP_CONFIG && window.APP_CONFIG.POH_API_BASE) ? window.APP_CONFIG.POH_API_BASE : 'https://poh-api.linea.build/poh/v2/';


/**
 * Centralized eligibility logic for minting.
 * @param {string} address - Wallet address (required)
 * @param {string} tier - 'standard' | 'vip' | 'premium'
 * @param {boolean} hasSecretCode - Only for VIP tier
 * @returns {Promise<{eligible: boolean, reason: string|null, free: boolean, priceWei: bigint}>>}
 * Rules:
 *  - Only one mint per address (enforced via checkOwnership)
 *  - PoH users: Standard is free, VIP is free with secret code, Premium is paid
 *  - Non-PoH users: All tiers require payment
 */
export async function getMintEligibility(address, tier, hasSecretCode = false) {
    if (!address) return { eligible: false, reason: 'No wallet address.', free: false, priceWei: 0n };
    // 1. Already minted?
    let alreadyMinted = false;
    try {
        alreadyMinted = await checkOwnershipForAddress(address);
    } catch (e) {
        return { eligible: false, reason: 'Unable to check mint status.', free: false, priceWei: 0n };
    }
    if (alreadyMinted) {
        return { eligible: false, reason: 'You have already minted a Lockb0x Sigil NFT.', free: false, priceWei: 0n };
    }
    // 2. PoH status (on-demand check)
    const poh = await checkPohStatus(address);
    // 3. Tier logic
    let free = false;
    let priceWei = 0n;
    if (poh) {
        if (tier === 'standard') {
            free = true;
            priceWei = 0n;
        } else if (tier === 'vip') {
            if (hasSecretCode) {
                free = true;
                priceWei = 0n;
            } else {
                free = false;
                priceWei = getTierPrice('vip');
            }
        } else if (tier === 'premium') {
            free = false;
            priceWei = getTierPrice('premium');
        } else {
            return { eligible: false, reason: 'Unknown tier.', free: false, priceWei: 0n };
        }
    } else {
        // Not PoH: all tiers require payment
        if (tier === 'standard' || tier === 'vip') {
            free = false;
            priceWei = getTierPrice(tier);
        } else if (tier === 'premium') {
            free = false;
            priceWei = getTierPrice('premium');
        } else {
            return { eligible: false, reason: 'Unknown tier.', free: false, priceWei: 0n };
        }
    }
    return { eligible: true, reason: null, free, priceWei };
}

/**
 * Checks if the given address already owns a Lockb0x Sigil NFT (one mint per user).
 * Used by getMintEligibility. Defensive: does not throw, returns false on error.
 * @param {string} address
 * @returns {Promise<boolean>}
 */
export async function checkOwnershipForAddress(address) {
    try {
        if (!window.ethereum || !address) {
            console.warn("checkOwnershipForAddress: window.ethereum or address missing", { ethereum: window.ethereum, address });
            return false;
        }
        if (!window.SIGIL_CONTRACT_ADDRESS || !window.SIGIL_CONTRACT_ABI) {
            console.error("checkOwnershipForAddress: SIGIL_CONTRACT_ADDRESS or SIGIL_CONTRACT_ABI missing", {
                SIGIL_CONTRACT_ADDRESS: window.SIGIL_CONTRACT_ADDRESS,
                SIGIL_CONTRACT_ABI: window.SIGIL_CONTRACT_ABI
            });
            return false;
        }
        if (!window.ethers && typeof ethers === 'undefined') {
            console.error("checkOwnershipForAddress: ethers missing");
            return false;
        }
        // Use global ethers if available, fallback to window.ethers
        const ethersLib = typeof ethers !== 'undefined' ? ethers : window.ethers;
        const provider = new ethersLib.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = typeof network.chainId === 'bigint' ? network.chainId : BigInt(network.chainId);
        // Only check on Linea Sepolia (59141)
        if (chainId !== 59141n) {
            console.warn("checkOwnershipForAddress: Not on Linea Sepolia (59141)", { chainId });
            return false;
        }
        const contract = new ethersLib.Contract(window.SIGIL_CONTRACT_ADDRESS, window.SIGIL_CONTRACT_ABI, provider);
        if (typeof contract.balanceOf !== 'function') {
            console.error("checkOwnershipForAddress: contract.balanceOf is not a function");
            return false;
        }
        const balance = await contract.balanceOf(address);
        console.log("checkOwnershipForAddress: balanceOf result", { address, balance });
        return (typeof balance === 'bigint' ? balance : BigInt(balance)) > 0n;
    } catch (err) {
        console.error("checkOwnershipForAddress: error", err);
        return false;
    }
}
// PoH signature helpers removed - now using on-demand API checks via session.js
/**
 * Lockb0x Token-Gating Utilities
 * Centralizes all wallet/PoH state, event registration, debug mode, and error handling.
 * Use only these helpers for all token-gating logic throughout the app.
 */
// --- Web3/MetaMask/PoH Gating Helpers ---
// Debug mode for logging state transitions
let _debugMode = false;
export function setDebugMode(enabled) {
    _debugMode = !!enabled;
}

// Global error handler for gating failures
let _globalGatingErrorHandler = null;
export function setGatingErrorHandler(fn) {
    _globalGatingErrorHandler = fn;
}

function logDebug(...args) {
    if (_debugMode) console.debug('[TokenGating]', ...args);
}
// getTokenGatingState is now exported from session.js - no local implementation needed
// Check if MetaMask is installed
export function isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
}

// Check if MetaMask is connected (wallet address present)
export async function isMetaMaskConnected() {
    if (!isMetaMaskInstalled()) return false;
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return Array.isArray(accounts) && accounts.length > 0;
    } catch {
        return false;
    }
}

// Get current wallet address (async)
export async function getCurrentWalletAddress() {
    if (!isMetaMaskInstalled()) return null;
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
    } catch {
        return null;
    }
}


/**
 * Registers wallet/account/chain change event handlers. Callback is called after flags are cleared.
 * @param {Function} callback
 */
// Register wallet event handlers (no clearing of PoH or wallet)
export function registerWalletEventHandlers(callback) {
    if (window.ethereum) {
        window.ethereum.on && window.ethereum.on('accountsChanged', () => {
            if (typeof callback === 'function') callback();
        });
        window.ethereum.on && window.ethereum.on('chainChanged', () => {
            if (typeof callback === 'function') callback();
        });
    }
}
;

// Export TIER_PRICE for compatibility with import { TIER_PRICE }
export const TIER_PRICE = {
    standard: window.ethers?.parseEther ? window.ethers.parseEther("0.01") : "0.01",
    vip: window.ethers?.parseEther ? window.ethers.parseEther("0.01") : "0.01",
    premium: window.ethers?.parseEther ? window.ethers.parseEther("0.05") : "0.05"
};

// checkPohAndPersist is now exported from session.js - no local implementation needed
// utils.js — Shared helpers for Lockb0x Symbol Designer & Mint
// Uses ESM but expects ethers.min.js (UMD) to already be loaded globally.

export function assert(condition, message) {
    if (!condition) throw new Error(message || "Assertion failed");
}

// Clamp helpers --------------------------------------------------------------

export function clamp360(x) {
    x = Number(x);
    if (isNaN(x)) return 0;
    return ((x % 360) + 360) % 360;
}

export function clamp01(v) {
    v = Number(v);
    if (isNaN(v)) return 0;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
}

// -------------------------------------------------------------
// GLOBAL SHARED PROVIDER INSTANCE
// -------------------------------------------------------------
let _provider = null;

export function getProvider() {
    if (_provider) return _provider;

    if (!window.ethereum)
        throw new Error("MetaMask not available");

    // Use global ethers if available, fallback to window.ethers
    const ethersLib = typeof ethers !== 'undefined' ? ethers : window.ethers;
    if (!ethersLib || !ethersLib.BrowserProvider) {
        throw new Error("ethers.js BrowserProvider not available");
    }

    // Create provider exactly once
    _provider = new ethersLib.BrowserProvider(window.ethereum);
    return _provider;
}

// -------------------------------------------------------------
// NETWORK HELPERS
// -------------------------------------------------------------

async function ensureNetwork(targetChainId, chainIdHex, friendlyName) {
    if (!window.ethereum) throw new Error("MetaMask not available");

    // Use global ethers if available, fallback to window.ethers
    const ethersLib = typeof ethers !== 'undefined' ? ethers : window.ethers;
    if (!ethersLib || !ethersLib.BrowserProvider) {
        throw new Error("ethers.js BrowserProvider not available");
    }

    let provider = new ethersLib.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (network.chainId !== targetChainId) {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: chainIdHex }],
            });
            provider = new ethersLib.BrowserProvider(window.ethereum);
        } catch (err) {
            throw new Error(`Please switch to the ${friendlyName} network.`);
        }
    }

    return provider;
}

export function ensureLineaSepolia() {
    return ensureNetwork(59141n, "0xE705", "Linea Sepolia");
}

export function ensureLineaMainnet() {
    return ensureNetwork(59144n, "0xE708", "Linea Mainnet");
}

// -------------------------------------------------------------
// SIGNER (NEVER REQUEST PERMISSIONS HERE)
// -------------------------------------------------------------
export async function getSigner() {
    const provider = getProvider();

    // Do NOT call eth_requestAccounts
    const accounts = await provider.send("eth_accounts", []);

    if (!accounts || accounts.length === 0) {
        throw new Error("No connected wallet");
    }

    return await provider.getSigner();
}

// Address + ABI loading ------------------------------------------------------

export async function fetchAddress() {
    if (!window.SIGIL_CONTRACT_ADDRESS)
        throw new Error("SIGIL_CONTRACT_ADDRESS not set");
    return window.SIGIL_CONTRACT_ADDRESS;
}

export async function fetchAbi() {
    if (!window.SIGIL_CONTRACT_ABI)
        throw new Error("SIGIL_CONTRACT_ABI not set");
    return window.SIGIL_CONTRACT_ABI;
}

// Contract factory -----------------------------------------------------------

export async function getContract() {
    const address = await fetchAddress();
    const abi = await fetchAbi();

    const signer = await getSigner();
    return new window.ethers.Contract(address, abi, signer);
}


// Read Params from UI — tier-aware & contract-safe
export function readParams(tier) {

    const bgHue        = clamp360(Number(document.getElementById("bgHue").value));
    const primaryHue   = clamp360(Number(document.getElementById("primaryHue").value));
    const secondaryHue = clamp360(Number(document.getElementById("secondaryHue").value));
    const tilt         = Number(document.getElementById("tilt").value);
    const stroke       = Number(document.getElementById("stroke").value);
    const glow         = Number(document.getElementById("glow").value);
    const variant      = Number(document.getElementById("variantSelect").value);

    const maxVariant = (tier === "standard") ? 3 : 15;

    // Construct params using EXACT Solidity types
    const p = {
        bgHue:        Number(bgHue),        // uint16
        primaryHue:   Number(primaryHue),   // uint16
        secondaryHue: Number(secondaryHue), // uint16
        tilt:         Number(tilt),         // int8
        strokeTenths: Number(stroke),       // uint8
        glowPercent:  Number(glow),         // uint8
        variant:      Number(variant)       // uint8
    };

    // Client-side validation — prevents ALL contract reverts
    if (p.bgHue < 0 || p.bgHue >= 360) throw new Error("bgHue out of range");
    if (p.primaryHue < 0 || p.primaryHue >= 360) throw new Error("primaryHue out of range");
    if (p.secondaryHue < 0 || p.secondaryHue >= 360) throw new Error("secondaryHue out of range");
    if (p.tilt < -18 || p.tilt > 18) throw new Error("tilt out of range");
    if (p.strokeTenths < 10 || p.strokeTenths > 40) throw new Error("stroke out of range");
    if (p.glowPercent < 20 || p.glowPercent > 90) throw new Error("glow out of range");

    if (p.variant < 1 || p.variant > maxVariant)
        throw new Error(`Variant ${p.variant} not allowed for ${tier} tier`);

    return p;
}



/**
 * Wallet connection for Linea Sepolia.
 * Requests wallet access, ensures correct network, returns signer.
 * Throws on failure.
 */
export async function connectWallet() {
    if (!window.ethereum) {
        throw new Error("MetaMask is required.");
    }
    // Request wallet connection
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

    // Ensure the wallet is on Linea Sepolia
    const provider = await ensureLineaSepolia();

    // Persist the connected wallet for gating state
    if (Array.isArray(accounts) && accounts.length > 0) {
        setWalletConnected(accounts[0]);
    }

    // Return signer for connected wallet
    return await provider.getSigner();
}



// Price table ---------------------------------------------------------------

export function getTierPrice(tier) {
    if (!window.ethers || typeof window.ethers.parseEther !== "function") {
        throw new Error("ethers.js not loaded");
    }
    switch (tier) {
        case "standard":
        case "vip":
            return window.ethers.parseEther("0.01");
        case "premium":
            return window.ethers.parseEther("0.05");
        default:
            throw new Error("Unknown tier: " + tier);
    }
}

export {
    getTokenGatingState,
    checkPohAndPersist,
    checkPoh,
    checkPohStatus,
    getPohSignatureFromAPI,
    getWalletConnected,
    setWalletConnected
  } from './session.js';

// Note: checkOwnershipForAddress is already exported above (line 79)