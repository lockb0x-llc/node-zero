// /js/header-loader.js
fetch('/header.html')
  .then(r => r.text())
  .then(html => {
    document.getElementById('site-header').innerHTML = html;

    // Optional: underline current page link
    const path = window.location.pathname.replace(/\/$/, '');
    document.querySelectorAll('#site-header a[href]').forEach(link => {
      if (link.getAttribute('href') === path) {
        link.classList.add('underline');
      }
    });
  })
  .catch(err => console.error('Header load failed:', err));
