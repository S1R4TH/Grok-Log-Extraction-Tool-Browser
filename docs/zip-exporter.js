import {
  buildCompatibleLogRecords,
  buildConversationOutputs,
  detectAssetType,
  normalizeResponseNodes,
  orderResponseNodesForExport,
  responseAttachmentIds,
  sanitizeFilename,
} from "./log-processor.js";

function generatedUrlsOf(response) {
  const value = response?.generated_image_urls || [];
  return typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
}

function createAttachmentResolver(inputArchive, assetRoot, outputZip, assetOutputPrefix, relativeAssetDirectory) {
  const assetCache = new Map();

  const resolveAsset = (assetId) => {
    if (!assetCache.has(assetId)) {
      assetCache.set(assetId, (async () => {
        const entry = inputArchive?.findAssetEntry(assetRoot, assetId);
        if (!entry) return null;
        const blob = await inputArchive.readBlob(entry);
        const header = await blob.slice(0, 65536).arrayBuffer();
        const [extension, mime, preview] = detectAssetType(header);
        const outputName = `${assetId}${extension}`;
        outputZip.add(`${assetOutputPrefix}/${outputName}`, blob);
        return {
          exists: true,
          mime,
          extension,
          relative_path: `${relativeAssetDirectory}/${outputName}`,
          preview,
        };
      })());
    }
    return assetCache.get(assetId);
  };

  return async (response, imageRenders = []) => {
    const attachments = [];
    const generatedUrls = generatedUrlsOf(response);
    const generated = String(response?.query_type || "").toLowerCase() === "imagine" || generatedUrls.length > 0;
    const imageRenderIds = new Set(imageRenders.map((render) => render.image_uuid).filter(Boolean));

    for (const assetId of responseAttachmentIds(response)) {
      const originalPath = generatedUrls.find((value) => typeof value === "string" && value.includes(assetId)) || null;
      const attachment = {
        asset_id: assetId,
        generated: generated || imageRenderIds.has(assetId),
        original_path: originalPath,
        exists: false,
        mime: null,
        extension: null,
        relative_path: null,
        preview: null,
      };
      if (/^[A-Za-z0-9._-]+$/.test(assetId)) {
        try {
          const resolved = await resolveAsset(assetId);
          if (resolved) Object.assign(attachment, resolved);
        } catch {
          // Preserve the existing missing-attachment behavior for damaged or unreadable assets.
        }
      }
      attachments.push(attachment);
    }
    return attachments;
  };
}

export async function exportConversationToZip(
  conversation,
  outputZip,
  inputArchive,
  assetRoot,
  formatKey,
  options = {},
) {
  const outputFormats = [...new Set(options.outputFormats || ["html", "json", "txt"])]
    .filter((format) => ["html", "json", "txt"].includes(format));
  if (!outputFormats.length) throw new Error("Select at least one output format.");
  const yieldEvery = options.yieldEvery || (async () => {});
  const rootPath = options.rootPath;
  if (!rootPath) throw new Error("The output ZIP root folder was not provided.");
  const title = conversation?.conversation?.title || "Untitled";
  const safeTitle = sanitizeFilename(title);
  const conversationPrefix = `${rootPath}/${safeTitle}`;
  const relativeAssetDirectory = `${safeTitle}_assets`;
  const resolveAttachments = outputFormats.includes("html")
    ? createAttachmentResolver(
      inputArchive,
      assetRoot,
      outputZip,
      `${conversationPrefix}/html/${relativeAssetDirectory}`,
      relativeAssetDirectory,
    )
    : async () => [];
  const responses = conversation?.conversation?.responses || conversation?.responses || [];
  const leafResponseId = conversation?.conversation?.leaf_response_id;
  const nodes = await normalizeResponseNodes(responses, leafResponseId, resolveAttachments, formatKey, yieldEvery);
  const outputNodes = orderResponseNodesForExport(nodes);
  const allLogs = buildCompatibleLogRecords(outputNodes, formatKey);
  if (!allLogs.length) return false;

  for (const output of buildConversationOutputs(title, safeTitle, allLogs, outputFormats)) {
    outputZip.add(`${conversationPrefix}/${output.directory}/${output.name}`, output.content);
  }
  return true;
}
