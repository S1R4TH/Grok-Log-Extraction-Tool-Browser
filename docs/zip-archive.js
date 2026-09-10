import { inflateSync } from "./vendor/fflate.js";

const UTF8 = new TextEncoder();
const UTF8_DECODER = new TextDecoder("utf-8");
const UINT16_MAX = 0xffff;
const UINT32_MAX = 0xffffffff;

function uint16(view, offset) {
  return view.getUint16(offset, true);
}

function uint32(view, offset) {
  return view.getUint32(offset, true);
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
}

function normalizedInputPath(value) {
  const parts = String(value || "").replaceAll("\\", "/").split("/");
  const normalized = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") return null;
    normalized.push(part);
  }
  return normalized.join("/");
}

function normalizedOutputPath(value) {
  const path = normalizedInputPath(value);
  if (!path) throw new Error("The output ZIP contains an invalid path.");
  return path;
}

function decodeName(bytes) {
  return UTF8_DECODER.decode(bytes);
}

function findEndOfCentralDirectory(bytes) {
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (bytes[offset] === 0x50 && bytes[offset + 1] === 0x4b && bytes[offset + 2] === 0x05 && bytes[offset + 3] === 0x06) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const commentLength = uint16(view, offset + 20);
      if (offset + 22 + commentLength === bytes.length) return offset;
    }
  }
  return -1;
}

let crcTable = null;

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
    crcTable[index] = value >>> 0;
  }
  return crcTable;
}

function updateCrc(crc, bytes) {
  const table = getCrcTable();
  let value = crc;
  for (let index = 0; index < bytes.length; index += 1) value = table[(value ^ bytes[index]) & 0xff] ^ (value >>> 8);
  return value;
}

export async function crc32Blob(blob) {
  let crc = UINT32_MAX;
  const reader = blob.stream().getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      crc = updateCrc(crc, value);
    }
  } finally {
    reader.releaseLock();
  }
  return (crc ^ UINT32_MAX) >>> 0;
}

async function inflateBlob(compressed, expectedSize) {
  if (typeof DecompressionStream === "function") {
    try {
      const stream = compressed.stream().pipeThrough(new DecompressionStream("deflate-raw"));
      const blob = await new Response(stream).blob();
      if (blob.size !== expectedSize) throw new Error("The ZIP entry has an invalid uncompressed size.");
      return blob;
    } catch (error) {
      if (error?.message === "The ZIP entry has an invalid uncompressed size.") throw error;
      // Use the bundled DEFLATE implementation when the native stream format is unavailable.
    }
  }
  const compressedBytes = new Uint8Array(await compressed.arrayBuffer());
  const inflated = inflateSync(compressedBytes, { out: new Uint8Array(expectedSize) });
  return new Blob([inflated]);
}

export class ZipArchive {
  constructor(file, entries) {
    this.file = file;
    this.entries = entries;
    this.entriesByPath = new Map();
    for (const entry of entries) {
      if (!this.entriesByPath.has(entry.path)) this.entriesByPath.set(entry.path, entry);
    }
  }

