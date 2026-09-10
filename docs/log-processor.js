export const FORMAT_OPTIONS = {
  iso: { label: "YYYY-MM-DD (ISO / Standard)", month: "iso", date: "iso", time: "iso" },
  us: { label: "MM/DD/YYYY (US Format)", month: "slash", date: "us", time: "us" },
  eu: { label: "DD/MM/YYYY (EU Format)", month: "slash", date: "eu", time: "eu" },
};

const WINDOWS_RESERVED_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  ...Array.from({ length: 9 }, (_, index) => `COM${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `LPT${index + 1}`),
]);

const SOURCE_PRIORITIES = { cited: 0, opened: 1, search_result: 2 };
const TRACKING_QUERY_PARAMETERS = new Set([
  "dclid", "fbclid", "gclid", "igshid", "mc_cid", "mc_eid", "msclkid",
  "oly_anon_id", "oly_enc_id", "rb_clickid", "s_cid", "vero_conv", "vero_id",
  "wickedid", "yclid",
]);

export const LOG_CSS = String.raw`
*, *::before, *::after {
    box-sizing: border-box;
}
body {
    font-family: 'Yu Gothic UI', Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    background-color: #e0e0e0;
    padding: 20px;
}
.chat-container {
    padding: 0;
}
.message {
    width: 100%;
    margin: 10px 0;
    clear: both;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}
.message.user {
    align-items: flex-end;
}
.message.assistant {
    align-items: flex-start;
}
.bubble {
    max-width: 60%;
    padding: 9px 11px;
    border-radius: 5px;
    line-height: 1.4;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}
.bubble:empty::before {
    content: "\00a0";
}
.message.user .bubble {
    background-color: #c0c0c0;
}
.message.assistant .bubble {
    background-color: #d0d0d0;
}
.timestamp {
    font-size: 0.8em;
    color: #808080;
    margin-top: 5px;
}
a, a:visited {
    color: #000;
    text-decoration: none;
}
.year-box {
    background-color: #d0d0d0;
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 8px;
}
.month-list a {
    display: inline-block;
    margin: 5px 10px;
    font-weight: bold;
}
.full-log {
    display: block;
    margin-bottom: 20px;
    font-size: 1.2em;
    font-weight: bold;
}
.date-divider {
    text-align: center;
    margin: 32px 0 14px 0;
    clear: both;
}
.date-divider span {
    background-color: #b0b0b0;
    color: #333;
    font-size: 0.85em;
    font-weight: bold;
    padding: 4px 12px;
    border-radius: 12px;
    display: inline-block;
}
.back-link {
    display: inline-block;
    margin-bottom: 15px;
    color: #555;
    font-size: 0.9em;
    text-decoration: none;
}
.back-link:hover {
    text-decoration: underline;
}
.media {
    width: min(480px, 100%);
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    background: none;
}
.message.user .media {
    align-items: flex-end;
}
.media-item {
    max-width: 100%;
    text-align: left;
    background: none;
}
.media-item > a {
    display: inline-block;
    max-width: 100%;
}
.media-item img {
    display: block;
    max-width: min(360px, 100%);
    max-height: 420px;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 8px;
}
.media-image {
    width: 100%;
    display: flex;
    justify-content: flex-start;
}
.media-image > a {
    width: 100%;
    display: flex;
    justify-content: flex-start;
}
.message.user .media-image {
    justify-content: flex-end;
}
.message.user .media-image > a {
    justify-content: flex-end;
}
.media-item video {
    display: block;
    width: min(480px, 100%);
    max-height: 420px;
}
.media-video {
    width: min(480px, 100%);
}
.media-item audio {
    display: block;
    width: min(360px, 100%);
}
.media-audio {
    width: min(360px, 100%);
}
.media-file,
.media-missing {
    width: min(480px, 100%);
    padding: 4px 0;
    background: none;
    overflow-wrap: anywhere;
}
.attachment-preview {
    max-height: 240px;
    overflow: auto;
    white-space: pre-wrap;
    font-family: Consolas, monospace;
    font-size: 0.85em;
    text-align: left;
    background: none;
    border: 1px solid rgba(128, 128, 128, 0.45);
    padding: 8px;
    border-radius: 5px;
}
.generated-assets,
.sources {
    width: min(600px, 100%);
    margin-top: 8px;
    color: #444;
    font-size: 0.88em;
}
.generated-assets summary,
.sources summary {
    cursor: pointer;
    color: #555;
    font-weight: bold;
    user-select: none;
}
.generated-assets ul,
.sources ol {
    margin: 8px 0 0 22px;
    padding: 0;
}
.generated-assets li,
.sources li {
    margin: 7px 0;
    overflow-wrap: anywhere;
}
.generated-assets li > span {
    display: block;
    margin-top: 2px;
}
.message.user > .generated-assets,
.message.user > .sources {
    text-align: right;
}
.message.user > .generated-assets ul,
.message.user > .sources ol {
    text-align: left;
}
.source-title {
    text-decoration: underline;
    text-decoration-color: rgba(0, 0, 0, 0.25);
}
.source-domain {
    display: block;
    margin-top: 1px;
    color: #777;
    font-size: 0.9em;
}
@media (max-width: 600px) {
    body {
        padding: 12px;
    }
    .bubble {
        max-width: 82%;
    }
    .media,
    .generated-assets,
    .sources {
        max-width: 100%;
    }
    .media-item img {
        max-width: min(360px, calc(100vw - 24px));
    }
}
.image-renders {
    width: min(600px, 100%);
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    color: #444;
    font-size: 0.88em;
}
.image-render-link {
    text-decoration: underline;
    text-decoration-color: rgba(0, 0, 0, 0.25);
}
`;

export function sanitizeFilename(value, fallback = "Untitled") {
  let safe = String(value ?? "").replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").trim();
  safe = safe.replace(/[. ]+$/g, "");
  if (!safe) safe = fallback;
  if (WINDOWS_RESERVED_NAMES.has(safe.toUpperCase())) safe = `_${safe}`;
  return safe;
}

export function escapeHtml(value, quote = true) {
  let escaped = String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  if (quote) {
    escaped = escaped.replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
  }
  return escaped;
}

function normalizedSourceUrl(value) {
  if (typeof value !== "string") return null;
  const original = value.trim();
  let parsed;
  try {
    parsed = new URL(original);
  } catch {
    return null;
  }
  const scheme = parsed.protocol.toLowerCase();
  if ((scheme !== "http:" && scheme !== "https:") || !parsed.hostname) return null;

  const hostname = parsed.hostname.toLowerCase();
  let path = parsed.pathname || "/";
  if (path !== "/") path = path.replace(/\/+$/g, "") || "/";
  const queryItems = [...parsed.searchParams.entries()]
    .filter(([key]) => {
      const lowered = key.toLowerCase();
      return !lowered.startsWith("utm_") && !TRACKING_QUERY_PARAMETERS.has(lowered);
    })
    .sort(([keyA, valueA], [keyB, valueB]) => {
      if (keyA !== keyB) return keyA < keyB ? -1 : 1;
      if (valueA === valueB) return 0;
      return valueA < valueB ? -1 : 1;
    });
  const query = new URLSearchParams(queryItems).toString();
  const defaultPort = (scheme === "http:" && parsed.port === "80") || (scheme === "https:" && parsed.port === "443");
  const netloc = parsed.port && !defaultPort ? `${hostname}:${parsed.port}` : hostname;
  const canonical = `${scheme}//${netloc}${path}${query ? `?${query}` : ""}`;
  const domain = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  return { original, canonical, domain };
}

