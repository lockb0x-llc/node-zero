// auth-gate.js
// Shared token gating logic for lockb0x dapp
// Redirects to root if PoH is missing. To be included at the top of protected pages.

import { getTokenGatingState, registerWalletEventHandlers, setDebugMode, setGatingErrorHandler } from '../lockb0x/utils.js';


(function enforcePoHGating() {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Enable debug mode for development (set to false in production)
  setDebugMode(true);

  // Global error handler for gating failures
  setGatingErrorHandler((err) => {
    // Always redirect on error for protected pages
    window.location.href = '/index.html';
  });

  // Check for PoH (Proof of Humanity) verification using centralized state
  async function checkPoH() {
    try {
      const { poh } = await getTokenGatingState();
      if (!poh) {
        window.location.href = '/index.html';
      }
    } catch (e) {
      window.location.href = '/index.html';
    }
  }

  // Run check on page load
  checkPoH();

  // Register wallet/account/chain event handlers to always re-check
  registerWalletEventHandlers(checkPoH);
})();
