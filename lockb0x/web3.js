// Ensure wallet is on Linea Mainnet (chainId 59144)
export async function ensureLineaMainnet() {
    if (!window.ethereum) throw new Error("MetaMask not available");
    let provider = new window.ethers.BrowserProvider(window.ethereum);
    let network = await provider.getNetwork();
    if (network.chainId !== 59144n) {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0xE708" }], // 59144 hex
            });
            provider = new window.ethers.BrowserProvider(window.ethereum);
        } catch (err) {
            throw new Error("Please switch to the Linea Mainnet network.");
        }
    }
    return provider;
}
// web3.js - MetaMask, provider, network, and wallet event helpers

export function isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
}

export async function isMetaMaskConnected() {
    if (!isMetaMaskInstalled()) return false;
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return Array.isArray(accounts) && accounts.length > 0;
    } catch {
        return false;
    }
}

export async function getCurrentWalletAddress() {
    if (!isMetaMaskInstalled()) return null;
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
    } catch {
        return null;
    }
}

export function getProvider() {
    if (!window.ethereum) throw new Error("MetaMask not available");
    return new window.ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
    const provider = getProvider();
    const accounts = await provider.send("eth_accounts", []);
    if (!accounts || accounts.length === 0) {
        throw new Error("No connected wallet");
    }
    return await provider.getSigner();
}

export async function ensureLineaSepolia() {
    if (!window.ethereum) throw new Error("MetaMask not available");
    let provider = new window.ethers.BrowserProvider(window.ethereum);
    let network = await provider.getNetwork();
    if (network.chainId !== 59141n) {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0xE705" }], // 59141 hex
            });
            provider = new window.ethers.BrowserProvider(window.ethereum);
        } catch (err) {
            throw new Error("Please switch to the Linea Sepolia network.");
        }
    }
    return provider;
}

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
