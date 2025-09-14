// Typing effect for WOPR link
(function() {
  const text = 'WOULD YOU LIKE TO PLAY A GAME?';
  const el = document.getElementById('wopr-typing');
  if (!el) return;
  let i = 0, dir = 1;
  function type() {
    el.textContent = text.slice(0, i) + (i % 2 === 0 ? '_' : '');
    if (dir === 1 && i < text.length) { i++; setTimeout(type, 60); }
    else if (dir === 1) { dir = -1; setTimeout(type, 1200); }
    else if (dir === -1 && i > 0) { i--; setTimeout(type, 24); }
    else { dir = 1; setTimeout(type, 600); }
  }
  type();
})();

// Keyboard navigation for slides (up/down arrows, page up/down, space)
(function() {
  const slides = Array.from(document.querySelectorAll('.slide'));
  if (!slides.length) return;
  let scrolling = false;
  function getCurrentSlideIndex() {
    let minDist = Infinity, idx = 0;
    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const dist = Math.abs(rect.top);
      if (dist < minDist) { minDist = dist; idx = i; }
    });
    return idx;
  }
  function scrollToSlide(idx) {
    if (idx < 0 || idx >= slides.length) return;
    scrolling = true;
    slides[idx].scrollIntoView({behavior: 'smooth'});
    setTimeout(() => { scrolling = false; }, 700);
  }
  document.addEventListener('keydown', function(e) {
    if (scrolling) return;
    const cur = getCurrentSlideIndex();
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      scrollToSlide(cur + 1);
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      scrollToSlide(cur - 1);
    }
  });
})();
