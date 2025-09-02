/**
 * Node_Zero: The Whispering Code
 * main.js
 *
 * - Handles cyberpunk navigation, authentication, and chapter gating
 * - Integrates with Lamina1 Spaces (placeholder)
 * - Includes mock/test mode for development
 * - Animates UI and provides hooks for testing
 */

document.addEventListener("DOMContentLoaded", () => {
  // Animate chapter 1 heading
  anime({
    targets: '#chapter-1 h1',
    translateY: [-50, 0],
    opacity: [0, 1],
    duration: 1200,
    easing: 'easeOutExpo',
  });

  // --- DOM Elements ---
  const connectLamina1Btn = document.getElementById('connectLamina1');
  const mockAuthBtn = document.getElementById('mockAuth');
  const walletStatus = document.getElementById('walletStatus');
  const gatedSection = document.querySelector('[data-requires-nft]');
  const navLinks = document.querySelectorAll('nav a');
  const chapter2 = document.getElementById('chapter-2');

  // --- State ---
  let userAddress = null;
  window.isAuthenticated = false;

  // --- Lamina1 Spaces Auth (placeholder) ---
  const SPACE_ID = 'YOUR_SPACE_ID';
  const SPACE_API_KEY = 'YOUR_API_KEY';

  async function connectLamina1() {
    walletStatus.textContent = 'Connecting to Lamina1...';
    try {
      // Simulate Lamina1 Spaces authentication
      setTimeout(() => {
        userAddress = '0xLAMINA1USER1234567890';
        window.isAuthenticated = true;
        walletStatus.textContent = `Connected (Lamina1): ${userAddress.slice(0,6)}...${userAddress.slice(-4)}`;
        // Simulate NFT check (replace with real logic)
        checkNFTOwnershipLamina1();
      }, 1000);
    } catch (err) {
      walletStatus.textContent = 'Lamina1 authentication failed.';
      window.isAuthenticated = false;
    }
  }

  async function checkNFTOwnershipLamina1() {
    // Simulate: user owns NFT
    setTimeout(() => {
      gatedSection.classList.remove('hidden');
      walletStatus.textContent += ' | NFT detected! (Lamina1)';
    }, 800);
  }

  // --- Mock/test mode for development ---
  function mockAuth() {
    userAddress = '0xMOCKUSER000000000000';
    window.isAuthenticated = true;
    walletStatus.textContent = `Mock Connected: ${userAddress.slice(0,6)}...${userAddress.slice(-4)}`;
    gatedSection.classList.remove('hidden');
    walletStatus.textContent += ' | NFT detected! (Mock)';
  }

  // --- Navigation and Gating Logic ---
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').replace('#', '');
      const targetSection = document.getElementById(targetId);
      // If gated, check NFT/auth status before revealing
      if (targetSection && targetSection.dataset.requiresNft === "true") {
        if (!window.isAuthenticated) {
          e.preventDefault();
          alert('Please authenticate to access this chapter.');
          return;
        } else {
          targetSection.classList.remove('hidden');
        }
      }
      // Smooth scroll
      if (targetSection) {
        e.preventDefault();
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --- Event Listeners ---
  if (connectLamina1Btn) connectLamina1Btn.addEventListener('click', connectLamina1);
  if (mockAuthBtn) mockAuthBtn.addEventListener('click', mockAuth);

  // --- Testing Hooks ---
  window.__test = {
    connectLamina1,
    mockAuth,
    navLinks,
    walletStatus,
    gatedSection,
    chapter2,
    get isAuthenticated() { return window.isAuthenticated; },
    set isAuthenticated(val) { window.isAuthenticated = val; },
  };

  // --- Documentation ---
  /*
    Usage:
      - window.__test.connectLamina1() // Simulate Lamina1 auth
      - window.__test.mockAuth() // Simulate mock auth
      - window.__test.navLinks[1].click() // Try to access Chapter 2
      - window.__test.isAuthenticated = true // Force auth state
    Testing:
      - After mock/auth, Chapter 2 should be visible and scrollable
      - Navigation is smooth and gated
      - Status messages update correctly
  */
});

