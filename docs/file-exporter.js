import {
  buildCompatibleLogRecords,
  buildConversationOutputs,
  detectAssetType,
  normalizeResponseNodes,
  orderResponseNodesForExport,
  responseAttachmentIds,
  sanitizeFilename,
} from "./log-processor.js";

export async function getDirectoryIfExists(parent, name) {
  try {
    return await parent.getDirectoryHandle(name);
  } catch (error) {
    if (error?.name === "NotFoundError" || error?.name === "TypeMismatchError") return null;
    throw error;
  }
}

export async function getFileIfExists(parent, name) {
  try {
    return await parent.getFileHandle(name);
  } catch (error) {
    if (error?.name === "NotFoundError" || error?.name === "TypeMismatchError") return null;
    throw error;
  }
}

async function writeTextFile(directory, name, content) {
  const handle = await directory.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function writeBinaryFileIfMissing(directory, name, file) {
  const existing = await getFileIfExists(directory, name);
  if (existing) return;
  const handle = await directory.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(file);
  await writable.close();
}

async function findAssetFile(assetRoot, assetId) {
  if (!assetRoot) return null;
  const direct = await getDirectoryIfExists(assetRoot, assetId);
  if (direct) {
    const content = await getFileIfExists(direct, "content");
    if (content) return content.getFile();
  }
  const underscore = await getDirectoryIfExists(assetRoot, "_");
  if (!underscore) return null;
  const nested = await getDirectoryIfExists(underscore, assetId);
  if (!nested) return null;
  const content = await getFileIfExists(nested, "content");
  return content ? content.getFile() : null;
}

function generatedUrlsOf(response) {
  const value = response?.generated_image_urls || [];
  return typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
}

function createAttachmentResolver(assetRoot, htmlDirectory, relativeAssetDirectory) {
  let assetOutputDirectoryPromise = null;
  const getAssetOutputDirectory = () => {
    assetOutputDirectoryPromise ||= htmlDirectory.getDirectoryHandle(relativeAssetDirectory, { create: true });
    return assetOutputDirectoryPromise;
  };

  return async (response) => {
    const attachments = [];
    const generatedUrls = generatedUrlsOf(response);
    const generated = String(response?.query_type || "").toLowerCase() === "imagine" || generatedUrls.length > 0;

    for (const assetId of responseAttachmentIds(response)) {
      const originalPath = generatedUrls.find((value) => typeof value === "string" && value.includes(assetId)) || null;
      const attachment = {
        asset_id: assetId,
        generated,
        original_path: originalPath,
        exists: false,
        mime: null,
        extension: null,
        relative_path: null,
        preview: null,
      };
      if (!/^[A-Za-z0-9._-]+$/.test(assetId)) {
        attachments.push(attachment);
        continue;
      }

      try {
        const sourceFile = await findAssetFile(assetRoot, assetId);
        if (!sourceFile) {
          attachments.push(attachment);
          continue;
        }
        const header = await sourceFile.slice(0, 65536).arrayBuffer();
        const [extension, mime, preview] = detectAssetType(header);
        const outputName = `${assetId}${extension}`;
        const outputDirectory = await getAssetOutputDirectory();
        await writeBinaryFileIfMissing(outputDirectory, outputName, sourceFile);
        Object.assign(attachment, {
          exists: true,
          mime,
          extension,
          relative_path: `${relativeAssetDirectory}/${outputName}`,
          preview,
        });
      } catch {
        // Match the desktop exporter: retain a missing placeholder on asset errors.
      }
      attachments.push(attachment);
    }
    return attachments;
  };
}

export async function exportConversationToDirectory(
  conversation,
  extractedLogsDirectory,
  assetDirectory,
  formatKey,
  options = {},
) {
  const outputFormats = [...new Set(options.outputFormats || ["html", "json", "txt"])]
    .filter((format) => ["html", "json", "txt"].includes(format));
  if (!outputFormats.length) throw new Error("Select at least one output format.");
  const yieldEvery = options.yieldEvery || (async () => {});
  const title = conversation?.conversation?.title || "Untitled";
  const safeTitle = sanitizeFilename(title);
  const conversationDirectory = await extractedLogsDirectory.getDirectoryHandle(safeTitle, { create: true });
  const directories = new Map();
  for (const format of outputFormats) {
    directories.set(format, await conversationDirectory.getDirectoryHandle(format, { create: true }));
  }
  const htmlDirectory = directories.get("html");
  const relativeAssetDirectory = `${safeTitle}_assets`;
  const resolveAttachments = htmlDirectory
    ? createAttachmentResolver(assetDirectory, htmlDirectory, relativeAssetDirectory)
    : async () => [];
  const responses = conversation?.conversation?.responses || conversation?.responses || [];
  const leafResponseId = conversation?.conversation?.leaf_response_id;
  const nodes = await normalizeResponseNodes(responses, leafResponseId, resolveAttachments, formatKey, yieldEvery);
  const outputNodes = orderResponseNodesForExport(nodes);
  const allLogs = buildCompatibleLogRecords(outputNodes, formatKey);
  if (!allLogs.length) return false;

  for (const output of buildConversationOutputs(title, safeTitle, allLogs, outputFormats)) {
    await writeTextFile(directories.get(output.directory), output.name, output.content);
  }
  return true;
}
