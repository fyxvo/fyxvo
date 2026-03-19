#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = "/workspaces/fyxvo";
const SOURCE_PATH = path.join(ROOT, "logo.png");
const OUTPUTS = {
  logoPng: path.join(ROOT, "logo.png"),
  logoSvg: path.join(ROOT, "logo.svg"),
  publicLogoPng: path.join(ROOT, "apps/web/public/brand/logo.png"),
  publicLogoSvg: path.join(ROOT, "apps/web/public/brand/logo.svg"),
  iconPng: path.join(ROOT, "apps/web/app/icon.png"),
  appleIconPng: path.join(ROOT, "apps/web/app/apple-icon.png"),
  socialCardPng: path.join(ROOT, "apps/web/public/brand/social-card.png")
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readPng(filePath) {
  const file = fs.readFileSync(filePath);
  const signature = "89504e470d0a1a0a";
  if (file.slice(0, 8).toString("hex") !== signature) {
    throw new Error(`${filePath} is not a PNG image.`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    offset += 4;
    const type = file.slice(offset, offset + 4).toString("ascii");
    offset += 4;
    const chunk = file.slice(offset, offset + length);
    offset += length + 4;

    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      colorType = chunk[9];
    }

    if (type === "IDAT") {
      idatChunks.push(chunk);
    }

    if (type === "IEND") {
      break;
    }
  }

  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (bytesPerPixel === 0) {
    throw new Error(`Unsupported PNG color type ${colorType}.`);
  }

  const compressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * bytesPerPixel;
  const rgba = Buffer.alloc(width * height * 4);
  let sourceOffset = 0;

  function paeth(left, up, upLeft) {
    const candidate = left + up - upLeft;
    const leftDistance = Math.abs(candidate - left);
    const upDistance = Math.abs(candidate - up);
    const upLeftDistance = Math.abs(candidate - upLeft);

    if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
      return left;
    }
    if (upDistance <= upLeftDistance) {
      return up;
    }
    return upLeft;
  }

  const decoded = Buffer.alloc(width * height * bytesPerPixel);
  for (let y = 0; y < height; y += 1) {
    const filter = compressed[sourceOffset];
    sourceOffset += 1;
    const rowStart = y * stride;
    const previousRowStart = (y - 1) * stride;

    for (let x = 0; x < stride; x += 1) {
      const rawByte = compressed[sourceOffset];
      sourceOffset += 1;
      const left = x >= bytesPerPixel ? decoded[rowStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? decoded[previousRowStart + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? decoded[previousRowStart + x - bytesPerPixel] : 0;

      let value = rawByte;
      if (filter === 1) {
        value = (rawByte + left) & 0xff;
      } else if (filter === 2) {
        value = (rawByte + up) & 0xff;
      } else if (filter === 3) {
        value = (rawByte + Math.floor((left + up) / 2)) & 0xff;
      } else if (filter === 4) {
        value = (rawByte + paeth(left, up, upLeft)) & 0xff;
      }

      decoded[rowStart + x] = value;
    }
  }

  for (let index = 0, outputOffset = 0; index < decoded.length; index += bytesPerPixel, outputOffset += 4) {
    rgba[outputOffset] = decoded[index];
    rgba[outputOffset + 1] = decoded[index + 1];
    rgba[outputOffset + 2] = decoded[index + 2];
    rgba[outputOffset + 3] = bytesPerPixel === 4 ? decoded[index + 3] : 255;
  }

  return { width, height, rgba };
}

function writePng(filePath, width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const rowLength = width * 4;
  const raw = Buffer.alloc(height * (rowLength + 1));
  let rawOffset = 0;

  for (let y = 0; y < height; y += 1) {
    raw[rawOffset] = 0;
    rawOffset += 1;
    rgba.copy(raw, rawOffset, y * rowLength, (y + 1) * rowLength);
    rawOffset += rowLength;
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  function chunk(type, data) {
    const typeBuffer = Buffer.from(type, "ascii");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const payload = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(payload), 0);
    return Buffer.concat([length, payload, crc]);
  }

  const png = Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", header),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0))
  ]);

  fs.writeFileSync(filePath, png);
}

function colorDistance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

function getPixel(image, x, y) {
  const offset = (y * image.width + x) * 4;
  return image.rgba.slice(offset, offset + 4);
}

