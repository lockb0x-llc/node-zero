// --- PoH Signature Storage & Retrieval Helpers ---
// These helpers store and retrieve the PoH signature for a given address in localStorage.
// The signature is public and permanent for each address, and is reused for all future operations.

// Retrieve the PoH signature for the given address (returns string|null)
export function getPohSignature(address) {
    if (!address) return null;
    const key = `poh_signature_${address.toLowerCase()}`;
    return localStorage.getItem(key);
}

// Set PoH signature for the given address (for testing or manual override)
export function setPohSignature(address, signature) {
    if (!address || !signature) throw new Error('Address and signature required');
    const key = `poh_signature_${address.toLowerCase()}`;
    localStorage.setItem(key, signature);
}

// Check if PoH is verified for the given address (returns boolean)
// This is true if a signature exists in localStorage for the address.
export function isPohSignatureVerified(address) {
    return !!getPohSignature(address);
}
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
/**
 * Returns the current token-gating state.
 * @returns {Promise<{connected: boolean, wallet: string|null, poh: boolean, error: string|null}>}
 */
export async function getTokenGatingState() {
    let connected = false, wallet = null, poh = false, error = null;
    try {
        connected = await isMetaMaskConnected();
        wallet = getWalletConnected();
        poh = await isPohVerified();
    } catch (e) {
        error = e?.message || String(e);
        if (_globalGatingErrorHandler) _globalGatingErrorHandler(error);
    }
    logDebug('Gating state:', { connected, wallet, poh, error });
    return { connected, wallet, poh, error };
}
const LOCAL_POH_KEY = 'nodezero_poh_v1';
const LOCAL_WALLET_KEY = 'nodezero_wallet_connected_v1';
// Set wallet connection state in localStorage
export function setWalletConnected(address) {
    if (address) {
        localStorage.setItem(LOCAL_WALLET_KEY, address.toLowerCase());
    } else {
        localStorage.removeItem(LOCAL_WALLET_KEY);
    }
}

// Get wallet connection state from localStorage
export function getWalletConnected() {
    return localStorage.getItem(LOCAL_WALLET_KEY) || null;
}

// Clear both wallet and PoH flags
export function clearWalletAndPohFlags() {
    localStorage.removeItem(LOCAL_WALLET_KEY);
    localStorage.removeItem(LOCAL_POH_KEY);
    logDebug('Cleared wallet and PoH flags');
}
const POH_API_BASE = (window.APP_CONFIG && window.APP_CONFIG.POH_API_BASE) ? window.APP_CONFIG.POH_API_BASE : 'https://poh-api.linea.build/poh/v2/';

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
 * Bullet-proof PoH check: checks localStorage, current wallet, and API
 * @returns {Promise<boolean>}
 */
export async function isPohVerified() {
    try {
        const raw = localStorage.getItem(LOCAL_POH_KEY);
        const wallet = localStorage.getItem(LOCAL_WALLET_KEY);
        if (!raw || !wallet) return false;
        const payload = JSON.parse(raw);
        if (!payload || !payload.address) return false;
        const currentAddress = await getCurrentWalletAddress();
        if (!currentAddress || currentAddress.toLowerCase() !== payload.address.toLowerCase() || currentAddress.toLowerCase() !== wallet) {
            // Address mismatch, clear both
            clearWalletAndPohFlags();
            return false;
        }
        // Double-check with API
        const resp = await fetch(`${POH_API_BASE}${currentAddress}`);
        if (!resp.ok) {
            clearWalletAndPohFlags();
            return false;
        }
        const text = (await resp.text()).trim();
        if (text === 'true') {
            return true;
        } else {
            clearWalletAndPohFlags();
            return false;
        }
    } catch (e) {
        clearWalletAndPohFlags();
        if (_globalGatingErrorHandler) _globalGatingErrorHandler(e?.message || String(e));
        return false;
    }
}
/**
 * Registers wallet/account/chain change event handlers. Callback is called after flags are cleared.
 * @param {Function} callback
 */
export function registerWalletEventHandlers(callback) {
    if (window.ethereum) {
        window.ethereum.on && window.ethereum.on('accountsChanged', () => {
            clearWalletAndPohFlags();
            if (typeof callback === 'function') callback();
        });
        window.ethereum.on && window.ethereum.on('chainChanged', () => {
            clearWalletAndPohFlags();
            if (typeof callback === 'function') callback();
        });
    }
}

// Alias for compatibility with import { isPoHVerified }
export const isPoHVerified = isPohVerified;
// Export TIER_PRICE for compatibility with import { TIER_PRICE }
export const TIER_PRICE = {
    standard: window.ethers?.parseEther ? window.ethers.parseEther("0.01") : "0.01",
    intermediate: window.ethers?.parseEther ? window.ethers.parseEther("0.01") : "0.01",
    premium: window.ethers?.parseEther ? window.ethers.parseEther("0.05") : "0.05"
};

