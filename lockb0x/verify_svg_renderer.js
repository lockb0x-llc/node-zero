// verify_svg_renderer.js — Deterministic Reconstruction Renderer (ESM)
// -----------------------------------------------------------------------------
// This module reconstructs the exact same SVG that preview.js produces.
// It is intentionally strict, no randomness, no browser quirks.
// It guarantees that verification produces a byte-for-byte equivalent shape.
// -----------------------------------------------------------------------------

import { clamp360 } from "./utils.js";

// Public API
export function renderVerifiedSVG(meta) {
    const {
        variant,
        bg,
        p1,
        p2,
        tilt,
        sw,
        glow
    } = normalize(meta);

    // Create root SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "260");
    svg.setAttribute("height", "260");
    svg.setAttribute("viewBox", "0 0 200 200");
    svg.style.background = `hsl(${bg}, 20%, 12%)`;
    svg.style.borderRadius = "6px";

    // Build <defs> with glow filter
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const blur = glow > 30 ? 4 + glow / 10 : 2;

    defs.innerHTML = `
        <filter id="verifyGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="${blur}" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    `;

    svg.appendChild(defs);

    // Group containing the rotated symbol
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(100,100) rotate(${tilt})`);
    svg.appendChild(g);

    // Stroke colors
    const primaryColor = `hsl(${p1}, 90%, 60%)`;
    const secondaryColor = `hsl(${p2}, 90%, 65%)`;
    const strokeWidth = sw / 10.0;

    // Render correct variant
    const element = variantRenderer(variant, primaryColor, secondaryColor, strokeWidth);
    element.setAttribute("filter", "url(#verifyGlow)");

    g.appendChild(element);

    return svg;
}

// -----------------------------------------------------------------------------
// Normalize the decoded metadata into field names used by the renderer.
// The CBOR decoder yields keys exactly as encoded: "bg", "p1", "p2", etc.
// -----------------------------------------------------------------------------

function normalize(meta) {
    return {
        variant: meta.variant,
        bg: clamp360(meta.bg),
        p1: clamp360(meta.p1),
        p2: clamp360(meta.p2),
        tilt: meta.tilt,
        sw: meta.sw,
        glow: meta.glow
    };
}

// -----------------------------------------------------------------------------
// Variant dispatch
// -----------------------------------------------------------------------------

function variantRenderer(v, c1, c2, sw) {
    switch (v) {
        case 1: return classicKey(c1, sw);
        case 2: return doubleBar(c1, sw);
        case 3: return crescentGlyph(c1, c2, sw);
        case 4: return triHelix(c1, sw);
        case 5: return innerCoreSpike(c1, c2, sw);
        case 6: return outerFrameRing(c1, sw);
        case 7: return latticeArray(c1, sw);
        case 8: return bladeArc(c1, c2, sw);
        case 9: return fractalSplitRing(c1, sw);
        default: return classicKey(c1, sw);
    }
}

// -----------------------------------------------------------------------------
// Variant Implementations — Must match preview.js exactly.
// -----------------------------------------------------------------------------

function classicKey(color, sw) {
    const p = createPath("M -40 0 L 40 0 M 0 -40 L 0 40", color, sw);
    return p;
}

function doubleBar(color, sw) {
    const g = createGroup();

    g.appendChild(createLine(-40, -10, 40, -10, color, sw));
    g.appendChild(createLine(-40, 10, 40, 10, color, sw));

    return g;
}

function crescentGlyph(c1, c2, sw) {
    const g = createGroup();

    const outer = createCircle(34, c1, sw);
    const inner = createCircle(24, c2, sw);
    inner.setAttribute("transform", "translate(10,0)");

    g.appendChild(outer);
    g.appendChild(inner);

    return g;
}

function triHelix(color, sw) {
    return createPath("M0 -40 Q28 -20 0 0 T0 40", color, sw);
}

function innerCoreSpike(c1, c2, sw) {
    const g = createGroup();

    const spike = createPath("M0 -38 L10 0 L0 18 L-10 0 Z", c1, sw);
    spike.setAttribute("fill", "none");

    const core = createCircle(10, c2, sw);

    g.appendChild(spike);
    g.appendChild(core);

    return g;
}

function outerFrameRing(color, sw) {
    return createCircle(42, color, sw);
}

function latticeArray(color, sw) {
    const g = createGroup();

    for (let i = 0; i < 6; i++) {
        const angle = i * 60;
        const line = createLine(0, -35, 0, 35, color, sw);
        line.setAttribute("transform", `rotate(${angle})`);
        g.appendChild(line);
    }

    return g;
}

function bladeArc(c1, c2, sw) {
    const g = createGroup();

    const arc = createPath("M -30 -10 A 40 40 0 0 1 30 -10", c1, sw);
    const spine = createLine(0, -10, 0, 20, c2, sw);

    g.appendChild(arc);
    g.appendChild(spine);

    return g;
}

function fractalSplitRing(color, sw) {
    const g = createGroup();

    const ring = createCircle(38, color, sw);
    const cut = createPath("M -38 0 L 38 0", color, sw);

    g.appendChild(ring);
    g.appendChild(cut);

    return g;
}

// -----------------------------------------------------------------------------
// Primitive creators
// -----------------------------------------------------------------------------

function createGroup() {
    return document.createElementNS("http://www.w3.org/2000/svg", "g");
}

function createCircle(r, color, sw) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", r);
    c.setAttribute("stroke", color);
    c.setAttribute("stroke-width", sw);
    c.setAttribute("fill", "none");
    return c;
}

function createLine(x1, y1, x2, y2, color, sw) {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1);
    l.setAttribute("y1", y1);
    l.setAttribute("x2", x2);
    l.setAttribute("y2", y2);
    l.setAttribute("stroke", color);
    l.setAttribute("stroke-width", sw);
    l.setAttribute("stroke-linecap", "round");
    return l;
}

function createPath(d, color, sw) {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    p.setAttribute("stroke", color);
    p.setAttribute("stroke-width", sw);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke-linecap", "round");
    return p;
}

export default { renderVerifiedSVG };
