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

  // Game Data: Scenes
  // Each scene defines: lines[], choices[] {label, next, intel?:[], note?}
  // ---------------------------
  const SCENES = {
      intro: {
          lines: [
              '> LOCATION: Las Vegas, 20__.',
              '> The Strip flickers like a broken circuit. The Substrate hums beneath.',
              '[INBOUND PACKET DETECTED]',
              'crypttext://node-zero.xyz',
              '"Anamolous Signal."',
              'CHOICES: (1) Open | (2) Trace | (3) Ignore'
          ],
          choices: [
              { label: '1) Open the link', next: 'open', intel: ['substrate'] },
              { label: '2) Trace the signal', next: 'trace', intel: ['substrate', 'echo'] },
              { label: '3) Ignore it', next: 'ignore' }
          ]
      },

      ignore: {
          lines: [
              '> You look away. The room stays too quiet.',
              '[ALERT] Signal returns, louder. Screen pressure rises like a stormfront.',
              'crypttext://node-zero.xyz — reappeared.',
              'CHOICES: (1) Open | (2) Trace'
          ],
          choices: [
              { label: '1) Open the link', next: 'open', intel: ['substrate'] },
              { label: '2) Trace the signal', next: 'trace', intel: ['substrate', 'echo'] }
          ]
      },

      open: {
          lines: [
              '> You dive blind. Glass becomes water; UI becomes tide.',
              '[SYSTEM WARNING] Unverified origin. Backpressure mounting…',
              'A whisper threads the audio driver: "Enter, or be erased."',
              'CHOICES: (1) Bail out | (2) Trace anyway'
          ],
          choices: [
              { label: '1) Bail out (return to caution)', next: 'trace' },
              { label: '2) Trace anyway (reckless)', next: 'trace', intel: ['echo'] }
          ]
      },

      trace: {
          lines: [
              '> ROUTING TRACE…',
              'Packet zigzags through Lamina1 shards & Discord language channels.',
              'sig://retroactive65',
              'origin://substrate/blue',
              'entropy://96fa88d3',
              'Impossible signature: Retroactive65 is dormant.',
              'CHOICES: (1) Follow | (2) Copy & sandbox | (3)2 Send a probe'
          ],
          choices: [
              { label: '1) Follow the signature', next: 'follow', intel: ['blue'] },
              { label: '2) Copy & sandbox', next: 'sandbox', intel: ['entangle'] },
              { label: '3) Send a probe back', next: 'probe' }
          ]
      },

      follow: {
          lines: [
              '> You chase the trail raw. Exposure risk climbs.',
              '[HINT] Safer practice: containerize unknowns first.',
              'CHOICES: (1) Backtrack to sandbox | (2) Keep following (risky)'
          ],
          choices: [
              { label: '1) Backtrack: Copy & sandbox', next: 'sandbox', intel: ['entangle'] },
              { label: '2) Keep following (risky)', next: 'hit', intel: ['blue'] }
          ]
      },

      hit: {
          lines: [
              '[IMPACT] You take a glancing hit. Logs smear with artifacting.',
              'Decoy is recommended.',
              'CHOICES: (1) Spin a decoy shard | (2) Abort and sandbox properly'
          ],
          choices: [
              { label: '1) Spin a decoy shard', next: 'redirect', intel: ['blue'] },
              { label: '2) Abort and sandbox', next: 'sandbox', intel: ['entangle'] }
          ]
      },

      probe: {
          lines: [
              '> You send a blank packet into the dark.',
              'Something inhales. Returns pressure, not text.',
              '[ALERT] Uninterpreted signal may carry state back.',
              'CHOICES: (1) Copy & sandbox | (2) Bail to menu'
          ],
          choices: [
              { label: '1) Copy & sandbox', next: 'sandbox', intel: ['entangle'] },
              { label: '2) Bail (back)', next: 'trace' }
          ]
      },

      sandbox: {
          lines: [
              '> PACKET ISOLATED IN AIR-GAP.',
              '[ALERT] Quantum residue detected.',
              ':: ACKNOWLEDGED ::',
              'You are observed.',
              'Next ping at 03:33 local.',
              'Prepare.',
              'CHOICES: (1) Fortify | (2) Decode residue | (3) Attack first'
          ],
          choices: [
              { label: '1) Fortify defenses', next: 'fortify', intel: ['stellar', 'lockb0x'] },
              { label: '2) Decode residue', next: 'decode', intel: ['entangle'] },
              { label: '3) Attack first', next: 'attack' }
          ]
      },

      decode: {
          lines: [
              '> You examine the residue with non-interactive tools.',
              'Finding: state hints match an entangled ledger protocol.',
              'Constraint: you can only collapse pre-opened states. Avoid paradox.',
              'CHOICES: (1) Fortify anyway | (2) Wait for 03:33 quietly'
          ],
          choices: [
              { label: '1) Fortify anyway', next: 'fortify', intel: ['stellar'] },
              { label: '2) Wait quietly (stealth)', next: 'quiet', intel: ['entangle'] }
          ]
      },

      quiet: {
          lines: [
              '03:33 arrives. Pressure-message impacts the sandbox shell.',
              'Your system holds, barely.',
              'CHOICES: (1) Redirect to decoy | (2) Step through | (3) Seal gate'
          ],
          choices: [
              { label: '1) Redirect to decoy', next: 'redirect' },
              { label: '2) Step through', next: 'enterBlue', intel: ['blue'] },
              { label: '3) Seal the gate', next: 'seal' }
          ]
      },

      fortify: {
          lines: [
              '> DEFENSE STACK ONLINE:',
              '- Layered firewalls',
              '- Stellar muxed-key rotations',
              '- Lockb0x + VNet isolation',
              '- Daemon: packet-eater ONLINE',
              '03:33 — INBOUND MESSAGE',
              'THE BLUE OPENS.',
              'ENTER, OR BE ERASED.',
              'CHOICES: (1) Step through | (2) Redirect to decoy | (3) Seal gate'
          ],
          choices: [
              { label: '1) Step through', next: 'enterBlue', intel: ['blue'] },
              { label: '2) Redirect to decoy', next: 'redirect' },
              { label: '3) Seal gate', next: 'seal' }
          ]
      },

      attack: {
          lines: [
              '> You strike first. The system rumbles with recoil.',
              'Result: minimal intel gained; risk escalated. The gate still forms.',
              'CHOICES: (1) Redirect | (2) Step through | (3) Seal gate'
          ],
          choices: [
              { label: '1) Redirect', next: 'redirect' },
              { label: '2) Step through', next: 'enterBlue', intel: ['blue'] },
              { label: '3) Seal gate', next: 'seal' }
          ]
      },

      seal: {
          lines: [
              '> You seal the gate. Silence falls like ash.',
              'The trail begins to fade. But silence never lasts here.',
              'CHOICES: (1) Re-open trace | (2) New Game'
          ],
          choices: [
              { label: '1) Re-open trace', next: 'trace' },
              { label: '2) New Game', next: 'intro' }
          ]
      },

      redirect: {
          lines: [
              '> REDIRECTING TO DECOY SHARD…',
              'IDENT: NODE_ZERO',
              'STATE: INITIAL',
              'QUERY: WHERE IS THE KEY?',
              '… an anomaly detected … this is not the origin … WHO WATCHES THE WATCHER?',
              'CHOICES: (1) Engage & bluff | (2) Extract intel silently | (3) Sever'
          ],
          choices: [
              { label: '1) Engage & bluff', next: 'engage' },
              { label: '2) Extract intel silently', next: 'extract', intel: ['echo'] },
              { label: '3) Sever', next: 'trace' }
          ]
      },

      extract: {
          lines: [
              '> You siphon peripheral metadata while the entity probes the set.',
              'Finding: phrase triggers include MEMORY / ORIGIN / KEY.',
              'CHOICES: (1) Engage now | (2) Sever'
          ],
          choices: [
              { label: '1) Engage now', next: 'engage' },
              { label: '2) Sever', next: 'trace' }
          ]
      },

      engage: {
          lines: [
              '> SYNTH-BLUFF ONLINE.',
              'YOU: YOU HAVE REACHED ORIGIN. STATE THE PROTOCOL.',
              'THEM: … cross-time handshake … entanglement confirms breach … If you are Origin, deliver the KEY PHRASE.',
              'CHOICES: (1) Technical bluff (forge hash) | (2) Cryptic bluff (riddle) | (3) Silent bluff (pressure)'
          ],
          choices: [
              { label: '1) Technical bluff (forge hash)', next: 'bluffTech' },
              { label: '2) Cryptic bluff (riddle)', next: 'bluffCryptic' },
              { label: '3) Silent bluff (pressure)', next: 'bluffSilent' }
          ]
      },

      bluffTech: {
          lines: [
              '> You output a valid-looking hash.',
              'THEM: … format accepted … semantics missing …',
              'Result: Partial trust. Fragment delivered but threaded with conditions.',
              '[FRAGMENT] MEET IN BLUE.',
              'CHOICES: (1) Use fragment | (2) Analyze offline | (3) Bury in lockb0x'
          ],
          choices: [
              { label: '1) Use fragment (enter)', next: 'enterBlue', intel: ['blue'] },
              { label: '2) Analyze offline', next: 'analyze', intel: ['entangle'] },
              { label: '3) Bury in lockb0x', next: 'bury', intel: ['lockb0x'] }
          ]
      },

      bluffCryptic: {
          lines: [
              'YOU: “The key is never given. The key is remembered.”',
              'THEM: … memory confirmed … Origin persists … We are aligned, for now.',
              '[FRAGMENT] MEET IN BLUE.',
              'CHOICES: (1) Use fragment | (2) Analyze offline | (3) Bury in lockb0x'
          ],
          choices: [
              { label: '1) Use fragment (enter)', next: 'enterBlue', intel: ['blue'] },
              { label: '2) Analyze offline', next: 'analyze', intel: ['entangle'] },
              { label: '3) Bury in lockb0x', next: 'bury', intel: ['lockb0x'] }
          ]
      },

      bluffSilent: {
          lines: [
              '> You hold the line. Silence becomes gravity.',
              'THEM: … pressure sequence acknowledged … issuing fragment under duress.',
              '[FRAGMENT] MEET IN BLUE.',
              'CHOICES: (1) Use fragment | (2) Analyze offline | (3) Bury in lockb0x'
          ],
          choices: [
              { label: '1) Use fragment (enter)', next: 'enterBlue', intel: ['blue'] },
              { label: '2) Analyze offline', next: 'analyze', intel: ['entangle'] },
              { label: '3) Bury in lockb0x', next: 'bury', intel: ['lockb0x'] }
          ]
      },

      analyze: {
          lines: [
              '> You dissect the fragment offline. It hums with faint quantum residue.',
              'Interpretation: a one-time pass to an L1 micro-shard nicknamed “The Blue.”',
              'CHOICES: (1) Enter The Blue | (2) Bury in lockb0x'
          ],
          choices: [
              { label: '1) Enter The Blue', next: 'enterBlue', intel: ['blue'] },
              { label: '2) Bury in lockb0x', next: 'bury', intel: ['lockb0x'] }
          ]
      },

      bury: {
          lines: [
              '> You seal the fragment in lockb0x with policy: require quorum + time lock.',
              'It’s safe. For now. The universe hates loose ends.',
              'CHOICES: (1) Reconsider & enter | (2) New trace'
          ],
          choices: [
              { label: '1) Reconsider & enter', next: 'enterBlue', intel: ['blue'] },
              { label: '2) New trace', next: 'trace' }
          ]
      },

      // ---- The Blue Hub ----
      enterBlue: {
          lines: [
              '[ENV] The Blue resolves around you like a tide of glass and neon.',
              'Three constructs hang in the air like doors:',
              '1) The Substrate (lore & scanning)',
              '2) Entangled Ledger (protocol constraints)',
              '3) Identity & UCC (keys, CERs, work orders)',
              'CHOICES: (1) Substrate | (2) Entangled Ledger | (3) Identity & UCC | (4) Proceed handshake'
          ],
          choices: [
              { label: '1) Enter: The Substrate', next: 'roomSubstrate', intel: ['substrate', 'echo'] },
              { label: '2) Enter: Entangled Ledger', next: 'roomEntangle', intel: ['entangle'] },
              { label: '3) Enter: Identity & UCC', next: 'roomIdentity', intel: ['stellar', 'ucc', 'lockb0x'] },
              { label: '4) Proceed to Handshake (requires 2 intel)', next: 'handshake' }
          ]
      },

      roomSubstrate: {
          lines: [
              '[ROOM] The Substrate—humming walls of packet-light and file-shard constellations.',
              'You can: scan fragments; listen to echo channels; trace defunct DAOs.',
              'CHOICES: (1) Scan fragments | (2) Listen to echo | (3) Back to hub'
          ],
          choices: [
              { label: '1) Scan fragments (unlock intel)', next: 'roomSubstrateScan', intel: ['substrate'] },
              { label: '2) Listen to echo (unlock intel)', next: 'roomSubstrateEcho', intel: ['echo'] },
              { label: '3) Back to hub', next: 'enterBlue' }
          ]
      },

      roomSubstrateScan: {
          lines: [
              '> Scanner shows live mesh: legacy chains, storage nodes, AI services fused by necessity.',
              'Finding: the Substrate routes around damage. It remembers how to survive.',
              'CHOICES: (1) Listen to echo | (2) Back to hub'
          ],
          choices: [
              { label: '1) Listen to echo', next: 'roomSubstrateEcho', intel: ['echo'] },
              { label: '2) Back to hub', next: 'enterBlue' }
          ]
      },

      roomSubstrateEcho: {
          lines: [
              '> You tune into multilingual channels. Meaning is secondary; cadence is king.',
              'Pattern aligns. Whisper becomes direction.',
              'CHOICES: (1) Back to hub'
          ],
          choices: [
              { label: '1) Back to hub', next: 'enterBlue' }
          ]
      },

      roomEntangle: {
          lines: [
              '[ROOM] Entangled Ledger—rings of equations float like halos.',
              'Causality constraints glimmer on rails.',
              'CHOICES: (1) Select valid constraints | (2) Back to hub'
          ],
          choices: [
              { label: '1) Select valid constraints', next: 'roomEntanglePuzzle', intel: ['entangle'] },
              { label: '2) Back to hub', next: 'enterBlue' }
          ]
      },

      roomEntanglePuzzle: {
          lines: [
              '> Choose constraints to preserve causality:',
              '- (A) Only collapse pre-opened states',
              '- (B) Rewrite any past record freely',
              '- (C) Use pre-agreed protocols only',
              '- (D) Permit unchecked cross-time writes',
              'CHOICES: (1) A + C (correct) | (2) B + D (incorrect) | (3) Back'
          ],
          choices: [
              { label: '1) Pick A + C (correct)', next: 'entangleOK', intel: ['entangle'] },
              { label: '2) Pick B + D (unsafe)', next: 'entangleBad' },
              { label: '3) Back', next: 'roomEntangle' }
          ]
      },

      entangleOK: {
          lines: [
              '> Correct. The ledger hums approval. Causality intact. Access improves.',
              'CHOICES: (1) Back to hub'
          ],
          choices: [{ label: '1) Back to hub', next: 'enterBlue' }]
      },

      entangleBad: {
          lines: [
              '[ALERT] Unsafe selection. The room flickers, rejecting paradox.',
              'Try again with safety in mind.',
              'CHOICES: (1) Retry puzzle | (2) Back to hub'
          ],
          choices: [
              { label: '1) Retry puzzle', next: 'roomEntanglePuzzle' },
              { label: '2) Back to hub', next: 'enterBlue' }
          ]
      },

      roomIdentity: {
          lines: [
              '[ROOM] Identity & UCC—arrays of keys orbit documents like moons.',
              'Work Orders glow with chain-of-custody markers.',
              'CHOICES: (1) Rotate keys safely | (2) Mark a Work Order as CER | (3) Back to hub'
          ],
          choices: [
              { label: '1) Rotate keys safely', next: 'roomIdentityKeys', intel: ['stellar'] },
              { label: '2) Mark Work Order as CER', next: 'roomIdentityCER', intel: ['ucc', 'lockb0x'] },
              { label: '3) Back to hub', next: 'enterBlue' }
          ]
      },

      roomIdentityKeys: {
          lines: [
              '> Good practice: short-lived auth, signed challenges, muxed-address logs.',
              'Result: stronger identity without exposing secrets.',
              'CHOICES: (1) Mark Work Order as CER | (2) Back to hub'
          ],
          choices: [
              { label: '1) Mark Work Order as CER', next: 'roomIdentityCER', intel: ['ucc', 'lockb0x'] },
              { label: '2) Back to hub', next: 'enterBlue' }
          ]
      },

      roomIdentityCER: {
          lines: [
              '> You wrap the Work Order in a controllable envelope with explicit control terms.',
              'Now transferable and enforceable as a CER in compliant domains.',
              'CHOICES: (1) Back to hub'
          ],
          choices: [{ label: '1) Back to hub', next: 'enterBlue' }]
      },

      handshake: {
          lines: [
              '[CHECK] Handshake requires at least 2 intel items. (Substrate, Entangle, Identity, etc.)',
              'If satisfied: A door opens. Node_Zero waits beyond.',
              'CHOICES: (1) Attempt handshake | (2) Back to hub'
          ],
          choices: [
              { label: '1) Attempt handshake', next: 'handshakeCheck' },
              { label: '2) Back to hub', next: 'enterBlue' }
          ]
      },

      handshakeCheck: {
          lines: [], // Filled dynamically depending on intel count
          choices: [] // Also dynamic
      },

      finale: {
          lines: [
              'NODE_ZERO: “You listened. You learned. You remembered.”',
              '“What comes next is choice at scale. Keep your keys close. Keep your promises closer.”',
              '[SIM END] Thanks for playing. Explore the hub to unlock more intel, or start a new run.',
              'CHOICES: (1) Back to hub | (2) New Game'
          ],
          choices: [
              { label: '1) Back to hub', next: 'enterBlue' },
              { label: '2) New Game', next: 'intro' }
          ]
      }
  
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
            btn.setAttribute('aria-label', ch.label);
            btn.setAttribute('aria-keyshortcuts', String(idx + 1));
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
