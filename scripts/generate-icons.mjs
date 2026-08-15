// Generates the Study Time PWA icons (dependency-free PNG encoder, Node >= 18).
// Usage: bun scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

// --- Minimal PNG encoder (RGBA, 8-bit, filter 0) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * stride + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- Signed distance fields ---
function sdRoundedRect(px, py, cx, cy, halfW, halfH, r) {
  const qx = Math.abs(px - cx) - (halfW - r);
  const qy = Math.abs(py - cy) - (halfH - r);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

function sdCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r;
}

function sdSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / (abx * abx + aby * aby)));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

const cover = (d) => Math.min(1, Math.max(0, 0.5 - d));

function over(dst, srcRgb, srcA) {
  if (srcA <= 0) return dst;
  const da = dst.a;
  const oa = srcA + da * (1 - srcA);
  if (oa <= 0) return dst;
  const mix = srcA / oa;
  return {
    r: srcRgb[0] * mix + dst.r * (1 - mix),
    g: srcRgb[1] * mix + dst.g * (1 - mix),
    b: srcRgb[2] * mix + dst.b * (1 - mix),
    a: oa,
  };
}

const BG = [24, 26, 32]; // surface-ish dark
const CIRCLE = [78, 142, 231]; // primary blue
const HAND = [244, 246, 250]; // near-white

function renderIcon(size, { rounded }) {
  const px = new Uint8Array(size * size * 4);
  const center = size / 2;
  const radius = size * 0.22;
  const half = size / 2 - radius;
  const cr = size * 0.36;
  const minute = { x: center, y: center - size * 0.3 };
  const hour = { x: center + size * 0.17, y: center + size * 0.08 };
  const mw = size * 0.044; // minute hand half-thickness
  const hw = size * 0.054; // hour hand half-thickness
  const dotR = size * 0.05;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = x + 0.5;
      const fy = y + 0.5;
      let col = { r: 0, g: 0, b: 0, a: 0 };
      if (rounded) {
        col = over(col, BG, cover(sdRoundedRect(fx, fy, center, center, half, half, radius)));
      } else {
        col = over(col, BG, 1);
      }
      col = over(col, CIRCLE, cover(sdCircle(fx, fy, center, center, cr)));
      col = over(col, HAND, cover(sdSegment(fx, fy, center, center, minute.x, minute.y) - mw));
      col = over(col, HAND, cover(sdSegment(fx, fy, center, center, hour.x, hour.y) - hw));
      col = over(col, HAND, cover(sdCircle(fx, fy, center, center, dotR)));
      const i = (y * size + x) * 4;
      px[i] = Math.round(col.r);
      px[i + 1] = Math.round(col.g);
      px[i + 2] = Math.round(col.b);
      px[i + 3] = Math.round(col.a * 255);
    }
  }
  return encodePng(size, size, px);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  ["icon-192.png", 192, true],
  ["icon-512.png", 512, true],
  ["icon-maskable-192.png", 192, false],
  ["icon-maskable-512.png", 512, false],
  ["apple-touch-icon.png", 180, false],
];

for (const [name, size, rounded] of targets) {
  const out = join(OUT_DIR, name);
  writeFileSync(out, renderIcon(size, { rounded }));
  console.log(`wrote ${out} (${size}x${size})`);
}
