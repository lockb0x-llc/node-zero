// verify_cbor_decode.js — Canonical CBOR Decoder for Lockb0x Symbol NFT (ESM)
// -----------------------------------------------------------------------------
// This parser supports only the CBOR features used by your contract metadata:
//   • Unsigned ints (major type 0)
//   • Negative ints (major type 1)
//   • Text strings (major type 3)
//   • Maps      (major type 5)
// No arrays, floats, bigints, tags, or binary strings — unnecessary for our format.
// This keeps verification deterministic and minimal.
//
// WARNING: Do NOT “extend” the decoder without changing the contract encoding.
// -----------------------------------------------------------------------------

export function decodeCBOR(bytes) {
    let offset = 0;

    function readUint8() {
        return bytes[offset++];
    }

    // Read major type + argument
    function readHeader() {
        const byte = readUint8();
        return {
            major: byte >> 5,
            additional: byte & 0x1f
        };
    }

    // Decode a full item recursively
    function decodeItem() {
        const { major, additional } = readHeader();

        // -------------------------------------------------------------
        // Unsigned integer (major type 0)
        // -------------------------------------------------------------
        if (major === 0) {
            if (additional < 24) return additional;
            if (additional === 24) return readUint8();
            if (additional === 25) {
                const hi = readUint8();
                const lo = readUint8();
                return (hi << 8) | lo;
            }
            throw new Error("Unsupported uint length");
        }

        // -------------------------------------------------------------
        // Negative integer (major type 1)
        // CBOR negative value = -(n + 1)
        // -------------------------------------------------------------
        if (major === 1) {
            if (additional < 24) return -(additional + 1);
            if (additional === 24) {
                const v = readUint8();
                return -(v + 1);
            }
            if (additional === 25) {
                const hi = readUint8();
                const lo = readUint8();
                const n = (hi << 8) | lo;
                return -(n + 1);
            }
            throw new Error("Unsupported negative int length");
        }

        // -------------------------------------------------------------
        // Text string (major type 3)
        // -------------------------------------------------------------
        if (major === 3) {
            let length;
            if (additional < 24) {
                length = additional;
            } else if (additional === 24) {
                length = readUint8();
            } else if (additional === 25) {
                const hi = readUint8();
                const lo = readUint8();
                length = (hi << 8) | lo;
            } else {
                throw new Error("Unsupported text string length");
            }

            const slice = bytes.slice(offset, offset + length);
            offset += length;
            return new TextDecoder().decode(slice);
        }

        // -------------------------------------------------------------
        // Map (major type 5)
        // -------------------------------------------------------------
        if (major === 5) {
            let length;
            if (additional < 24) {
                length = additional;
            } else if (additional === 24) {
                length = readUint8();
            } else {
                throw new Error("Unsupported map size encoding");
            }

            const out = {};
            for (let i = 0; i < length; i++) {
                const key = decodeItem();
                const val = decodeItem();
                out[key] = val;
            }
            return out;
        }

        throw new Error(`Unsupported CBOR major type: ${major}`);
    }

    // Expect top-level to be a map
    const result = decodeItem();

    if (offset !== bytes.length) {
        console.warn("CBOR decode warning: not all bytes consumed.");
    }

    return result;
}

export default { decodeCBOR };
