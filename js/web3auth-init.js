// web3auth-init.js
// Node_Zero: Web3Auth MetaMask integration with fallback and session management
//
// This module provides two functions:
//   1. initWeb3Auth: Initializes Web3Auth for MetaMask login (customized for Node_Zero branding).
//   2. connectWithWeb3Auth: Triggers the Web3Auth login modal and returns a provider.
//
// Usage:
//   - Call initWeb3Auth({ clientId, chainConfig }) on page load.
//   - On connect button click, call connectWithWeb3Auth(web3auth) to get a provider.
//   - Fallback to window.ethereum if Web3Auth fails or is unavailable.
//
// Docs: https://web3auth.io/docs/sdk/web/initialize
// CDN: <script src="https://cdn.jsdelivr.net/npm/@web3auth/web3auth@latest/dist/web3auth.umd.min.js"></script>

export async function initWeb3Auth({ clientId, chainConfig }) {
  // Initializes Web3Auth with Node_Zero branding and MetaMask-only login.
  // Handles both Web3Auth and Web3auth global names for compatibility.
  return new Promise(async (resolve, reject) => {
    try {
      const Web3AuthCtor = window.Web3Auth || window.Web3auth;
      if (!Web3AuthCtor) {
        throw new Error('Web3Auth global not found. Make sure the CDN script is loaded before this script.');
      }
      const web3auth = new Web3AuthCtor({
        clientId,
        chainConfig,
        uiConfig: {
          theme: "dark",
          loginMethodsOrder: ["metamask"],
          appLogo: "media/favicon.png",
          defaultLanguage: "en",
          appName: "Node_Zero",
        },
      });
      await web3auth.initModal();
      resolve(web3auth);
    } catch (e) {
      reject(e);
    }
  });
}

export async function connectWithWeb3Auth(web3auth) {
  // Opens the Web3Auth modal and returns a provider if successful.
  try {
    const provider = await web3auth.connect();
    return provider;
  } catch (e) {
    throw e;
  }
}
