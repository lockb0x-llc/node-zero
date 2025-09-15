// /js/header-laminastory-loader.js
fetch('/header-laminastory.html')
  .then(r => r.text())
  .then(html => {
    document.getElementById('site-header').innerHTML = html;
  })
  .catch(err => console.error('Header load failed:', err));
