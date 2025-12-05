// params.js - Clamp helpers, parameter reading/validation, price table

export function assert(condition, message) {
    if (!condition) throw new Error(message || "Assertion failed");
}

export function clamp360(x) {
    x = Number(x);
    if (isNaN(x)) return 0;
    return ((x % 360) + 360) % 360;
}

export function clamp01(v) {
    v = Number(v);
    if (isNaN(v)) return 0;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
}

export function readParams(tier) {
    const bgHue        = clamp360(Number(document.getElementById("bgHue").value));
    const primaryHue   = clamp360(Number(document.getElementById("primaryHue").value));
    const secondaryHue = clamp360(Number(document.getElementById("secondaryHue").value));
    const tilt         = Number(document.getElementById("tilt").value);
    const stroke       = Number(document.getElementById("stroke").value);
    const glow         = Number(document.getElementById("glow").value);
    const variant      = Number(document.getElementById("variantSelect").value);
    const maxVariant = (tier === "standard") ? 3 : 15;
    const p = {
        bgHue:        Number(bgHue),
        primaryHue:   Number(primaryHue),
        secondaryHue: Number(secondaryHue),
        tilt:         Number(tilt),
        strokeTenths: Number(stroke),
        glowPercent:  Number(glow),
        variant:      Number(variant)
    };
    if (p.bgHue < 0 || p.bgHue >= 360) throw new Error("bgHue out of range");
    if (p.primaryHue < 0 || p.primaryHue >= 360) throw new Error("primaryHue out of range");
    if (p.secondaryHue < 0 || p.secondaryHue >= 360) throw new Error("secondaryHue out of range");
    if (p.tilt < -18 || p.tilt > 18) throw new Error("tilt out of range");
    if (p.strokeTenths < 10 || p.strokeTenths > 40) throw new Error("stroke out of range");
    if (p.glowPercent < 20 || p.glowPercent > 90) throw new Error("glow out of range");
    if (p.variant < 1 || p.variant > maxVariant)
        throw new Error(`Variant ${p.variant} not allowed for ${tier} tier`);
    return p;
}

export function getTierPrice(tier) {
    if (!window.ethers || typeof window.ethers.parseEther !== "function") {
        throw new Error("ethers.js not loaded");
    }
    switch (tier) {
        case "standard":
        case "intermediate":
            return window.ethers.parseEther("0.01");
        case "premium":
            return window.ethers.parseEther("0.05");
        default:
            throw new Error("Unknown tier: " + tier);
    }
}
