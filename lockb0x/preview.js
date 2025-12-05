// preview.js — Integrated Static + Animated Variants
// ----------------------------------------------------

import { clamp360 } from "./utils.js";

const svg = document.getElementById("preview");

// ---------------------------------------------------------------------------
// STATIC SIGILS (Variants 1–9)
// ---------------------------------------------------------------------------

const STATIC_VARIANTS = {

    1: (p) => `
        <g>
            <circle cx="50" cy="50" r="32" />
            <circle cx="50" cy="50" r="28" stroke-dasharray="6 4" />
            <circle cx="50" cy="50" r="22" />
        </g>
    `,

    2: (p) => `
        <g>
            <line x1="50" y1="10" x2="50" y2="90" />
            <circle cx="50" cy="20" r="4" />
            <circle cx="50" cy="50" r="6" />
            <circle cx="50" cy="80" r="4" />
        </g>
    `,

    3: (p) => `
        <g>
            <path d="M50 15 L80 75 L20 75 Z"/>
            <path d="M50 30 Q65 45 50 60 Q35 45 50 30 Z"/>
        </g>
    `,

    4: (p) => `
        <g>
            <path d="M35 20 Q20 50 35 80"/>
            <path d="M50 20 Q65 50 50 80"/>
            <path d="M65 20 Q80 50 65 80"/>
            <circle cx="50" cy="50" r="8"/>
        </g>
    `,

    5: (p) => `
        <g>
            <circle cx="50" cy="50" r="26"/>
            <path d="M50 10 L50 90"/>
        </g>
    `,

    6: (p) => `
        <g>
            <circle cx="50" cy="50" r="38" stroke-dasharray="10 8 3 8"/>
        </g>
    `,

    7: (p) => `
        <g>
            <path d="M30 30 L70 70 M70 30 L30 70"/>
            <path d="M20 50 L80 50 M50 20 L50 80"/>
        </g>
    `,

    8: (p) => `
        <g>
            <path d="M20 60 Q50 10 80 60"/>
            <path d="M25 55 Q50 20 75 55"/>
        </g>
    `,

    9: (p) => `
        <g>
            <path d="M50 20 A30 30 0 1 1 49.9 20"/>
            <path d="M50 80 A30 30 0 1 0 50.1 80"/>
        </g>
    `,

};

// ---------------------------------------------------------------------------
// ANIMATED SIGILS (Variants 10–12)
// ---------------------------------------------------------------------------

const ANIMATED_VARIANTS = {

    10: (p) => `
        <g>
            <circle cx="50" cy="50" r="8">
                <animate attributeName="r" values="6;10;6" dur="2.8s" repeatCount="indefinite"/>
            </circle>

            <circle cx="50" cy="50" r="20" opacity="0.5">
                <animate attributeName="r" values="18;24;18" dur="2.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.8s" repeatCount="indefinite"/>
            </circle>
        </g>
    `,

    11: (p) => `
        <g>
            <path d="M20 50 A30 30 0 0 1 80 50">
                <animateTransform attributeName="transform" type="rotate"
                    from="0 50 50" to="360 50 50"
                    dur="6s" repeatCount="indefinite"/>
            </path>

            <path d="M80 50 A30 30 0 0 1 20 50">
                <animateTransform attributeName="transform" type="rotate"
                    from="360 50 50" to="0 50 50"
                    dur="6s" repeatCount="indefinite"/>
            </path>
        </g>
    `,

    12: (p) => `
        <g>
            <polygon 
                points="50 15, 75 32, 75 68, 50 85, 25 68, 25 32">
                <animate 
                    attributeName="points"
                    dur="3.2s"
                    repeatCount="indefinite"
                    values="
                        50 13, 78 30, 78 70, 50 87, 22 70, 22 30;
                        50 17, 72 34, 72 66, 50 83, 28 66, 28 34;
                        50 13, 78 30, 78 70, 50 87, 22 70, 22 30
                    "/>
            </polygon>
        </g>
    `,

};

// ---------------------------------------------------------------------------
// MASTER RENDER FUNCTION
// ---------------------------------------------------------------------------

function generateSVG() {
    const p = {
        bgHue: clamp360(document.getElementById("bgHue").value),
        primaryHue: clamp360(document.getElementById("primaryHue").value),
        secondaryHue: clamp360(document.getElementById("secondaryHue").value),
        tilt: Number(document.getElementById("tilt").value),
        stroke: Number(document.getElementById("stroke").value) / 10,
        glow: Number(document.getElementById("glow").value),
        variant: Number(document.getElementById("variantSelect").value),
    };

    const variantFn =
        STATIC_VARIANTS[p.variant] ||
        ANIMATED_VARIANTS[p.variant];

    svg.innerHTML = `
        <g transform="rotate(${p.tilt} 50 50)">
            <g stroke-width="${p.stroke}" 
               stroke="hsl(${p.primaryHue},100%,70%)"
               fill="hsl(${p.secondaryHue},100%,60%)"
               filter="drop-shadow(0 0 ${p.glow}px hsl(${p.primaryHue},100%,70%))">
                ${variantFn(p)}
            </g>
        </g>
    `;
}

// ---------------------------------------------------------------------------
// LISTENERS
// ---------------------------------------------------------------------------

[
    "variantSelect", "bgHue", "primaryHue", "secondaryHue",
    "tilt", "stroke", "glow"
].forEach(id => {
    document.getElementById(id).addEventListener("input", generateSVG);
});

// Tier-based variant availability enforcement (UI-only)
const tierSelect = document.getElementById("tierSelect");
const variantSelect = document.getElementById("variantSelect");

function enforceVariantRules() {
    const tier = tierSelect.value;

    // STANDARD → only variants 1–3
    if (tier === "standard") {
        [...variantSelect.options].forEach(opt => {
            const v = Number(opt.value);
            opt.disabled = v > 3;
        });

        // If user was on a higher variant, reset to Variant 1
        if (Number(variantSelect.value) > 3) {
            variantSelect.value = "1";
        }
    }

    // INTERMEDIATE & PREMIUM → allow all variants
    else {
        [...variantSelect.options].forEach(opt => {
            opt.disabled = false;
        });
    }

    // Re-render the SVG preview
    if (typeof generateSVG === "function") generateSVG();
}

// Run whenever tier changes
tierSelect.addEventListener("change", enforceVariantRules);

// Run on startup
enforceVariantRules();

generateSVG(); // initial render