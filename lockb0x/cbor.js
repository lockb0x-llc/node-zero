// cbor.js — Canonical CBOR Encoder for Lockb0x Symbol NFT (ESM)
// -----------------------------------------------------------------------------
// Produces byte-accurate CBOR that matches the Solidity tokenURI() generator.
// Map fields MUST be encoded in identical key order for correct verification.
// This module ensures:
//   • Minimal integer encoding (major type 0 for unsigned, 1 for negative)
//   • Deterministic map ordering
//   • Exact key names as in Solidity
//   • Reproducibility for verification on-chain or off-chain
// -----------------------------------------------------------------------------

// Utility: encode unsigned integer minimally
function encodeUint(n) {
    if (n < 24) {
        return new Uint8Array([n]);                 // small uint (<24)
    }
    if (n < 256) {
        return new Uint8Array([0x18, n]);           // uint8
    }
    if (n < 65536) {
        return new Uint8Array([0x19, n >> 8, n & 0xff]); // uint16
    }
    // Normally won't occur in your params, but kept for completeness
    return new Uint8Array([
        0x1a,
        (n >>> 24) & 0xff,
        (n >>> 16) & 0xff,
        (n >>> 8) & 0xff,
        n & 0xff
    ]);
}

// Utility: encode signed integer to CBOR minimal form
function encodeInt(n) {
    if (n >= 0) return encodeUint(n);

    const v = -(n + 1);
    if (v < 24) {
        return new Uint8Array([0x20 | v]); // small negative
    }
    if (v < 256) {
        return new Uint8Array([0x38, v]);
    }
    return new Uint8Array([0x39, v >> 8, v & 0xff]);
}

// Utility: encode text string
function encodeText(str) {
    const enc = new TextEncoder().encode(str);
    const header = (enc.length < 24)
        ? new Uint8Array([0x60 | enc.length])
        : new Uint8Array([0x78, enc.length]);
    return concat(header, enc);
}

// Concatenate Uint8Arrays
function concat(...arrays) {
    let total = arrays.reduce((acc, a) => acc + a.byteLength, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const arr of arrays) {
        out.set(arr, offset);
        offset += arr.byteLength;
    }
    return out;
}

// -----------------------------------------------------------------------------
// Main encoder — produces CBOR MAP of 8 fields in canonical order.
// Order MUST match Solidity tokenURI():
//   1. "v"
//   2. "variant"
//   3. "bg"
//   4. "p1"
//   5. "p2"
//   6. "tilt"
//   7. "sw"
//   8. "glow"
// -----------------------------------------------------------------------------

export function encodeCBORParams(p) {

    // Encode all fields
    const versionKey   = encodeText("v");
    const versionVal   = encodeUint(1);

    const variantKey   = encodeText("variant");
    const variantVal   = encodeUint(p.variant);

    const bgKey        = encodeText("bg");
    const bgVal        = encodeUint(p.bgHue);

    const p1Key        = encodeText("p1");
    const p1Val        = encodeUint(p.primaryHue);

    const p2Key        = encodeText("p2");
    const p2Val        = encodeUint(p.secondaryHue);

    const tiltKey      = encodeText("tilt");
    const tiltVal      = encodeInt(p.tilt);

    const swKey        = encodeText("sw");
    const swVal        = encodeUint(p.strokeTenths);

    const glowKey      = encodeText("glow");
    const glowVal      = encodeUint(p.glowPercent);

    // MAP header — 8 key/value pairs
    // major type 5 (map), length = 8  →  0xA8
    const mapHeader = new Uint8Array([0xA8]);

    return concat(
        mapHeader,
        versionKey,   versionVal,
        variantKey,   variantVal,
        bgKey,        bgVal,
        p1Key,        p1Val,
        p2Key,        p2Val,
        tiltKey,      tiltVal,
        swKey,        swVal,
        glowKey,      glowVal
    );
}

export default {
    encodeCBORParams
};
