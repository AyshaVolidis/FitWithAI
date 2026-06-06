import { writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBytes = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function createPNG(size, r, g, b, a = 255) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowOff = y * (1 + size * 4);
    raw[rowOff] = 0;
    for (let x = 0; x < size; x++) {
      const po = rowOff + 1 + x * 4;
      const cx = x - size / 2;
      const cy = y - size / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const radius = size / 2 - size * 0.06;
      const innerR = size * 0.26;
      if (dist > radius) {
        raw[po] = 0; raw[po + 1] = 0; raw[po + 2] = 0; raw[po + 3] = 0;
      } else {
        const t = Math.min(1, (dist - innerR) / (radius - innerR));
        const edge = 1 - (1 - t) * (1 - t);
        raw[po] = Math.round(r + (30 - r) * edge);
        raw[po + 1] = Math.round(g + (150 - g) * edge);
        raw[po + 2] = Math.round(b + (255 - b) * edge);
        raw[po + 3] = a;
      }
    }
  }
  const deflated = deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflated), chunk("IEND", Buffer.alloc(0))]);
}

const publicDir = resolve(__dirname, "..", "public");

for (const size of [192, 512]) {
  const png = createPNG(size, 59, 130, 246);
  writeFileSync(resolve(publicDir, `icon-${size}.png`), png);
  console.log(`Created icon-${size}.png`);
}
