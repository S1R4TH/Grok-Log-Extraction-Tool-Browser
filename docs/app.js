import {
  FORMAT_OPTIONS,
  conversationHasAttachments,
} from "./log-processor.js";
import {
  exportConversationToDirectory,
  getDirectoryIfExists,
  getFileIfExists,
} from "./file-exporter.js";

const elements = {
  folderButton: document.querySelector("#folder-button"),
  folderName: document.querySelector("#folder-name"),
  assetFallback: document.querySelector("#asset-fallback"),
  assetButton: document.querySelector("#asset-button"),
  formatSelect: document.querySelector("#format-select"),
  conversationSelect: document.querySelector("#conversation-select"),
  outputInputs: [...document.querySelectorAll('.format-options input[type="checkbox"]')],
  formatError: document.querySelector("#format-error"),
  runButton: document.querySelector("#run-button"),
  progress: document.querySelector("#progress"),
  progressLabel: document.querySelector("#progress-label"),
  statusText: document.querySelector("#status-text"),
};

const state = {
  exportDirectory: null,
  assetDirectory: null,
  conversations: [],
  needsAssets: false,
  running: false,
};

function setStatus(message) {
  elements.statusText.textContent = message;
}

function setProgress(value) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  elements.progress.value = normalized;
  elements.progress.textContent = `${normalized}%`;
  elements.progressLabel.value = `${normalized}%`;
  elements.progressLabel.textContent = `${normalized}%`;
}

function yieldToBrowser() {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

function selectedOutputFormats() {
  return elements.outputInputs.filter((input) => input.checked).map((input) => input.value);
}

function refreshAssetFallback() {
  const htmlSelected = selectedOutputFormats().includes("html");
  elements.assetFallback.hidden = !htmlSelected || Boolean(state.assetDirectory) || !state.needsAssets;
}

function refreshOutputControls() {
  const hasOutput = selectedOutputFormats().length > 0;
  elements.formatError.hidden = hasOutput;
  elements.runButton.disabled = state.running || !state.conversations.length || !hasOutput;
  refreshAssetFallback();
}

function populateConversationTitles() {
  const titles = [...new Set(
    state.conversations
      .map((conversation) => conversation?.conversation?.title)
      .filter((title) => typeof title === "string" && title),
  )].sort();
  elements.conversationSelect.replaceChildren();
  const all = document.createElement("option");
  all.value = "__all__";
  all.textContent = "ALL Conversations";
  elements.conversationSelect.append(all);
  for (const title of titles) {
    const option = document.createElement("option");
    option.value = title;
    option.textContent = title;
    elements.conversationSelect.append(option);
  }
  elements.conversationSelect.disabled = false;
  refreshOutputControls();
}

function setControlsDisabled(disabled) {
  elements.folderButton.disabled = disabled;
  elements.assetButton.disabled = disabled;
  elements.formatSelect.disabled = disabled;
  for (const input of elements.outputInputs) input.disabled = disabled;
  elements.conversationSelect.disabled = disabled || !state.conversations.length;
  elements.runButton.disabled = disabled || !state.conversations.length || !selectedOutputFormats().length;
}

async function selectExportFolder() {
  if (!("showDirectoryPicker" in window)) {
    setStatus("This browser cannot write an extracted_logs folder. Use a current version of Chrome or Edge.");
    return;
  }
  try {
    const directory = await window.showDirectoryPicker({ mode: "readwrite" });
    const jsonHandle = await getFileIfExists(directory, "prod-grok-backend.json");
    if (!jsonHandle) throw new Error("prod-grok-backend.json was not found in the selected folder.");

    setControlsDisabled(true);
    setStatus("Reading prod-grok-backend.json...");
    setProgress(0);
    await yieldToBrowser();
    const jsonFile = await jsonHandle.getFile();
    const text = await jsonFile.text();
    setStatus("Parsing Grok export...");
    await yieldToBrowser();
    const data = JSON.parse(text);
    if (!Array.isArray(data?.conversations)) throw new Error("The selected file does not contain a conversations array.");

    state.exportDirectory = directory;
    state.assetDirectory = await getDirectoryIfExists(directory, "prod-mc-asset-server");
    state.conversations = data.conversations;
    state.needsAssets = state.conversations.some(conversationHasAttachments);
    elements.folderName.textContent = directory.name;
    populateConversationTitles();
    refreshAssetFallback();
    setStatus(`Loaded ${state.conversations.length.toLocaleString()} conversation(s).`);
  } catch (error) {
    if (error?.name !== "AbortError") setStatus(`Failed to load export: ${error?.message || error}`);
  } finally {
    setControlsDisabled(false);
  }
}

async function selectAssetFolder() {
  if (!("showDirectoryPicker" in window)) return;
  try {
    const selected = await window.showDirectoryPicker({ mode: "read" });
    state.assetDirectory = selected.name === "prod-mc-asset-server"
      ? selected
      : await getDirectoryIfExists(selected, "prod-mc-asset-server") || selected;
    elements.assetFallback.hidden = true;
    setStatus(`Asset folder selected: ${state.assetDirectory.name}`);
  } catch (error) {
    if (error?.name !== "AbortError") setStatus(`Failed to select asset folder: ${error?.message || error}`);
  }
}

async function startExtraction() {
  if (state.running || !state.exportDirectory || !state.conversations.length) return;
  const outputFormats = selectedOutputFormats();
  if (!outputFormats.length) {
    refreshOutputControls();
    return;
  }
  state.running = true;
  setControlsDisabled(true);
  setProgress(0);
  try {
    const extractedLogsDirectory = await state.exportDirectory.getDirectoryHandle("extracted_logs", { create: true });
    const selected = elements.conversationSelect.value;
    const titleFilter = selected === "__all__" ? "" : selected.toLowerCase();
    const formatKey = FORMAT_OPTIONS[elements.formatSelect.value] ? elements.formatSelect.value : "iso";
    let exportedCount = 0;
    const total = state.conversations.length;

    for (let index = 0; index < total; index += 1) {
      const conversation = state.conversations[index];
      const progress = ((index + 1) / total) * 100;
      setProgress(progress);
      setStatus(`Processing... ${Math.trunc(progress)}% (${index + 1}/${total})`);
      await yieldToBrowser();
      const title = conversation?.conversation?.title || "Untitled";
      if (titleFilter && title.toLowerCase() !== titleFilter) continue;
      if (await exportConversationToDirectory(
        conversation,
        extractedLogsDirectory,
        state.assetDirectory,
        formatKey,
        { outputFormats, yieldEvery: async () => yieldToBrowser() },
      )) exportedCount += 1;
    }
    setProgress(100);
    setStatus(`Completed. Exported ${exportedCount} conversation(s).`);
  } catch (error) {
    setStatus(`Extraction failed: ${error?.message || error}`);
  } finally {
    state.running = false;
    setControlsDisabled(false);
  }
}

elements.folderButton.addEventListener("click", selectExportFolder);
elements.assetButton.addEventListener("click", selectAssetFolder);
elements.runButton.addEventListener("click", startExtraction);
for (const input of elements.outputInputs) input.addEventListener("change", refreshOutputControls);

if (!("showDirectoryPicker" in window)) {
  elements.folderButton.disabled = true;
  setStatus("This browser cannot write an extracted_logs folder. Use a current version of Chrome or Edge.");
}
