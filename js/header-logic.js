// header-logic.js
// This file contains all header logic previously in <script> in header.html


var light = document.getElementById('carrier_status_light');

var carrierDiv = document.getElementById('carrier_detection');
var connectBtn = document.getElementById('carrier_connect_btn');
var pohBadge = document.getElementById('carrier_poh_badge');
var nftBadge = document.getElementById('carrier_nft_badge');
var statusMsg = document.getElementById('carrier_status_message');
    
var isMetaMask = (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask);
var isConnected = false;
var account = null;
var pohVerified = false;
var hasSigil = false;



// Cookie consent logic
function hasConsent() {
  return localStorage.getItem('clarityConsent') === 'accepted';
}
function hasDeclined() {
  return localStorage.getItem('clarityConsent') === 'declined';
}
function showBanner() {
  var banner = document.getElementById('cookie-consent-banner');
  if (banner) banner.style.display = 'flex';
}
function hideBanner() {
  var banner = document.getElementById('cookie-consent-banner');
  if (banner) banner.style.display = 'none';
}
function loadClarity() {
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "t77geqkdbb");
}

if (!hasConsent() && !hasDeclined()) {
  showBanner();
} else if (hasConsent()) {
  loadClarity();
}
var acceptBtn = document.getElementById('accept-cookies');
var declineBtn = document.getElementById('decline-cookies');
if (acceptBtn) {
  acceptBtn.onclick = function() {
    localStorage.setItem('clarityConsent', 'accepted');
    hideBanner();
    loadClarity();
  };
}
if (declineBtn) {
  declineBtn.onclick = function() {
    localStorage.setItem('clarityConsent', 'declined');
    hideBanner();
  };
}

// Carrier detection indicator logic with PoH and NFT badges
async function updateCarrierIndicator() {
  if (!light || !carrierDiv || !connectBtn || !pohBadge || !nftBadge) return;
  
  // MetaMask not present
  if (!isMetaMask) {
    light.classList.remove('bg-emerald-400');
    light.classList.add('bg-red-500');
    light.style.boxShadow = '0 0 8px 2px #ef4444';
    
    connectBtn.classList.add('hidden');
    pohBadge.classList.add('hidden');
    pohBadge.title = '';
    nftBadge.classList.add('hidden');
    nftBadge.title = '';
    
    return;
  }
  // MetaMask present, check connection
  
  try {
    let accounts = await window.ethereum.request({ method: 'eth_accounts' });
    isConnected = Array.isArray(accounts) && accounts.length > 0;
    account = isConnected ? accounts[0] : null;
  } catch (e) {
    isConnected = false;
  }
  pohVerified = false;
  hasSigil = false;
  if (isMetaMask && isConnected && account) {
    // Check PoH and NFT status using utils.js if available
    if (window.lockb0x && window.lockb0x.isPohVerifiedForAddress) {
      try {
        pohVerified = window.lockb0x.isPohVerifiedForAddress(account);
      } catch { pohVerified = false; }
    }
    if (window.lockb0x && window.lockb0x.checkOwnershipForAddress) {
      try {
        hasSigil = await window.lockb0x.checkOwnershipForAddress(account);
      } catch { hasSigil = false; }
    }
  }
  // Update carrier indicator
  if (isConnected) {
    light.classList.remove('bg-red-500');
    light.classList.add('bg-emerald-400');
    light.style.boxShadow = '0 0 8px 2px #34d399';
    connectBtn.classList.add('hidden');
  } else {
    light.classList.remove('bg-emerald-400');
    light.classList.add('bg-red-500');
    light.style.boxShadow = '0 0 8px 2px #ef4444';
    connectBtn.classList.remove('hidden');
  }
  // Update PoH and NFT badges: show only if connected
  if (isConnected) {
    if (pohVerified) {
      pohBadge.classList.remove('hidden');
      pohBadge.title = 'Proof of Humanity Verified';
    } else {
      pohBadge.classList.add('hidden');
      pohBadge.title = '';
    }
    if (hasSigil) {
      nftBadge.classList.remove('hidden');
      nftBadge.title = 'Lockb0x Sigil NFT Owned';
    } else {
      nftBadge.classList.add('hidden');
      nftBadge.title = '';
    }
  } else {
    pohBadge.classList.add('hidden');
    pohBadge.title = '';
    nftBadge.classList.add('hidden');
    nftBadge.title = '';
  }
  // Connect button logic (set only once)
  if (!connectBtn._handlerSet) {
    connectBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      if (isMetaMask && !isConnected) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          setTimeout(updateCarrierIndicator, 500);
        } catch (err) {
        }
      }
    });
    connectBtn._handlerSet = true;
  }
  // lockb0x utils unavailable
  if (isConnected && (!window.lockb0x || !window.lockb0x.checkOwnershipForAddress || !window.lockb0x.isPohVerifiedForAddress)) {
      console.log('Advanced features unavailable (lockb0x not loaded).');
  }
}







function waitForUtilsAndInit(retryCount) {
  // Default retryCount to 0 if not provided
  retryCount = typeof retryCount === 'number' ? retryCount : 0;

  light = document.getElementById('carrier_status_light');
  carrierDiv = document.getElementById('carrier_detection');
  connectBtn = document.getElementById('carrier_connect_btn');
  pohBadge = document.getElementById('carrier_poh_badge');
  nftBadge = document.getElementById('carrier_nft_badge');
  statusMsg = document.getElementById('carrier_status_message');

  isMetaMask = (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask);
  isConnected = false;
  account = null;
  pohVerified = false;
  hasSigil = false;

  if (window.lockb0x && window.lockb0x.checkOwnershipForAddress && window.lockb0x.isPohVerifiedForAddress) {
    updateCarrierIndicator();
    if (window.ethereum) {
      window.ethereum.on && window.ethereum.on('accountsChanged', updateCarrierIndicator);
      window.ethereum.on && window.ethereum.on('chainChanged', updateCarrierIndicator);
    }
  } else if (retryCount < 2) {
    setTimeout(function() { waitForUtilsAndInit(retryCount + 1); }, 100);
  } else {
    // After 2 retries, handle carrier detection without utils
    updateCarrierIndicator();
    if (window.ethereum) {
      window.ethereum.on && window.ethereum.on('accountsChanged', updateCarrierIndicator);
      window.ethereum.on && window.ethereum.on('chainChanged', updateCarrierIndicator);
    }
    if (typeof window.lockb0x === 'undefined') {
      console.warn('lockb0x utils not available after retries; proceeding with basic carrier detection.');
    }
  }
}