function setPixel(rgba, width, x, y, pixel) {
  const offset = (y * width + x) * 4;
  rgba[offset] = pixel[0];
  rgba[offset + 1] = pixel[1];
  rgba[offset + 2] = pixel[2];
  rgba[offset + 3] = pixel[3];
}

function removeBackground(image, threshold = 40) {
  const queue = [];
  const visited = new Uint8Array(image.width * image.height);
  const background = Array.from(getPixel(image, 0, 0).slice(0, 3));
  const mask = new Uint8Array(image.width * image.height);

  function push(x, y) {
    if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
      return;
    }

    const index = y * image.width + x;
    if (visited[index]) {
      return;
    }

    visited[index] = 1;
    const pixel = getPixel(image, x, y);
    if (colorDistance(background, Array.from(pixel.slice(0, 3))) <= threshold) {
      queue.push([x, y]);
      mask[index] = 1;
    }
  }

  for (let x = 0; x < image.width; x += 1) {
    push(x, 0);
    push(x, image.height - 1);
  }
  for (let y = 0; y < image.height; y += 1) {
    push(0, y);
    push(image.width - 1, y);
  }

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  const rgba = Buffer.from(image.rgba);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = y * image.width + x;
      const offset = index * 4;
      if (mask[index]) {
        rgba[offset + 3] = 0;
        continue;
      }

      const distance = colorDistance(background, Array.from(rgba.slice(offset, offset + 3)));
      const alpha = Math.max(0, Math.min(255, Math.round(((distance - 6) / 60) * 255)));
      rgba[offset + 3] = Math.max(alpha, 24);
    }
  }

  return {
    width: image.width,
    height: image.height,
    rgba
  };
}

function getOpaqueBounds(image, alphaThreshold = 12) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.rgba[(y * image.width + x) * 4 + 3];
      if (alpha <= alphaThreshold) {
        continue;
      }

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error("The logo became empty after background removal.");
  }

  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function samplePixel(image, x, y) {
  const clampedX = Math.max(0, Math.min(image.width - 1, x));
  const clampedY = Math.max(0, Math.min(image.height - 1, y));
  const offset = (clampedY * image.width + clampedX) * 4;
  return image.rgba.slice(offset, offset + 4);
}

function resizeNearest(image, targetWidth, targetHeight, bounds) {
  const rgba = Buffer.alloc(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = bounds.minY + Math.round(((y + 0.5) / targetHeight) * bounds.height - 0.5);
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = bounds.minX + Math.round(((x + 0.5) / targetWidth) * bounds.width - 0.5);
      setPixel(rgba, targetWidth, x, y, samplePixel(image, sourceX, sourceY));
    }
  }

  return { width: targetWidth, height: targetHeight, rgba };
}

function composite(dest, src, offsetX, offsetY) {
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const sourceOffset = (y * src.width + x) * 4;
      const alpha = src.rgba[sourceOffset + 3] / 255;
      if (alpha === 0) {
        continue;
      }

      const targetOffset = ((y + offsetY) * dest.width + (x + offsetX)) * 4;
      const inverseAlpha = 1 - alpha;
      dest.rgba[targetOffset] = Math.round(src.rgba[sourceOffset] * alpha + dest.rgba[targetOffset] * inverseAlpha);
      dest.rgba[targetOffset + 1] = Math.round(src.rgba[sourceOffset + 1] * alpha + dest.rgba[targetOffset + 1] * inverseAlpha);
      dest.rgba[targetOffset + 2] = Math.round(src.rgba[sourceOffset + 2] * alpha + dest.rgba[targetOffset + 2] * inverseAlpha);
      dest.rgba[targetOffset + 3] = Math.round((alpha + (dest.rgba[targetOffset + 3] / 255) * inverseAlpha) * 255);
    }
  }
}

function makeSquareLogo(image, size, paddingRatio) {
  const bounds = getOpaqueBounds(image);
  const innerSize = Math.round(size * (1 - paddingRatio * 2));
  const scale = Math.min(innerSize / bounds.width, innerSize / bounds.height);
  const targetWidth = Math.max(1, Math.round(bounds.width * scale));
  const targetHeight = Math.max(1, Math.round(bounds.height * scale));
  const scaled = resizeNearest(image, targetWidth, targetHeight, bounds);
  const rgba = Buffer.alloc(size * size * 4);
  const offsetX = Math.floor((size - scaled.width) / 2);
  const offsetY = Math.floor((size - scaled.height) / 2);
  composite({ width: size, height: size, rgba }, scaled, offsetX, offsetY);
  return { width: size, height: size, rgba };
}

