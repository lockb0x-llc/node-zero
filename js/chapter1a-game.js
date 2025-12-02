// chapter1a-game.js
// Self-contained interactive fiction game logic for modular use
// Organized for future splitting into modules

// Modularized full adventure game logic from chapter1a.html
document.addEventListener('DOMContentLoaded', function() {
  // --- Game Data: Intel (Lore) ---
  const INTEL = {
    substrate: {
      title: 'The Substrate',
      body: `A decentralized mesh of legacy blockchains, storage nodes, and AI-run services that survived chaotic failures.\nIt's not "the internet" or "a metaverse"—it's the quiet plumbing beneath both. Packets, DAOs, file shards, and forgotten servers stitched into a living ruin.`
    },
    echo: {
      title: 'Echo Cipher',
      body: `A signaling pattern hidden across language channels. It isn't about text meaning—it's about cadence, timing, and hesitation.\nTracked by agents that recognize communication shapes rather than grammar.`
    },
    entangle: {
      title: 'Entangled Ledger',
      body: `A quantum-ledger concept spanning time slices. Messages can be observed across timelines using pre-agreed protocols.\nConstraints exist to preserve causality; you can only collapse states left open by the chain's creation.`
    },
    blue: {
      title: 'The Blue (L1 Shard)',
      body: `An AI-powered layer on Lamina1's L1 network. Users can spin up ephemeral micro-metaverses funded by temporary DAOs;\nspaces dissolve when gas depletes or the shard disconnects.`
    },
    stellar: {
      title: 'Stellar Identity (Muxed Keys)',
      body: `Identity is asserted using Stellar accounts with muxed (M) addresses. Safer flows rotate keys and sign challenges\ninstead of sharing secrets. Good ops practice: short-lived auth + audit trails.`
    },
    lockb0x: {
      title: 'Lockb0x Storage (IPFS/IPNS + Azure)',
      body: `Bring-Your-Own-Storage abstraction. Media and metadata live in IPFS/IPNS with governance and access mediated via an API gateway.\nPrivate swarms for sensitive work; public gateways only for whitelisted CIDs.`
    },
    ucc: {
      title: 'UCC Work Orders (CERs)',
      body: `Under UCC Article 12, certain records can be Controllable Electronic Records (CERs).\nEngagement Offers and Work Orders form a signed chain of custody—who controls, who can transfer, and under what conditions.`
    }
  };

  // --- Game Data: Scenes ---
  // (Paste the full SCENES object from chapter1a.html here)
  // For brevity, only the intro scene is included. Add all scenes for full game.
  const SCENES = {
    intro: {
      lines: [
        '> LOCATION: Las Vegas, 20__.',
        '> The Strip flickers like a broken circuit. The Substrate hums beneath.',
        '[INBOUND PACKET DETECTED]',
        'crypttext://node-zero.xyz',
        '"The signal from the future you were never meant to hear."',
        'CHOICES: (1) Open | (2) Trace | (3) Ignore'
      ],
      choices: [
        { label: '1) Open the link', next: 'open', intel: ['substrate'] },
        { label: '2) Trace the signal', next: 'trace', intel: ['substrate', 'echo'] },
        { label: '3) Ignore it', next: 'ignore' }
      ]
    },
    // ... (add all other scenes from original SCENES)
  };

  // --- State & Persistence ---
  const SAVE_KEY = 'node_zero_text_adventure_save_v1';
  let state = {
    scene: 'intro',
    typing: true,
    speed: 18,
    autoScroll: true,
    intel: {}, // {id:true}
    log: [], // array of {text}
  };
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s || !s.scene) return false;
      state = Object.assign({ typing: true, speed: 18, autoScroll: true, intel: {}, log: [] }, s);
      return true;
    } catch (e) { return false; }
  }
  function reset() {
    state = { scene: 'intro', typing: true, speed: 18, autoScroll: true, intel: {}, log: [] };
    save();
  }

  // --- DOM Helpers ---
  const elLog = document.getElementById('console-log');
  const elChoices = document.getElementById('choices');
  const elTyping = document.getElementById('chk-typing');
  const elAuto = document.getElementById('chk-autoscroll');
  const elSpeed = document.getElementById('rng-speed');
  const elNew = document.getElementById('btn-new');
  const elCont = document.getElementById('btn-continue');
  const elSkip = document.getElementById('btn-skip');
  const elIntelList = document.getElementById('intel-list');
  const elIntelCount = document.getElementById('intel-count');

  // Error handling for missing elements
  if (!elLog || !elChoices) {
    // Try to show a visible error if possible
    const err = document.createElement('div');
    err.style.color = '#ff5555';
    err.style.fontWeight = 'bold';
    err.style.margin = '2rem';
    err.textContent = 'Error: Required game elements (#console-log or #choices) not found in the page.';
    document.body.appendChild(err);
    return;
  }

  if (elTyping) elTyping.addEventListener('change', () => { state.typing = elTyping.checked; save(); });
  if (elAuto) elAuto.addEventListener('change', () => { state.autoScroll = elAuto.checked; save(); });
  if (elSpeed) elSpeed.addEventListener('input', () => { state.speed = Number(elSpeed.value); save(); });
  if (elNew) elNew.addEventListener('click', () => { reset(); clearViews(); runScene('intro'); });
  if (elCont) elCont.addEventListener('click', () => { if (load()) { clearViews(); replayLogThenScene(state.scene); } });
  let currentTyper = null;
  if (elSkip) elSkip.addEventListener('click', () => { if (currentTyper && typeof currentTyper.skip === 'function') currentTyper.skip(); });

  function clearViews() {
    if (elLog) elLog.innerHTML = '';
    if (elChoices) elChoices.innerHTML = '';
    renderIntel();
  }
  function scrollBottom() {
    if (!state.autoScroll || !elLog) return;
    elLog.scrollTop = elLog.scrollHeight;
  }
  function renderIntel() {
    if (!elIntelCount || !elIntelList) return;
    const ids = Object.keys(state.intel || {});
    elIntelCount.textContent = String(ids.length);
    elIntelList.innerHTML = '';
    if (!ids.length) {
      const p = document.createElement('p');
      p.className = 'text-gray-400';
      p.textContent = 'No intel unlocked yet. Explore and make choices to learn more about the universe.';
      elIntelList.appendChild(p);
      return;
    }
    ids.forEach(id => {
      const item = INTEL[id]; if (!item) return;
      const wrap = document.createElement('details');
      wrap.className = 'border border-white/10 rounded-md p-3';
      const sum = document.createElement('summary');
      sum.className = 'cursor-pointer glow-green';
      sum.textContent = item.title;
      const body = document.createElement('div');
      body.className = 'mt-2 text-gray-200';
      body.textContent = item.body;
      wrap.appendChild(sum); wrap.appendChild(body);
      elIntelList.appendChild(wrap);
    });
  }
  function unlockIntel(ids) {
    if (!ids) return;
    (ids || []).forEach(id => { state.intel[id] = true; });
    save();
    renderIntel();
  }
  // --- Typing Animation ---
  let typingInProgress = false;
  function typeBlock(lines, done) {
    if (!elLog) return;
    const full = lines.join('\n');
    const block = document.createElement('pre');
    block.className = 'console-line text-[13px] md:text-sm border border-white/10 rounded-md p-3 bg-black/40';
    const span = document.createElement('span');
    span.className = 'cursor';
    block.appendChild(span);
    elLog.appendChild(block);
    scrollBottom();
    let i = 0, timer = null;
    typingInProgress = true;
    setChoicesDisabled(true);
    function renderAll() {
      span.classList.remove('cursor');
      span.textContent = full;
      scrollBottom();
      typingInProgress = false;
      setChoicesDisabled(false);
      if (done) done();
    }
    function tick() {
      if (!state.typing) { renderAll(); return; }
      span.textContent = full.slice(0, i++);
      scrollBottom();
      if (i > full.length) { clearInterval(timer); span.classList.remove('cursor'); typingInProgress = false; setChoicesDisabled(false); if (done) done(); }
    }
    if (!state.typing) { renderAll(); }
    else {
      timer = setInterval(tick, Math.max(10, state.speed));
    }
    currentTyper = { skip: () => { if (timer) clearInterval(timer); renderAll(); } };
  }
  function pushSystemLine(text) {
    if (!elLog) return;
    const p = document.createElement('div');
    p.className = 'text-xs text-amber-300/90';
    p.textContent = text;
    elLog.appendChild(p);
    scrollBottom();
  }
  // --- Choices ---
  let currentChoiceButtons = [];
  function setChoicesDisabled(disabled) {
    currentChoiceButtons.forEach(btn => {
      if (disabled) {
        btn.classList.add('disabled');
        btn.setAttribute('aria-disabled', 'true');
      } else {
        btn.classList.remove('disabled');
        btn.removeAttribute('aria-disabled');
      }
    });
  }
  function renderChoices(scene) {
    if (!elChoices) return;
    elChoices.innerHTML = '';
    currentChoiceButtons = [];
    (scene.choices || []).forEach((ch, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice rounded-md px-3 py-2 text-left';
      btn.textContent = ch.label;
      btn.tabIndex = 0;
      btn.addEventListener('click', () => {
        if (typingInProgress) {
          if (currentTyper && typeof currentTyper.skip === 'function') currentTyper.skip();
          return;
        }
        if (ch.intel) unlockIntel(ch.intel);
        pushSystemLine('YOU CHOSE: ' + ch.label);
        runScene(ch.next, { fromChoice: ch });
      });
      elChoices.appendChild(btn);
      currentChoiceButtons.push(btn);
    });
    setChoicesDisabled(typingInProgress);
  }
  // --- Keyboard Support ---
  document.addEventListener('keydown', function (e) {
    if (!currentChoiceButtons || currentChoiceButtons.length === 0) return;
    let num = null;
    if (e.code && e.code.startsWith('Digit')) {
      num = parseInt(e.code.replace('Digit', ''));
    } else if (e.code && e.code.startsWith('Numpad')) {
      num = parseInt(e.code.replace('Numpad', ''));
    }
    if (!num || num < 1 || num > currentChoiceButtons.length) return;
    if (typingInProgress) {
      if (currentTyper && typeof currentTyper.skip === 'function') currentTyper.skip();
      e.preventDefault();
      return;
    }
    const btn = currentChoiceButtons[num - 1];
    if (btn && !btn.classList.contains('disabled')) {
      btn.click();
      e.preventDefault();
    }
  });
  // --- Replay log, then resume scene (for continue) ---
  function replayLogThenScene(sceneId) {
    clearViews();
    const past = state.log || [];
    past.forEach(item => {
      const pre = document.createElement('pre');
      pre.className = 'console-line text-[13px] md:text-sm border border-white/10 rounded-md p-3 bg-black/20';
      pre.textContent = item.text;
      elLog.appendChild(pre);
    });
    renderIntel();
    runScene(sceneId);
  }
  // --- Core: run a scene (type text then show choices) ---
  function runScene(id, opts = {}) {
    let scene = SCENES[id];
    if (!scene) { id = 'intro'; scene = SCENES[id]; }
    state.scene = id; save();
    // (Special dynamic scene logic for handshakeCheck, etc. can be added here)
    typeBlock(scene.lines, () => { renderChoices(scene); });
    state.log.push({ text: scene.lines.join('\n') });
    save();
  }
  // --- Init ---
  // Init after DOM is ready and elements are found
  (function init() {
    const hasSave = load();
    renderIntel();
    if (hasSave) {
      pushSystemLine('[SAVE FOUND] Press Continue to resume, or New Game to restart.');
    } else {
      runScene('intro');
    }
  })();
  // --- Expose for test page or debugging ---
  window.chapter1aGame = {
    state,
    typeBlock,
    renderChoices,
    runScene,
    unlockIntel,
    pushSystemLine
  };
});
