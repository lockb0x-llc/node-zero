// Returns true if PoH is verified for the currently connected wallet (localStorage only)
export async function isPohVerified() {
    try {
        const wallet = getWalletConnected();
        if (!wallet) return false;
        // Only check localStorage for PoH flag for this address
        return isPohVerifiedForAddress(wallet);
    } catch (e) {
        if (_globalGatingErrorHandler) _globalGatingErrorHandler(e?.message || String(e));
        return false;
    }
}

// session.js - Wallet connection, expiry, PoH signature, gating state, debug/error

export const LOCAL_WALLET_KEY = 'nodezero_wallet_connected_v2';
export const LOCAL_POH_KEY = (address) => `nodezero_poh_v1_${address.toLowerCase()}`;



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
    
    // If still no address, prompt user to connect wallet
    if (!resolvedAddress && window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (Array.isArray(accounts) && accounts.length > 0) {
                resolvedAddress = accounts[0];
            }
        } catch (e) {
            return { status: false, address: null, signature: null, error: 'Wallet connection rejected.' };
        }
    }
    if (!resolvedAddress) {
        return { status: false, address: null, signature: null, error: 'No address provided.' };
    }
    // 1. Check for existing PoH flag
    if (isPohVerifiedForAddress(resolvedAddress)) {
        return { status: true, address: resolvedAddress, signature: null, error: null };
    }
    // 2. Perform PoH verification (default: API check, or custom function)
    const POH_API_BASE = (window.APP_CONFIG && window.APP_CONFIG.POH_API_BASE) ? window.APP_CONFIG.POH_API_BASE : 'https://poh-api.linea.build/poh/v2/';
    try {
        let verified = false;
        if (typeof pohVerifyFn === 'function') {
            verified = await pohVerifyFn(resolvedAddress);
        } else {
            // Default: check API
            const resp = await fetch(`${POH_API_BASE}${resolvedAddress}`);
            if (!resp.ok) {
                return { status: false, address: resolvedAddress, signature: null, error: 'Unable to contact Linea PoH service. Please try again later.' };
            }
            const text = (await resp.text()).trim();
            if (text === 'true') {
                verified = true;
            } else {
                return { status: false, address: resolvedAddress, signature: null, error: 'No Proof of Humanity found for this wallet.' };
            }
        }
        if (!verified) {
            return { status: false, address: resolvedAddress, signature: null, error: 'PoH verification failed.' };
        }
        setPohVerified(resolvedAddress);
        return { status: true, address: resolvedAddress, signature: null, error: null };
    } catch (err) {
        return { status: false, address: resolvedAddress, signature: null, error: err?.message || String(err) };
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

export function setPohVerified(address) {
    if (address) {
        localStorage.setItem(LOCAL_POH_KEY(address), 'true');
    }
}

export function isPohVerifiedForAddress(address) {
    if (!address) return false;
    return localStorage.getItem(LOCAL_POH_KEY(address)) === 'true';
}

export function getPohSignature(address) {
    if (!address) return null;
    const key = `poh_signature_${address.toLowerCase()}`;
    return localStorage.getItem(key);
}

export function setPohSignature(address, signature) {
    if (!address || !signature) throw new Error('Address and signature required');
    const key = `poh_signature_${address.toLowerCase()}`;
    localStorage.setItem(key, signature);
}

export function isPohSignatureVerified(address) {
    return !!getPohSignature(address);
}

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

export async function getTokenGatingState(isMetaMaskConnected, getWalletConnected, isPohVerified) {
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