function sourceTitle(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return "";
  for (const key of ["title", "metadata_title", "page_title", "headline", "site_name", "name"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim() && !/^https?:\/\//.test(value)) return value.trim();
  }
  return "";
}

function collectSourceRecords(value, output) {
  if (typeof value === "string") {
    if (normalizedSourceUrl(value)) output.push([value, ""]);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectSourceRecords(item, output);
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const key of ["url", "webpage_url", "page_url", "source_url", "href", "link", "permalink", "uri"]) {
    if (normalizedSourceUrl(value[key])) {
      output.push([value[key], sourceTitle(value)]);
      return;
    }
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") collectSourceRecords(child, output);
  }
}

function normalizedToolName(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function collectToolPayloads(value, acceptedNames, output) {
  if (Array.isArray(value)) {
    for (const child of value) collectToolPayloads(child, acceptedNames, output);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizedToolName(key);
    if (acceptedNames.has(normalized)) output.push([normalized, child]);
    if (child && typeof child === "object") collectToolPayloads(child, acceptedNames, output);
  }
}

export function normalizeResponseSources(response) {
  const candidates = [];
  const addFrom = (container, kind, origin) => {
    const records = [];
    collectSourceRecords(container, records);
    for (const [url, title] of records) {
      const parsed = normalizedSourceUrl(url);
      if (!parsed) continue;
      candidates.push({
        url: parsed.original,
        canonical_url: parsed.canonical,
        domain: parsed.domain,
        title,
        kind,
        origin,
        priority: SOURCE_PRIORITIES[kind],
      });
    }
  };

  addFrom(response?.cited_web_search_results || [], "cited", "cited_web_search_results");
  const payloads = [];
  collectToolPayloads(response?.steps || [], new Set(["openpage", "xsearch", "xthreadfetch", "imagesearch"]), payloads);
  for (const [toolName, payload] of payloads) {
    addFrom(payload, toolName === "openpage" ? "opened" : "search_result", toolName === "openpage" ? "OpenPage" : toolName);
  }
  addFrom(response?.web_search_results || [], "search_result", "web_search_results");

  const deduplicated = new Map();
  const order = [];
  for (const candidate of candidates) {
    const key = candidate.canonical_url;
    const existing = deduplicated.get(key);
    if (!existing) {
      deduplicated.set(key, candidate);
      order.push(key);
    } else if (candidate.priority < existing.priority) {
      if (!candidate.title) candidate.title = existing.title;
      deduplicated.set(key, candidate);
    } else if (!existing.title && candidate.title) {
      existing.title = candidate.title;
    }
  }
  return order.map((key) => deduplicated.get(key));
}

export function responseAttachmentIds(response) {
  const result = [];
  let values = response?.file_attachments || [];
  if (typeof values === "string") values = [values];
  if (!Array.isArray(values)) values = [];
  for (const item of values) {
    const assetId = typeof item === "string" ? item : item && typeof item === "object"
      ? item.asset_id || item.id || item._id
      : null;
    if (assetId && !result.includes(String(assetId))) result.push(String(assetId));
  }

  if (typeof response?.image_edit_uri === "string") {
    const parts = response.image_edit_uri.replaceAll("\\", "/").replace(/\/+$/, "").split("/");
    if (parts.at(-1) === "content" && parts.length >= 2) {
      const assetId = parts.at(-2);
      if (assetId && !result.includes(assetId)) result.push(assetId);
    }
  }

  let generatedUrls = response?.generated_image_urls || [];
  if (typeof generatedUrls === "string") generatedUrls = [generatedUrls];
  if (String(response?.query_type || "").toLowerCase() === "imagine" && Array.isArray(generatedUrls)) {
    for (const value of generatedUrls) {
      if (typeof value !== "string") continue;
      const parts = value.replaceAll("\\", "/").replace(/\/+$/, "").split("/");
      if (parts.length >= 2) {
        const assetId = parts.at(-2);
        if (assetId && !result.includes(assetId)) result.push(assetId);
      }
    }
  }
  return result;
}

export function conversationHasAttachments(conversation) {
  const responses = conversation?.conversation?.responses || conversation?.responses || [];
  return responses.some((item) => responseAttachmentIds(responsePayload(item)).length > 0);
}

const IMAGE_RENDER_TYPES = new Map([
  ["render_generated_image", "generated_image"],
  ["render_edited_image", "edited_image"],
]);

function parseRenderAttribute(attributes, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(attributes);
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

function parseImageRenderBlocks(message) {
  const blocks = [];
  const pattern = /<grok:render\b([^>]*?)(?:\/>|>[\s\S]*?<\/grok:render\s*>)/gi;
  for (const match of message.matchAll(pattern)) {
    const renderType = parseRenderAttribute(match[1], "type").toLowerCase();
    const kind = IMAGE_RENDER_TYPES.get(renderType);
    if (!kind) continue;
    blocks.push({
      start: match.index,
      end: match.index + match[0].length,
      raw: match[0],
      kind,
      card_id: parseRenderAttribute(match[1], "card_id") || null,
    });
  }
  return blocks;
}

function parseJsonValue(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizedRenderKind(value) {
  const lowered = String(value || "").toLowerCase();
  return IMAGE_RENDER_TYPES.get(lowered)
    || (lowered === "generated_image" ? "generated_image" : lowered === "edited_image" ? "edited_image" : null);
}

function normalizeImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const original = value.trim();
  try {
    const parsed = new URL(original);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    const relative = original.replace(/^\/+/, "");
    return relative.startsWith("users/") ? `https://assets.grok.com/${relative}` : null;
  }
}

function numericValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function findSourceImageId(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);
  const keys = [
    "source_image_id", "sourceImageId", "source_image_uuid", "sourceImageUuid",
    "original_image_id", "originalImageId", "root_image_id", "rootImageId",
  ];
  for (const key of keys) {
    const candidate = value[key];
    if (candidate !== null && candidate !== undefined && candidate !== "") return String(candidate);
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") {
      const found = findSourceImageId(child, seen);
      if (found) return found;
    }
  }
  return null;
}

function sourceImageIdFromEditUri(response) {
  if (typeof response?.image_edit_uri !== "string") return null;
  const parts = response.image_edit_uri.replaceAll("\\", "/").replace(/\/+$/, "").split("/");
  return parts.at(-1) === "content" && parts.length >= 2 ? parts.at(-2) || null : null;
}

function betterImageChunk(candidate, existing) {
  const candidateComplete = candidate.progress === 100;
  const existingComplete = existing.progress === 100;
  if (candidateComplete !== existingComplete) return candidateComplete;
  const candidateProgress = candidate.progress ?? -Infinity;
  const existingProgress = existing.progress ?? -Infinity;
  if (candidateProgress !== existingProgress) return candidateProgress > existingProgress;
  return (candidate.seq ?? -Infinity) > (existing.seq ?? -Infinity);
}

function cleanRemovedRenderWhitespace(value) {
  return value.replace(/[ \t]+(?=\r?\n)/g, "").trim();
}

function txtImageMarker(render) {
  const label = render.kind === "edited_image" ? "Edited Image" : "Generated Image";
  return `[${label}]${render.url ? `\n${render.url}` : ""}`;
}

export function normalizeImageRenders(response, message) {
  const originalMessage = typeof message === "string" ? message : message == null ? "" : String(message);
  const blocks = parseImageRenderBlocks(originalMessage);
  const blockKindByCardId = new Map(blocks.filter((block) => block.card_id).map((block) => [block.card_id, block.kind]));
  let cardValues = response?.card_attachments_json || [];
  if (!Array.isArray(cardValues)) cardValues = [cardValues];
  const candidates = [];

  cardValues.forEach((rawCard, cardIndex) => {
    const card = parseJsonValue(rawCard);
    if (!card || typeof card !== "object" || Array.isArray(card)) return;
    let chunk = parseJsonValue(card.image_chunk);
    if (!chunk || typeof chunk !== "object" || Array.isArray(chunk)) return;
    const imageUuidValue = chunk.imageUuid ?? chunk.image_uuid;
    if (imageUuidValue === null || imageUuidValue === undefined || imageUuidValue === "") return;
    const cardId = card.id === null || card.id === undefined || card.id === "" ? null : String(card.id);
    const inferredKind = normalizedRenderKind(card.type)
      || normalizedRenderKind(card.cardType)
      || (cardId ? blockKindByCardId.get(cardId) : null)
      || null;
    if (!inferredKind) return;
    candidates.push({
      kind: inferredKind,
      image_uuid: String(imageUuidValue),
      url: normalizeImageUrl(chunk.imageUrl ?? chunk.image_url),
      progress: numericValue(chunk.progress),
      seq: numericValue(chunk.seq),
      prompt: typeof chunk.imagePrompt === "string" ? chunk.imagePrompt : typeof chunk.image_prompt === "string" ? chunk.image_prompt : null,
      resolution: chunk.resolution ?? card.resolution ?? null,
      source_image_id: findSourceImageId(chunk) || findSourceImageId(card) || null,
      card_id: cardId,
      card_index: cardIndex,
    });
  });

  const deduplicated = new Map();
  for (const candidate of candidates) {
    const existing = deduplicated.get(candidate.image_uuid);
    if (!existing || betterImageChunk(candidate, existing)) deduplicated.set(candidate.image_uuid, candidate);
  }
  const remaining = [...deduplicated.values()];
  const ordered = [];
  for (const block of blocks) {
    let index = block.card_id ? remaining.findIndex((candidate) => candidate.card_id === block.card_id) : -1;
    if (index < 0) index = remaining.findIndex((candidate) => candidate.kind === block.kind);
    if (index < 0 && remaining.length === 1) index = 0;
    if (index >= 0) {
      const candidate = remaining.splice(index, 1)[0];
      candidate.kind = block.kind;
      candidate.block = block;
      ordered.push(candidate);
    } else {
      ordered.push({
        kind: block.kind,
        image_uuid: null,
        url: null,
        progress: null,
        seq: null,
        prompt: null,
        resolution: null,
        source_image_id: null,
        card_id: block.card_id,
        card_index: Number.MAX_SAFE_INTEGER,
        block,
      });
    }
  }
  remaining.sort((left, right) => (left.seq ?? Number.MAX_SAFE_INTEGER) - (right.seq ?? Number.MAX_SAFE_INTEGER) || left.card_index - right.card_index);
  for (const candidate of remaining) {
    candidate.kind ||= "generated_image";
    candidate.block = null;
    ordered.push(candidate);
  }

  const fallbackSourceImageId = findSourceImageId(response) || sourceImageIdFromEditUri(response);
  for (const render of ordered) {
    if (render.kind === "edited_image" && !render.source_image_id) render.source_image_id = fallbackSourceImageId;
  }

  let cleanMessage = "";
  let txtMessage = "";
  let cursor = 0;
  const emitted = new Set();
  for (const block of blocks) {
    const before = originalMessage.slice(cursor, block.start);
    cleanMessage += before;
    txtMessage += before;
    const render = ordered.find((item) => item.block === block);
    const identity = render?.image_uuid || `${block.kind}:${block.card_id || block.start}`;
    if (render && !emitted.has(identity)) {
      txtMessage += `\n${txtImageMarker(render)}\n`;
      emitted.add(identity);
    }
    cursor = block.end;
  }
  cleanMessage += originalMessage.slice(cursor);
  txtMessage += originalMessage.slice(cursor);
  for (const render of ordered.filter((item) => !item.block)) {
    const identity = render.image_uuid || `${render.kind}:${render.card_id || render.card_index}`;
    if (!emitted.has(identity)) {
      txtMessage += `\n${txtImageMarker(render)}\n`;
      emitted.add(identity);
    }
  }

  const imageRenders = ordered.map((render) => ({
    kind: render.kind,
    image_uuid: render.image_uuid,
    url: render.url,
    progress: render.progress,
    seq: render.seq,
    prompt: render.prompt,
    resolution: render.resolution,
    source_image_id: render.kind === "edited_image" ? render.source_image_id : null,
  }));
  return {
    message: cleanRemovedRenderWhitespace(cleanMessage),
    txt_message: cleanRemovedRenderWhitespace(txtMessage),
    image_renders: imageRenders,
  };
}

function bytesStartWith(data, signature) {
  if (data.length < signature.length) return false;
  return signature.every((value, index) => data[index] === value);
}

function ascii(data, start, end) {
  return String.fromCharCode(...data.slice(start, end));
}

function decodeText(data) {
  for (const encoding of ["utf-8", "utf-16", "utf-16le", "utf-16be"]) {
    try {
      let text = new TextDecoder(encoding, { fatal: true }).decode(data);
      if (encoding === "utf-8" && text.charCodeAt(0) === 0xfeff) text = text.slice(1);
      if (!text) continue;
      let controlCount = 0;
      for (const character of text) {
        const code = character.codePointAt(0);
        if (code < 32 && !"\r\n\t\f\b".includes(character)) controlCount += 1;
      }
      if (controlCount / text.length <= 0.02) return text;
    } catch {
      // Try the next encoding.
    }
  }
  return null;
}

export function detectAssetType(arrayBuffer) {
  const data = new Uint8Array(arrayBuffer.slice(0, 65536));
  if (bytesStartWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return [".png", "image/png", null];
  if (bytesStartWith(data, [0xff, 0xd8, 0xff])) return [".jpg", "image/jpeg", null];
  if (data.length >= 12 && ascii(data, 0, 4) === "RIFF" && ascii(data, 8, 12) === "WEBP") return [".webp", "image/webp", null];
  if (ascii(data, 0, 6) === "GIF87a" || ascii(data, 0, 6) === "GIF89a") return [".gif", "image/gif", null];
  if (ascii(data, 0, 2) === "BM") return [".bmp", "image/bmp", null];
  if (bytesStartWith(data, [0x49, 0x49, 0x2a, 0x00]) || bytesStartWith(data, [0x4d, 0x4d, 0x00, 0x2a])) return [".tif", "image/tiff", null];
  if (ascii(data, 0, 4) === "%PDF") return [".pdf", "application/pdf", null];
  if (data.length >= 12 && ascii(data, 0, 4) === "RIFF" && ascii(data, 8, 12) === "WAVE") return [".wav", "audio/wav", null];
  if (data.length >= 12 && ascii(data, 0, 4) === "RIFF" && ascii(data, 8, 12) === "AVI ") return [".avi", "video/x-msvideo", null];
  if (ascii(data, 0, 4) === "OggS") return [".ogg", "audio/ogg", null];
  if (ascii(data, 0, 4) === "fLaC") return [".flac", "audio/flac", null];
  if (ascii(data, 0, 3) === "ID3" || (data.length >= 2 && data[0] === 0xff && (data[1] & 0xe0) === 0xe0)) return [".mp3", "audio/mpeg", null];
  if (bytesStartWith(data, [0x1a, 0x45, 0xdf, 0xa3])) {
    return new TextDecoder("latin1").decode(data.slice(0, 4096)).toLowerCase().includes("webm")
      ? [".webm", "video/webm", null]
      : [".mkv", "video/x-matroska", null];
  }
  if (data.length >= 12 && ascii(data, 4, 8) === "ftyp") {
    const brand = ascii(data, 8, 12);
    if (brand === "qt  ") return [".mov", "video/quicktime", null];
    if (["M4A ", "M4B ", "M4P ", "F4A ", "F4B "].includes(brand)) return [".m4a", "audio/mp4", null];
    return [".mp4", "video/mp4", null];
  }
  if (bytesStartWith(data, [0x50, 0x4b, 0x03, 0x04])) return [".zip", "application/zip", null];
  if (bytesStartWith(data, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return [".7z", "application/x-7z-compressed", null];
  if (bytesStartWith(data, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00]) || bytesStartWith(data, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00])) return [".rar", "application/vnd.rar", null];

  const text = decodeText(data);
  if (text === null) return [".bin", "application/octet-stream", null];
  const stripped = text.replace(/^[\ufeff \t\r\n]+/, "");
  const lowered = stripped.slice(0, 4096).toLowerCase();
  const preview = text.slice(0, 2000);
  if (lowered.startsWith("<svg") || (lowered.startsWith("<?xml") && lowered.includes("<svg"))) return [".svg", "image/svg+xml", preview];
  if (lowered.startsWith("<!doctype html") || lowered.startsWith("<html") || lowered.slice(0, 1000).includes("<head")) return [".html", "text/html", preview];
  if (lowered.startsWith("<?xml")) return [".xml", "application/xml", preview];
  if (stripped.startsWith("{") || stripped.startsWith("[")) {
    try {
      JSON.parse(text);
      return [".json", "application/json", preview];
    } catch {
      // Continue with source/text detection.
    }
  }
  if (stripped.startsWith("#!") && stripped.split(/\r?\n/, 1)[0].toLowerCase().includes("python")) return [".py", "text/x-python", preview];
  if (/^\s*(def|class|from|import)\s+/m.test(text)) return [".py", "text/x-python", preview];
  if (/^\s*(const|let|var|function)\s+/m.test(text) || text.includes("=>")) return [".js", "text/javascript", preview];
  if (/^\s*(#|##)\s+\S/m.test(text)) return [".md", "text/markdown", preview];
  return [".txt", "text/plain", preview];
}

function responsePayload(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return {};
  return item.response && typeof item.response === "object" && !Array.isArray(item.response) ? item.response : item;
}

export { responsePayload };

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function parseResponseDateTime(response) {
  let value = response?.create_time;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    value = value.$date ?? value;
    if (value && typeof value === "object" && !Array.isArray(value)) value = value.$numberLong;
  }
  if (value === null || value === undefined || value === "") return null;

  let date;
  if (typeof value === "number" || /^-?\d+$/.test(String(value))) {
    let number = Number(value);
    if (Math.abs(number) <= 100000000000) number *= 1000;
    date = new Date(number);
  } else {
    date = new Date(String(value));
  }
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(date, formatKey) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  if (formatKey === "us") return `${month}/${day}/${year} ${time}`;
  if (formatKey === "eu") return `${day}/${month}/${year} ${time}`;
  return `${year}-${month}-${day} ${time}`;
}

function formatMonth(date, formatKey) {
  if (!date) return "Unknown Date";
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  return formatKey === "iso" ? `${year}-${month}` : `${month}/${year}`;
}

function formatDay(date, formatKey) {
  if (!date) return "Unknown Date";
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  if (formatKey === "us") return `${month}/${day}/${year}`;
  if (formatKey === "eu") return `${day}/${month}/${year}`;
  return `${year}-${month}-${day}`;
}

function isoDateTime(date) {
  if (!date) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function compareNodesByDateAndIndex(left, right) {
  const leftDate = left.dt_obj;
  const rightDate = right.dt_obj;
  if (leftDate && rightDate) return leftDate.getTime() - rightDate.getTime() || left.source_index - right.source_index;
  if (leftDate) return -1;
  if (rightDate) return 1;
  return left.source_index - right.source_index;
}

export async function normalizeResponseNodes(
  responses,
  leafResponseId,
  resolveAttachments,
  formatKey,
  yieldEvery = async () => {},
) {
  const nodes = [];
  const firstNodeById = new Map();

  for (let sourceIndex = 0; sourceIndex < (responses || []).length; sourceIndex += 1) {
    const response = responsePayload(responses[sourceIndex]);
    if (!response || !Object.keys(response).length) continue;

    const rawResponseId = response._id ?? response.id;
    const responseId = rawResponseId === null || rawResponseId === undefined || rawResponseId === "" ? null : String(rawResponseId);
    let nodeKey = responseId || `@response-${sourceIndex}`;
    if (firstNodeById.has(nodeKey)) nodeKey = `${nodeKey}@duplicate-${sourceIndex}`;

    const sender = String(response.sender || response.role || "").trim().toLowerCase();
    const messageValue = response.message;
    const message = typeof messageValue === "string" ? messageValue : messageValue == null ? "" : String(messageValue);
    const normalizedImageContent = sender === "assistant"
      ? normalizeImageRenders(response, message)
      : { message: message.trim(), txt_message: message.trim(), image_renders: [] };
    const date = parseResponseDateTime(response);
    const mediaTypesValue = response.media_types;
    const mediaTypes = Array.isArray(mediaTypesValue)
      ? mediaTypesValue.map((value) => String(value).toLowerCase())
      : mediaTypesValue ? [String(mediaTypesValue).toLowerCase()] : [];
    const rawParentId = response.parent_response_id;
    const parentId = rawParentId === null || rawParentId === undefined || rawParentId === "" ? null : String(rawParentId);
    const attachments = await resolveAttachments(response, normalizedImageContent.image_renders);

    const node = {
      key: nodeKey,
      response_id: responseId,
      parent_response_id: parentId,
      parent_key: null,
      children: [],
      source_index: sourceIndex,
      sender,
      message: normalizedImageContent.message,
      txt_message: normalizedImageContent.txt_message,
      image_renders: normalizedImageContent.image_renders,
      dt_obj: date,
      time: formatDateTime(date, formatKey),
      iso_time: isoDateTime(date),
      media_types: mediaTypes,
      transcript_unavailable: sender === "assistant" && !normalizedImageContent.message && mediaTypes.includes("audio"),
      attachments,
      sources: sender === "assistant" ? normalizeResponseSources(response) : [],
      raw_response: response,
    };
    nodes.push(node);
    if (responseId && !firstNodeById.has(responseId)) firstNodeById.set(responseId, node);
    if ((sourceIndex + 1) % 250 === 0) await yieldEvery(sourceIndex + 1, responses.length);
  }

  const byKey = new Map(nodes.map((node) => [node.key, node]));
  for (const node of nodes) {
    const parent = firstNodeById.get(node.parent_response_id);
    if (parent && parent !== node) {
      node.parent_key = parent.key;
      parent.children.push(node.key);
    }
  }

  const preferredChild = new Map();
  const leaf = leafResponseId ? firstNodeById.get(String(leafResponseId)) : null;
  let cursor = leaf;
  const seen = new Set();
  let preferredRootKey = null;
  while (cursor && !seen.has(cursor.key)) {
    seen.add(cursor.key);
    const parentKey = cursor.parent_key;
    if (parentKey === null) {
      preferredRootKey = cursor.key;
      break;
    }
    preferredChild.set(parentKey, cursor.key);
    cursor = byKey.get(parentKey);
  }

  const compareChildren = (parentKey, leftKey, rightKey) => {
    const leftPreferred = leftKey === preferredChild.get(parentKey) ? 0 : 1;
    const rightPreferred = rightKey === preferredChild.get(parentKey) ? 0 : 1;
    return leftPreferred - rightPreferred || compareNodesByDateAndIndex(byKey.get(leftKey), byKey.get(rightKey));
  };
  const roots = nodes.filter((node) => node.parent_key === null);
  roots.sort((left, right) => {
    const leftPreferred = left.key === preferredRootKey ? 0 : 1;
    const rightPreferred = right.key === preferredRootKey ? 0 : 1;
    return leftPreferred - rightPreferred || compareNodesByDateAndIndex(left, right);
  });

  const ordered = [];
  const visited = new Set();
  const walk = (start) => {
    const stack = [start];
    while (stack.length) {
      const node = stack.pop();
      if (visited.has(node.key)) continue;
      visited.add(node.key);
      ordered.push(node);
      const children = [...node.children].sort((left, right) => compareChildren(node.key, left, right)).reverse();
      stack.push(...children.map((childKey) => byKey.get(childKey)));
    }
  };
  for (const root of roots) walk(root);
  for (const node of [...nodes].sort(compareNodesByDateAndIndex)) walk(node);
  ordered.forEach((node, graphOrder) => { node.graph_order = graphOrder; });
  return ordered;
}

export function orderResponseNodesForExport(nodes) {
  const dated = nodes.filter((node) => node.dt_obj !== null);
  const undated = nodes.filter((node) => node.dt_obj === null);
  dated.sort((left, right) => left.dt_obj.getTime() - right.dt_obj.getTime() || left.source_index - right.source_index);
  undated.sort((left, right) => (left.graph_order ?? left.source_index) - (right.graph_order ?? right.source_index) || left.source_index - right.source_index);
  return [...dated, ...undated];
}

export function buildCompatibleLogRecords(nodes, formatKey) {
  const records = [];
  let index = 0;
  while (index < nodes.length) {
    const node = nodes[index];
    if (node.sender !== "human" && node.sender !== "assistant") {
      index += 1;
      continue;
    }
    if (node.sender === "human" && index + 1 < nodes.length) {
      const following = nodes[index + 1];
      if (following.sender === "assistant" && following.parent_key === node.key) {
        records.push({ human: node, assistant: following });
        index += 2;
        continue;
      }
    }
    records.push({ [node.sender]: node });
    index += 1;
  }

  for (const record of records) {
    const anchor = record.human || record.assistant;
    const date = anchor.dt_obj;
    record.dt_obj = date;
    record.month_key = date ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}` : "unknown-date";
    record.month_display = formatMonth(date, formatKey);
    record.date_display = formatDay(date, formatKey);
  }
  return records;
}

export function compatibleJsonRecords(records) {
  return records.map((record) => {
    const item = {};
    for (const sender of ["human", "assistant"]) {
      const node = record[sender];
      if (node) {
        item[sender] = { message: node.message, time: node.iso_time };
        if (node.image_renders?.length) {
          item[sender].image_renders = node.image_renders.map((render) => {
            const imageRender = {
              kind: render.kind,
              image_uuid: render.image_uuid,
              url: render.url,
              prompt: render.prompt,
              resolution: render.resolution,
            };
            if (render.progress !== null && render.progress !== undefined) imageRender.progress = render.progress;
            if (render.seq !== null && render.seq !== undefined) imageRender.seq = render.seq;
            if (render.kind === "edited_image" && render.source_image_id) imageRender.source_image_id = render.source_image_id;
            return imageRender;
          });
        }
      }
    }
    return item;
  });
}

export function writeTxtRecords(records) {
  let output = "";
  for (const record of records) {
    for (const sender of ["human", "assistant"]) {
      const node = record[sender];
      if (node) output += `"${node.txt_message ?? node.message}"\n(${node.time})\n\n`;
    }
  }
  return output;
}

export function renderSourcesHtml(sources) {
  if (!sources?.length) return "";
  const items = sources.map((source) => {
    const url = escapeHtml(source.url, true);
    const domain = escapeHtml(source.domain);
    const title = escapeHtml(source.title || source.domain || source.url);
    const kind = escapeHtml(source.kind, true);
    return `<li data-source-kind="${kind}"><a class="source-title" href="${url}" target="_blank" rel="noopener noreferrer">${title}</a><span class="source-domain">${domain}</span></li>`;
  });
  return `<details class="sources"><summary>Sources (${sources.length})</summary><ol>${items.join("")}</ol></details>`;
}

export function renderAttachmentHtml(attachment) {
  const assetId = escapeHtml(attachment.asset_id, true);
  if (!attachment.exists) {
    const label = attachment.generated ? "Generated image not included in Grok export" : "Attachment not included in Grok export";
    const originalHtml = attachment.original_path ? `<br>Original path: ${escapeHtml(attachment.original_path, true)}` : "";
    return `<div class="media-item media-missing">[${label}]<br>Asset ID: ${assetId}${originalHtml}</div>`;
  }

  const path = escapeHtml(attachment.relative_path, true);
  const mimeType = attachment.mime || "application/octet-stream";
  const mime = escapeHtml(mimeType, true);
  const fileLink = `<a href="${path}" target="_blank" rel="noopener noreferrer">Open attachment (${mime})</a>`;
  if (mimeType.startsWith("image/")) {
    return `<div class="media-item media-image"><a href="${path}" target="_blank" rel="noopener noreferrer"><img src="${path}" alt="Attachment ${assetId}"></a></div>`;
  }
  if (mimeType.startsWith("video/")) {
    return `<div class="media-item media-video"><video controls preload="metadata"><source src="${path}" type="${mime}">${fileLink}</video></div>`;
  }
  if (mimeType.startsWith("audio/")) {
    return `<div class="media-item media-audio"><audio controls preload="metadata"><source src="${path}" type="${mime}">${fileLink}</audio></div>`;
  }
  if (mimeType.startsWith("text/") || mimeType === "application/json" || mimeType === "application/xml") {
    const preview = escapeHtml(attachment.preview || "");
    const previewHtml = preview ? `<pre class="attachment-preview">${preview}</pre>` : "";
    return `<div class="media-item media-file">${fileLink}${previewHtml}</div>`;
  }
  return `<div class="media-item media-file">${fileLink}<br>Asset ID: ${assetId}</div>`;
}

export function renderAttachmentsHtml(attachments) {
  const mediaAttachments = (attachments || []).filter((attachment) => !attachment.generated || attachment.exists);
  if (!mediaAttachments.length) return "";
  return `<div class="media">${mediaAttachments.map(renderAttachmentHtml).join("")}</div>`;
}

export function renderGeneratedAssetsHtml(attachments) {
  const generated = (attachments || []).filter((attachment) => attachment.generated);
  if (!generated.length) return "";
  const items = generated.map((attachment) => {
    const assetId = escapeHtml(attachment.asset_id, true);
    const originalHtml = attachment.original_path
      ? `<span class="generated-path">Original path: ${escapeHtml(attachment.original_path, true)}</span>`
      : "";
    const status = attachment.exists
      ? `<a href="${escapeHtml(attachment.relative_path, true)}" target="_blank" rel="noopener noreferrer">Open generated asset (${escapeHtml(attachment.mime || "application/octet-stream")})</a>`
      : "[Generated image not included in Grok export]";
    return `<li>${status}<span>Asset ID: ${assetId}</span>${originalHtml}</li>`;
  });
  return `<details class="generated-assets"><summary>Generated assets (${generated.length})</summary><ul>${items.join("")}</ul></details>`;
}

export function renderImageRendersHtml(imageRenders) {
  if (!imageRenders?.length) return "";
  const items = imageRenders.map((render) => {
    const label = render.kind === "edited_image" ? "Edited Image" : "Generated Image";
    if (!render.url) return `<span class="image-render-label">${label}</span>`;
    return `<a class="image-render-link" href="${escapeHtml(render.url, true)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return `<div class="image-renders">${items.join("")}</div>`;
}

export function renderMessageNodeHtml(sender, node) {
  const roleClass = sender === "human" ? "user" : "assistant";
  const bubbleHtml = `<div class="bubble">${escapeHtml(node.message || "")}</div>`;
  const mediaHtml = renderAttachmentsHtml(node.attachments || []);
  const imageRendersHtml = sender === "assistant" ? renderImageRendersHtml(node.image_renders || []) : "";
  const imageRenderIds = new Set((node.image_renders || []).map((render) => render.image_uuid).filter(Boolean));
  const generatedHtml = renderGeneratedAssetsHtml((node.attachments || []).filter((attachment) => !imageRenderIds.has(attachment.asset_id)));
  const sourcesHtml = sender === "assistant" ? renderSourcesHtml(node.sources || []) : "";
  return `
<div class="message ${roleClass}" data-sender="${escapeHtml(sender, true)}">
${bubbleHtml}
${mediaHtml}
${imageRendersHtml}
${generatedHtml}
${sourcesHtml}
<div class="timestamp">${escapeHtml(node.time)}</div>
</div>
`;
}

export function renderLogRecordHtml(record) {
  return ["human", "assistant"].filter((sender) => record[sender]).map((sender) => renderMessageNodeHtml(sender, record[sender])).join("");
}

function renderRecordsWithDateDividers(records) {
  let output = "";
  let lastDate = null;
  for (const record of records) {
    if (record.date_display !== lastDate) {
      output += `
<div style="clear: both;"></div>
<div class="date-divider">
<span>${escapeHtml(record.date_display)}</span>
</div>
`;
      lastDate = record.date_display;
    }
    output += renderLogRecordHtml(record);
  }
  return output;
}

function htmlDocument(title, body, pageTitle = title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(pageTitle)}</title>
<style>${LOG_CSS}</style>
</head>
<body>
<div class="chat-container">
${body}
</div></body></html>`;
}

export function buildConversationOutputs(title, safeTitle, allLogs, outputFormats = ["html", "json", "txt"]) {
  const outputs = [];
  const formats = new Set(outputFormats);
  const monthlyLogs = new Map();
  for (const log of allLogs) {
    if (!monthlyLogs.has(log.month_key)) monthlyLogs.set(log.month_key, []);
    monthlyLogs.get(log.month_key).push(log);
  }
  const months = [...monthlyLogs.keys()].sort();

  for (const monthKey of months) {
    const logs = monthlyLogs.get(monthKey);
    const monthLabel = logs[0].month_display;
    if (formats.has("txt")) outputs.push({ directory: "txt", name: `${monthKey}.txt`, content: writeTxtRecords(logs) });
    if (formats.has("json")) outputs.push({ directory: "json", name: `${monthKey}.json`, content: JSON.stringify(compatibleJsonRecords(logs), null, 2) });
    if (formats.has("html")) {
      const body = `<h1>${escapeHtml(title)}</h1>
<a href="index.html" class="back-link">← Back to Index</a>
<h2>${escapeHtml(monthLabel)}</h2>
${renderRecordsWithDateDividers(logs)}`;
      outputs.push({ directory: "html", name: `${monthKey}.html`, content: htmlDocument(title, body, `${title} - ${monthLabel}`) });
    }
  }

  if (formats.has("html")) {
    const yearMap = new Map();
    for (const monthKey of months) {
      let year = "Unknown";
      let monthOrder = 99;
      let label = "Unknown Date";
      const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
      if (match) {
        year = match[1];
        monthOrder = Number(match[2]);
        label = pad2(monthOrder);
      }
      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year).push({ monthOrder, monthKey, label });
    }

    let indexBody = `<h1>${escapeHtml(title)}</h1>
<a class="full-log" href="${escapeHtml(safeTitle, true)}.html">Full Log</a>
<h2>Monthly Log Index</h2>
`;
    for (const year of [...yearMap.keys()].sort()) {
      indexBody += `<div class="year-box"><h3>${escapeHtml(year)}</h3><div class="month-list">`;
      for (const item of yearMap.get(year).sort((left, right) => left.monthOrder - right.monthOrder || left.monthKey.localeCompare(right.monthKey))) {
        indexBody += `<a href="${escapeHtml(item.monthKey, true)}.html">${escapeHtml(item.label)}</a>`;
      }
      indexBody += "</div></div>";
    }
    outputs.push({ directory: "html", name: "index.html", content: htmlDocument(title, indexBody) });

    const fullBody = `<h1>${escapeHtml(title)}</h1>
<a href="index.html" class="back-link">← Back to Index</a>
<h2>Full Log</h2>
${renderRecordsWithDateDividers(allLogs)}`;
    outputs.push({ directory: "html", name: `${safeTitle}.html`, content: htmlDocument(title, fullBody) });
  }

  if (formats.has("txt")) outputs.push({ directory: "txt", name: `${safeTitle}.txt`, content: writeTxtRecords(allLogs) });
  if (formats.has("json")) outputs.push({ directory: "json", name: `${safeTitle}.json`, content: JSON.stringify(compatibleJsonRecords(allLogs), null, 2) });
  return outputs;
}
