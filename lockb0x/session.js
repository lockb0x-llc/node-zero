// session.js - Wallet connection, expiry, PoH on-demand checks, gating state, debug/error

export const LOCAL_WALLET_KEY = 'nodezero_wallet_connected_v2';

// PoH API endpoints
const POH_API_BASE = (window.APP_CONFIG && window.APP_CONFIG.POH_API_BASE) ? window.APP_CONFIG.POH_API_BASE : 'https://poh-api.linea.build/poh/v2/';
const POH_SIGNER_API_BASE = (window.APP_CONFIG && window.APP_CONFIG.POH_SIGNER_API_BASE) ? window.APP_CONFIG.POH_SIGNER_API_BASE : 'https://poh-signer-api.linea.build/poh/v2/';

/**
 * Check PoH status on-demand via API (no persistence)
 * @param {string} address - Wallet address to check
 * @returns {Promise<boolean>} True if address has PoH verification
 */
export async function checkPohStatus(address) {
    if (!address) return false;
    try {
        const resp = await fetch(`${POH_API_BASE}${address}`);
        if (!resp.ok) return false;
        const text = (await resp.text()).trim();
        return text === 'true';
    } catch (err) {
        console.error('checkPohStatus error:', err);
        return false;
    }
}

/**
 * Get PoH signature from PoH Signer API (no persistence)
 * @param {string} address - Wallet address
 * @returns {Promise<string|null>} Hex signature string or null if not verified
 */
export async function getPohSignatureFromAPI(address) {
    if (!address) return null;
    try {
        const resp = await fetch(`${POH_SIGNER_API_BASE}${address}`);
        if (!resp.ok) {
            if (resp.status === 404) {
                return null; // No PoH verification for this address
            }
            throw new Error(`PoH Signer API error: ${resp.status}`);
        }
        const signature = (await resp.text()).trim();
        return signature || null;
    } catch (err) {
        console.error('getPohSignatureFromAPI error:', err);
        return null;
    }
}

/**
 * Check PoH for current wallet (on-demand, no persistence)
 * If address is not provided, uses the currently connected wallet address (async).
 * @param {string} [address] - The wallet address to check. If omitted, uses current wallet.
 * @returns {Promise<{ status: boolean, address: string|null, error: string|null }>} 
 */
export async function checkPoh(address) {
    let resolvedAddress = address;
    
    // If still no address, prompt user to connect wallet
    if (!resolvedAddress && window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (Array.isArray(accounts) && accounts.length > 0) {
                resolvedAddress = accounts[0];
            }
        } catch (e) {
            return { status: false, address: null, error: 'Wallet connection rejected.' };
        }
    }
    if (!resolvedAddress) {
        return { status: false, address: null, error: 'No address provided.' };
    }
    
    // Perform PoH verification via API
    try {
        const verified = await checkPohStatus(resolvedAddress);
        if (verified) {
            return { status: true, address: resolvedAddress, error: null };
        } else {
            return { status: false, address: resolvedAddress, error: 'No Proof of Humanity found for this wallet.' };
        }
    } catch (err) {
        return { status: false, address: resolvedAddress, error: err?.message || String(err) };
    }
}

// Backward compatibility alias
export const checkPohAndPersist = checkPoh;

/**
 * Returns true if PoH is verified for the currently connected wallet (on-demand check)
 */
export async function isPohVerified() {
    try {
        const wallet = getWalletConnected();
        if (!wallet) return false;
        return await checkPohStatus(wallet);
    } catch (e) {
        if (_globalGatingErrorHandler) _globalGatingErrorHandler(e?.message || String(e));
        return false;
    }
}

export function setWalletConnected(address) {
    if (!address) return;
    const data = {
        address: address.toLowerCase(),
        connectedAt: Date.now()
    };
    localStorage.setItem(LOCAL_WALLET_KEY, JSON.stringify(data));
}

export function getWalletConnected() {
    const data = localStorage.getItem(LOCAL_WALLET_KEY);
    if (!data) return null;
    try {
        const parsed = JSON.parse(data);
        if (Date.now() - parsed.connectedAt > 86400000) {
            localStorage.removeItem(LOCAL_WALLET_KEY);
            return null;
        }
        return parsed.address;
    } catch (e) {
        localStorage.removeItem(LOCAL_WALLET_KEY);
        return null;
    }
}

export function isWalletConnectionExpired() {
    const data = localStorage.getItem(LOCAL_WALLET_KEY);
    if (!data) return true;
    try {
        const parsed = JSON.parse(data);
        return (Date.now() - parsed.connectedAt > 86400000);
    } catch (e) {
        return true;
    }
}

// PoH persistence functions removed - now using on-demand API checks
// Removed: setPohVerified, isPohVerifiedForAddress, getPohSignature, setPohSignature, isPohSignatureVerified

let _debugMode = false;
export function setDebugMode(enabled) {
    _debugMode = !!enabled;
}

let _globalGatingErrorHandler = null;
export function setGatingErrorHandler(fn) {
    _globalGatingErrorHandler = fn;
}

function logDebug(...args) {
    if (_debugMode) console.debug('[TokenGating]', ...args);
}

/**
 * Returns the current token-gating state (on-demand PoH check)
 * @returns {Promise<{connected: boolean, wallet: string|null, poh: boolean, error: string|null}>}
 */
export async function getTokenGatingState() {
    let connected = false, wallet = null, poh = false, error = null;
    try {
        // Check MetaMask connection
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                connected = Array.isArray(accounts) && accounts.length > 0;
            } catch (e) {
                connected = false;
            }
        }
        
        // Get wallet from localStorage (if available)
        wallet = getWalletConnected();
        
        // Check PoH status on-demand
        if (wallet) {
            poh = await checkPohStatus(wallet);
        }
    } catch (e) {
        error = e?.message || String(e);
        if (_globalGatingErrorHandler) _globalGatingErrorHandler(error);
    }
    logDebug('Gating state:', { connected, wallet, poh, error });
    return { connected, wallet, poh, error };
}