// Check PoH for current wallet, persist if verified, returns {status, address, error}
/**
 * Check PoH and persist signature if not already present.
 * If address is not provided, uses the currently connected wallet address (async).
 * This restores backward compatibility with previous usage in index.html and other callers.
 *
 * @param {string} [address] - The wallet address to check. If omitted, uses current wallet.
 * @param {function} pohVerifyFn - (Optional) A function to perform PoH verification and return the signature.
 * @returns {Promise<{ status: boolean, address: string|null, signature: string|null, error: string|null }>} 
 */
export async function checkPohAndPersist(address, pohVerifyFn) {
    let resolvedAddress = address;
    if (!resolvedAddress) {
        resolvedAddress = await getCurrentWalletAddress();
    }
    // If still no address, prompt user to connect wallet
    if (!resolvedAddress && window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (Array.isArray(accounts) && accounts.length > 0) {
                resolvedAddress = accounts[0];
            }
        } catch (e) {
            clearWalletAndPohFlags();
            return { status: false, address: null, signature: null, error: 'Wallet connection rejected.' };
        }
    }
    if (!resolvedAddress) {
        clearWalletAndPohFlags();
        return { status: false, address: null, signature: null, error: 'No address provided.' };
    }
    // 1. Check for existing signature
    let signature = getPohSignature(resolvedAddress);
    if (signature) {
        return { status: true, address: resolvedAddress, signature, error: null };
    }
    // 2. Perform PoH verification (default: API check, or custom function)
    try {
        let resultSignature;
        if (typeof pohVerifyFn === 'function') {
            resultSignature = await pohVerifyFn(resolvedAddress);
        } else {
            // Default: check API, and use a dummy signature if verified
            const resp = await fetch(`${POH_API_BASE}${resolvedAddress}`);
            if (!resp.ok) {
                clearWalletAndPohFlags();
                return { status: false, address: resolvedAddress, signature: null, error: 'Unable to contact Linea PoH service. Please try again later.' };
            }
            const text = (await resp.text()).trim();
            if (text === 'true') {
                // In a real implementation, obtain the actual signature from the PoH service
                resultSignature = `dummy_signature_for_${resolvedAddress}`;
            } else {
                clearWalletAndPohFlags();
                return { status: false, address: resolvedAddress, signature: null, error: 'No Proof of Humanity found for this wallet.' };
            }
        }
        if (!resultSignature) {
            clearWalletAndPohFlags();
            return { status: false, address: resolvedAddress, signature: null, error: 'PoH verification failed.' };
        }
        setPohSignature(resolvedAddress, resultSignature);
        return { status: true, address: resolvedAddress, signature: resultSignature, error: null };
    } catch (err) {
        clearWalletAndPohFlags();
        return { status: false, address: resolvedAddress, signature: null, error: err?.message || String(err) };
    }
}
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

    // Create provider exactly once
    _provider = new window.ethers.BrowserProvider(window.ethereum);
    return _provider;
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
    const res = await fetch("./contract-address.json");
    const json = await res.json();

    if (!json.address)
        throw new Error("contract-address.json missing 'address' field");

    return json.address;
}

export async function fetchAbi() {
    const res = await fetch("./abi.json");
    const json = await res.json();

    if (!Array.isArray(json))
        throw new Error("ABI file malformed");

    return json;
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
    await window.ethereum.request({ method: "eth_requestAccounts" });

    // Create provider for Linea Sepolia, ENS disabled
    const provider = new window.ethers.BrowserProvider(window.ethereum, {
        chainId: 59141,
        name: "linea-sepolia",
        ensAddress: null
    });

    // Check network; prompt switch if needed
    const network = await provider.getNetwork();
    if (network.chainId !== 59141n) {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0xe704" }] // 59141 hex
            });
        } catch (switchErr) {
            throw new Error("Please switch to the Linea Sepolia network.");
        }
    }

    // Return signer for connected wallet
    return await provider.getSigner();
}

export async function checkOwnership() {
    const contract = await getContract();
    const signer = await getSigner();
    const address = await signer.getAddress();
    // Defensive: ensure contract has balanceOf method
    if (typeof contract.balanceOf !== "function") {
        throw new Error("Contract does not support balanceOf");
    }
    let balance;
    try {
        balance = await contract.balanceOf(address);
    } catch (err) {
        throw new Error("Failed to check ownership: " + (err?.message || err));
    }
    // ethers.js v6 returns BigInt
    return (typeof balance === "bigint" ? balance : BigInt(balance)) > 0n;
}


// Price table ---------------------------------------------------------------

export function getTierPrice(tier) {
    if (!window.ethers || typeof window.ethers.parseEther !== "function") {
        throw new Error("ethers.js not loaded");
    }
    switch (tier) {
        case "standard":
        case "intermediate":
            return window.ethers.parseEther("0.01");
        case "premium":
            return window.ethers.parseEther("0.05");
        default:
            throw new Error("Unknown tier: " + tier);
    }
}