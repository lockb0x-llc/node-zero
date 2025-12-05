// web3.js now delegates to utils.js to avoid duplicated logic.
// Re-export helpers so existing imports continue to work.
export {
    isMetaMaskInstalled,
    isMetaMaskConnected,
    getCurrentWalletAddress,
    getProvider,
    getSigner,
    ensureLineaSepolia,
    ensureLineaMainnet,
    registerWalletEventHandlers,
} from './utils.js';