  static async open(file) {
    if (!(file instanceof Blob)) throw new Error("Select a valid ZIP file.");
    if (file.size < 22) throw new Error("The selected ZIP file is empty or damaged.");
    const tailSize = Math.min(file.size, 22 + UINT16_MAX);
    const tailOffset = file.size - tailSize;
    const tail = new Uint8Array(await file.slice(tailOffset).arrayBuffer());
    const endOffset = findEndOfCentralDirectory(tail);
    if (endOffset < 0) throw new Error("The selected file is not a readable ZIP archive.");
    const endView = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
    const diskNumber = uint16(endView, endOffset + 4);
    const centralDisk = uint16(endView, endOffset + 6);
    const entriesOnDisk = uint16(endView, endOffset + 8);
    const entryCount = uint16(endView, endOffset + 10);
    const centralSize = uint32(endView, endOffset + 12);
    const centralOffset = uint32(endView, endOffset + 16);
    if (diskNumber || centralDisk || entriesOnDisk !== entryCount) throw new Error("Multi-part ZIP archives are not supported.");
    if (entryCount === UINT16_MAX || centralSize === UINT32_MAX || centralOffset === UINT32_MAX) {
      throw new Error("ZIP64 archives are not supported by this browser edition.");
    }
    if (centralOffset + centralSize > file.size) throw new Error("The ZIP central directory is damaged.");

    const centralBytes = new Uint8Array(await file.slice(centralOffset, centralOffset + centralSize).arrayBuffer());
    const centralView = new DataView(centralBytes.buffer, centralBytes.byteOffset, centralBytes.byteLength);
    const entries = [];
    let offset = 0;
    for (let index = 0; index < entryCount; index += 1) {
      if (offset + 46 > centralBytes.length || uint32(centralView, offset) !== 0x02014b50) {
        throw new Error("The ZIP central directory contains an invalid entry.");
      }
      const flags = uint16(centralView, offset + 8);
      const method = uint16(centralView, offset + 10);
      const crc = uint32(centralView, offset + 16);
      const compressedSize = uint32(centralView, offset + 20);
      const uncompressedSize = uint32(centralView, offset + 24);
      const nameLength = uint16(centralView, offset + 28);
      const extraLength = uint16(centralView, offset + 30);
      const commentLength = uint16(centralView, offset + 32);
      const localHeaderOffset = uint32(centralView, offset + 42);
      const recordLength = 46 + nameLength + extraLength + commentLength;
      if (offset + recordLength > centralBytes.length) throw new Error("The ZIP central directory is truncated.");
      const originalName = decodeName(centralBytes.subarray(offset + 46, offset + 46 + nameLength));
      const path = normalizedInputPath(originalName);
      if (path && !originalName.endsWith("/")) {
        entries.push({ path, flags, method, crc, compressedSize, uncompressedSize, localHeaderOffset });
      }
      offset += recordLength;
    }
    return new ZipArchive(file, entries);
  }

  findByBasename(name) {
    return this.entries.filter((entry) => entry.path.split("/").at(-1) === name);
  }

  getEntry(path) {
    return this.entriesByPath.get(normalizedInputPath(path)) || null;
  }

  findAssetRoots() {
    const roots = new Set();
    for (const entry of this.entries) {
      const parts = entry.path.split("/");
      const index = parts.findIndex((part) => part.toLowerCase() === "prod-mc-asset-server");
      if (index >= 0) roots.add(`${parts.slice(0, index + 1).join("/")}/`);
    }
    return [...roots].sort();
  }

  findAssetRootForBackend(backendPath) {
    const roots = this.findAssetRoots();
    const parent = backendPath.includes("/") ? backendPath.slice(0, backendPath.lastIndexOf("/") + 1) : "";
    const sibling = roots.filter((root) => root === `${parent}prod-mc-asset-server/`);
    if (sibling.length === 1) return { root: sibling[0], ambiguous: false };
    if (roots.length === 1) return { root: roots[0], ambiguous: false };
    return { root: null, ambiguous: roots.length > 1 };
  }

  findAssetEntry(assetRoot, assetId) {
    if (!assetRoot) return null;
    return this.getEntry(`${assetRoot}${assetId}/content`)
      || this.getEntry(`${assetRoot}_/${assetId}/content`);
  }

  async readBlob(entry) {
    if (!entry) throw new Error("The requested ZIP entry was not found.");
    if (entry.flags & 1) throw new Error(`Encrypted ZIP entries are not supported: ${entry.path}`);
    if (entry.method !== 0 && entry.method !== 8) throw new Error(`Unsupported ZIP compression method ${entry.method}: ${entry.path}`);
    const localBytes = new Uint8Array(await this.file.slice(entry.localHeaderOffset, entry.localHeaderOffset + 30).arrayBuffer());
    if (localBytes.length !== 30 || new DataView(localBytes.buffer, localBytes.byteOffset, localBytes.byteLength).getUint32(0, true) !== 0x04034b50) {
      throw new Error(`The ZIP entry header is damaged: ${entry.path}`);
    }
    const localView = new DataView(localBytes.buffer, localBytes.byteOffset, localBytes.byteLength);
    const dataOffset = entry.localHeaderOffset + 30 + uint16(localView, 26) + uint16(localView, 28);
    if (dataOffset + entry.compressedSize > this.file.size) throw new Error(`The ZIP entry data is truncated: ${entry.path}`);
    const compressed = this.file.slice(dataOffset, dataOffset + entry.compressedSize);
    const blob = entry.method === 0 ? compressed : await inflateBlob(compressed, entry.uncompressedSize);
    if (blob.size !== entry.uncompressedSize) throw new Error(`The ZIP entry has an invalid size: ${entry.path}`);
    if (await crc32Blob(blob) !== entry.crc) throw new Error(`The ZIP entry failed its integrity check: ${entry.path}`);
    return blob;
  }

