/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./chapters/*.html",
    "./primer/*.html",
    "./artifacts/*.html",
    "./stories/*.html",
    "./the-blue/*.html",
    "./signals/*.html",
    "./js/*.js"
  ],
  theme: {
  extend: {
    colors: {
      backdrop: '#0f0f1f',
      neon: '#00ffff',
      magenta: '#ff00ff',
      neonGreen: '#39ff14',
      neonPink: '#ff1493',
      'cyber-bg': '#0f111a',
      'cyber-neon': '#00fff7',
      'cyber-magenta': '#ff00ea',
      'cyber-green': '#39ff14',
      'cyber-purple': '#a259ff',
      'cyber-yellow': '#ffe600',
    },
    fontFamily: {
      cyber: ['Orbitron', 'sans-serif'],
      mono: ["Fira Mono", "Menlo", "Monaco", "monospace"],
    },
    boxShadow: {
      'neon-cyan': '0 0 8px #00fff7, 0 0 24px #00fff7',
      'neon-magenta': '0 0 8px #ff00ea, 0 0 24px #ff00ea',
      'neon-green': '0 0 8px #39ff14, 0 0 24px #39ff14',
    },
    backgroundImage: {
      'cyberpunk': 'linear-gradient(135deg, #0f111a 0%, #1a1f2b 100%)',
      'scanlines': 'repeating-linear-gradient(180deg, transparent, transparent 2px, rgba(255,255,255,0.02) 3px, transparent 4px)',
    },
    animation: {
      flicker: 'flicker 2s infinite linear',
      glitch: 'glitch 1s infinite linear',
    },
    keyframes: {
      flicker: {
        '0%, 100%': { opacity: '1' },
        '10%, 20%': { opacity: '0.8' },
        '30%, 50%, 70%': { opacity: '0.6' },
        '40%, 60%, 80%': { opacity: '1' },
        '90%': { opacity: '0.7' },
      },
      glitch: {
        '0%': { transform: 'translate(0,0)' },
        '20%': { transform: 'translate(-2px,2px)' },
        '40%': { transform: 'translate(-2px,-2px)' },
        '60%': { transform: 'translate(2px,2px)' },
        '80%': { transform: 'translate(2px,-2px)' },
        '100%': { transform: 'translate(0,0)' },
      },
    },
  },
},
  plugins: [],
}