function fillRect(rgba, width, x1, y1, x2, y2, color) {
  const startX = Math.max(0, Math.floor(Math.min(x1, x2)));
  const endX = Math.min(width, Math.ceil(Math.max(x1, x2)));
  for (let y = Math.max(0, Math.floor(Math.min(y1, y2))); y < Math.ceil(Math.max(y1, y2)); y += 1) {
    for (let x = startX; x < endX; x += 1) {
      setPixel(rgba, width, x, y, color);
    }
  }
}

function addCircleGlow(image, centerX, centerY, radius, color) {
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const distance = Math.hypot(x - centerX, y - centerY);
      if (distance > radius) {
        continue;
      }

      const strength = 1 - distance / radius;
      const alpha = color[3] * strength;
      const offset = (y * image.width + x) * 4;
      const sourceAlpha = alpha / 255;
      const inverseAlpha = 1 - sourceAlpha;
      image.rgba[offset] = Math.round(color[0] * sourceAlpha + image.rgba[offset] * inverseAlpha);
      image.rgba[offset + 1] = Math.round(color[1] * sourceAlpha + image.rgba[offset + 1] * inverseAlpha);
      image.rgba[offset + 2] = Math.round(color[2] * sourceAlpha + image.rgba[offset + 2] * inverseAlpha);
      image.rgba[offset + 3] = Math.round((sourceAlpha + (image.rgba[offset + 3] / 255) * inverseAlpha) * 255);
    }
  }
}

function makeSocialCard(image) {
  const width = 1600;
  const height = 900;
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const vertical = y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const horizontal = x / (width - 1);
      const offset = (y * width + x) * 4;
      rgba[offset] = Math.round(8 + 18 * vertical + 22 * horizontal);
      rgba[offset + 1] = Math.round(15 + 18 * vertical);
      rgba[offset + 2] = Math.round(28 + 36 * (1 - horizontal));
      rgba[offset + 3] = 255;
    }
  }

  const card = { width, height, rgba };
  addCircleGlow(card, 1180, 160, 320, [255, 146, 41, 72]);
  addCircleGlow(card, 360, 120, 220, [240, 124, 44, 44]);
  addCircleGlow(card, 1240, 540, 380, [255, 92, 18, 34]);

  fillRect(card.rgba, width, 96, 96, width - 96, height - 96, [10, 16, 29, 196]);

  const mark = makeSquareLogo(image, 320, 0.14);
  composite(card, mark, 120, 150);

  return card;
}

function writeSvg(filePath, pngPath, size) {
  const base64 = fs.readFileSync(pngPath).toString("base64");
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Fyxvo logo">`,
    `  <image href="data:image/png;base64,${base64}" width="${size}" height="${size}" />`,
    "</svg>"
  ].join("\n");
  fs.writeFileSync(filePath, svg);
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const source = readPng(SOURCE_PATH);
const transparent = removeBackground(source, 42);
const primary = makeSquareLogo(transparent, 1024, 0.18);
const icon = makeSquareLogo(transparent, 512, 0.19);
const appleIcon = makeSquareLogo(transparent, 512, 0.22);
const socialCard = makeSocialCard(transparent);

for (const filePath of Object.values(OUTPUTS)) {
  ensureDir(filePath);
}

writePng(OUTPUTS.logoPng, primary.width, primary.height, primary.rgba);
writePng(OUTPUTS.publicLogoPng, primary.width, primary.height, primary.rgba);
writePng(OUTPUTS.iconPng, icon.width, icon.height, icon.rgba);
writePng(OUTPUTS.appleIconPng, appleIcon.width, appleIcon.height, appleIcon.rgba);
writePng(OUTPUTS.socialCardPng, socialCard.width, socialCard.height, socialCard.rgba);
writeSvg(OUTPUTS.logoSvg, OUTPUTS.logoPng, primary.width);
writeSvg(OUTPUTS.publicLogoSvg, OUTPUTS.publicLogoPng, primary.width);

const bounds = getOpaqueBounds(primary);
console.log(
  JSON.stringify(
    {
      source: SOURCE_PATH,
      outputs: OUTPUTS,
      logoBounds: bounds
    },
    null,
    2
  )
);