  async readText(entry) {
    return (await this.readBlob(entry)).text();
  }
}

export function discoverGrokExport(archive) {
  const backendEntries = archive.findByBasename("prod-grok-backend.json");
  if (!backendEntries.length) throw new Error("prod-grok-backend.json was not found in the selected ZIP.");
  if (backendEntries.length > 1) {
    throw new Error(`Multiple prod-grok-backend.json files were found (${backendEntries.length}). Use an export ZIP containing exactly one backend file.`);
  }
  const backendEntry = backendEntries[0];
  return { backendEntry, assetDiscovery: archive.findAssetRootForBackend(backendEntry.path) };
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

export class ZipWriter {
  constructor() {
    this.entries = new Map();
  }

  add(path, content) {
    const normalized = normalizedOutputPath(path);
    const blob = content instanceof Blob ? content : new Blob([typeof content === "string" ? UTF8.encode(content) : content]);
    this.entries.set(normalized, blob);
  }

  has(path) {
    return this.entries.has(normalizedOutputPath(path));
  }

  async generateBlob(options = {}) {
    if (this.entries.size > UINT16_MAX) throw new Error("The output contains too many files for a standard ZIP archive.");
    const now = options.date instanceof Date ? options.date : new Date();
    const { time, day } = dosDateTime(now);
    const fileParts = [];
    const centralParts = [];
    let offset = 0;

    for (const [path, blob] of this.entries) {
      const name = UTF8.encode(path);
      if (name.length > UINT16_MAX || blob.size > UINT32_MAX || offset > UINT32_MAX) {
        throw new Error("The output is too large for a standard ZIP archive.");
      }
      const crc = await crc32Blob(blob);
      const local = new Uint8Array(30);
      const localView = new DataView(local.buffer);
      writeUint32(localView, 0, 0x04034b50);
      writeUint16(localView, 4, 20);
      writeUint16(localView, 6, 0x0800);
      writeUint16(localView, 8, 0);
      writeUint16(localView, 10, time);
      writeUint16(localView, 12, day);
      writeUint32(localView, 14, crc);
      writeUint32(localView, 18, blob.size);
      writeUint32(localView, 22, blob.size);
      writeUint16(localView, 26, name.length);
      fileParts.push(local, name, blob);

      const central = new Uint8Array(46);
      const centralView = new DataView(central.buffer);
      writeUint32(centralView, 0, 0x02014b50);
      writeUint16(centralView, 4, 20);
      writeUint16(centralView, 6, 20);
      writeUint16(centralView, 8, 0x0800);
      writeUint16(centralView, 10, 0);
      writeUint16(centralView, 12, time);
      writeUint16(centralView, 14, day);
      writeUint32(centralView, 16, crc);
      writeUint32(centralView, 20, blob.size);
      writeUint32(centralView, 24, blob.size);
      writeUint16(centralView, 28, name.length);
      writeUint32(centralView, 42, offset);
      centralParts.push(central, name);
      offset += local.length + name.length + blob.size;
    }

    const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
    if (offset + centralSize > UINT32_MAX) throw new Error("The output is too large for a standard ZIP archive.");
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    writeUint32(endView, 0, 0x06054b50);
    writeUint16(endView, 8, this.entries.size);
    writeUint16(endView, 10, this.entries.size);
    writeUint32(endView, 12, centralSize);
    writeUint32(endView, 16, offset);
    return new Blob([...fileParts, ...centralParts, end], { type: "application/zip" });
  }

  clear() {
    this.entries.clear();
  }
}

export function localDatedOutputName(date = new Date()) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `extracted_grok_logs_${year}${month}${day}`;
}
