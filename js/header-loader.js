// /js/header-loader.js
fetch('/header.html')
  .then(r => r.text())
  .then(html => {
    // Inject Ethers.js if not already present
    if (!window.ethers) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js';
      script.onload = () => {
        // After Ethers.js loads, inject header
        document.getElementById('site-header').innerHTML = html;
        underlineCurrentPage();
        // Ensure header-logic.js is loaded after header injection
        if (!window._headerLogicLoaded) {
          var script = document.createElement('script');
          script.src = '/js/header-logic.js';
          script.onload = function() {
            window._headerLogicLoaded = true;
            if (typeof window.waitForUtilsAndInit === 'function') {
              window.waitForUtilsAndInit();
            }
          };
          document.body.appendChild(script);
        } else {
          if (typeof window.waitForUtilsAndInit === 'function') {
            window.waitForUtilsAndInit();
          }
        }
      };
      document.head.appendChild(script);
    } else {
      document.getElementById('site-header').innerHTML = html;
      underlineCurrentPage();
      if (!window._headerLogicLoaded) {
        var script = document.createElement('script');
        script.src = '/js/header-logic.js';
        script.onload = function() {
          window._headerLogicLoaded = true;
          if (typeof window.waitForUtilsAndInit === 'function') {
            window.waitForUtilsAndInit();
          }
        };
        document.body.appendChild(script);
      } else {
        if (typeof window.waitForUtilsAndInit === 'function') {
          window.waitForUtilsAndInit();
        }
      }
    }
    function underlineCurrentPage() {
      const path = window.location.pathname.replace(/\/$/, '');
      document.querySelectorAll('#site-header a[href]').forEach(link => {
        if (link.getAttribute('href') === path) {
          link.classList.add('underline');
        }
      });
    }
  })
  .catch(err => console.error('Header load failed:', err));
