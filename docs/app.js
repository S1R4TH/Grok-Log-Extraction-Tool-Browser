import { FORMAT_OPTIONS, conversationHasAttachments } from "./log-processor.js";
import { exportConversationToZip } from "./zip-exporter.js";
import { ZipArchive, ZipWriter, discoverGrokExport, localDatedOutputName } from "./zip-archive.js";

const elements = {
  zipInput: document.querySelector("#zip-input"),
  zipName: document.querySelector("#zip-name"),
  assetStatus: document.querySelector("#asset-status"),
  formatSelect: document.querySelector("#format-select"),
  conversationSelect: document.querySelector("#conversation-select"),
  outputInputs: [...document.querySelectorAll('.format-options input[type="checkbox"]')],
  formatError: document.querySelector("#format-error"),
  runButton: document.querySelector("#run-button"),
  saveButton: document.querySelector("#save-button"),
  progress: document.querySelector("#progress"),
  progressLabel: document.querySelector("#progress-label"),
  statusText: document.querySelector("#status-text"),
};

const state = {
  inputFile: null,
  archive: null,
  backendEntry: null,
  assetRoot: null,
  conversations: [],
  needsAssets: false,
  outputBlob: null,
  outputFilename: null,
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

function resetGeneratedOutput() {
  state.outputBlob = null;
  state.outputFilename = null;
  elements.saveButton.hidden = true;
  elements.saveButton.disabled = true;
}

function refreshOutputControls() {
  const hasOutput = selectedOutputFormats().length > 0;
  elements.formatError.hidden = hasOutput;
  elements.runButton.disabled = state.running || !state.conversations.length || !hasOutput;
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
  elements.zipInput.disabled = disabled;
  elements.formatSelect.disabled = disabled;
  for (const input of elements.outputInputs) input.disabled = disabled;
  elements.conversationSelect.disabled = disabled || !state.conversations.length;
  elements.runButton.disabled = disabled || !state.conversations.length || !selectedOutputFormats().length;
  elements.saveButton.disabled = disabled || !state.outputBlob;
}

function resetLoadedExport() {
  state.inputFile = null;
  state.archive = null;
  state.backendEntry = null;
  state.assetRoot = null;
  state.conversations = [];
  state.needsAssets = false;
  elements.conversationSelect.replaceChildren(new Option("Load a Grok export ZIP first", ""));
  elements.conversationSelect.disabled = true;
  elements.assetStatus.hidden = true;
  resetGeneratedOutput();
}

function likelyMemoryError(error) {
  return error instanceof RangeError || /memory|allocation|array buffer|out of memory/i.test(String(error?.message || error));
}

function displayError(prefix, error) {
  const detail = error?.message || String(error);
  if (likelyMemoryError(error)) {
    setStatus(`${prefix}: The browser may have run out of memory while processing this export. Try a desktop browser or select a smaller conversation.`);
  } else {
    setStatus(`${prefix}: ${detail}`);
  }
}

async function loadZipFile(file) {
  resetLoadedExport();
  if (!file) {
    elements.zipName.textContent = "No ZIP selected";
    setStatus("Select a Grok export ZIP before starting extraction.");
    return;
  }
  elements.zipName.textContent = file.name;
  setControlsDisabled(true);
  setProgress(0);
  setStatus("Reading Grok export ZIP...");
  try {
    await yieldToBrowser();
    const archive = await ZipArchive.open(file);
    const { backendEntry, assetDiscovery } = discoverGrokExport(archive);

    setStatus("Reading prod-grok-backend.json...");
    const text = await archive.readText(backendEntry);
    setStatus("Parsing Grok export...");
    await yieldToBrowser();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("prod-grok-backend.json could not be parsed.");
    }
    if (!Array.isArray(data?.conversations)) throw new Error("prod-grok-backend.json does not contain a conversations array.");

    state.inputFile = file;
    state.archive = archive;
    state.backendEntry = backendEntry;
    state.assetRoot = assetDiscovery.root;
    state.conversations = data.conversations;
    state.needsAssets = state.conversations.some(conversationHasAttachments);
    populateConversationTitles();
    elements.assetStatus.hidden = false;
    if (assetDiscovery.root) {
      elements.assetStatus.textContent = "Asset server found in the ZIP. Local attachments will be included when HTML is selected.";
    } else if (assetDiscovery.ambiguous) {
      elements.assetStatus.textContent = "Multiple asset-server locations were found. Attachments will use missing-file placeholders for safety.";
    } else {
      elements.assetStatus.textContent = state.needsAssets
        ? "Asset server not found. Extraction can continue; unavailable attachments will use placeholders in HTML."
        : "No local attachment files are required by the loaded conversations.";
    }
    setStatus(`Loaded ${state.conversations.length.toLocaleString()} conversation(s).`);
  } catch (error) {
    state.archive = null;
    state.conversations = [];
    displayError("Failed to load export", error);
  } finally {
    setControlsDisabled(false);
    refreshOutputControls();
  }
}

function selectedConversations() {
  const selected = elements.conversationSelect.value;
  if (selected === "__all__") return state.conversations;
  const titleFilter = selected.toLowerCase();
  return state.conversations.filter((conversation) => {
    const title = conversation?.conversation?.title || "Untitled";
    return title.toLowerCase() === titleFilter;
  });
}

async function startExtraction() {
  if (state.running) return;
  if (!state.archive || !state.conversations.length) {
    setStatus("Select a Grok export ZIP before starting extraction.");
    return;
  }
  const outputFormats = selectedOutputFormats();
  if (!outputFormats.length) {
    refreshOutputControls();
    setStatus("Select at least one output format.");
    return;
  }

  state.running = true;
  resetGeneratedOutput();
  setControlsDisabled(true);
  setProgress(0);
  try {
    const outputBaseName = localDatedOutputName(new Date());
    const outputZip = new ZipWriter();
    const conversations = selectedConversations();
    let exportedCount = 0;

    for (let index = 0; index < conversations.length; index += 1) {
      const progress = conversations.length ? ((index + 1) / conversations.length) * 90 : 90;
      setProgress(progress);
      setStatus(`Processing... ${Math.trunc(progress)}% (${index + 1}/${conversations.length})`);
      await yieldToBrowser();
      if (await exportConversationToZip(
        conversations[index],
        outputZip,
        state.archive,
        state.assetRoot,
        FORMAT_OPTIONS[elements.formatSelect.value] ? elements.formatSelect.value : "iso",
        { rootPath: outputBaseName, outputFormats, yieldEvery: async () => yieldToBrowser() },
      )) exportedCount += 1;
    }
    if (!exportedCount) throw new Error("No conversation records were available for the selected conversation.");

    setProgress(92);
    setStatus("Creating output ZIP...");
    await yieldToBrowser();
    state.outputBlob = await outputZip.generateBlob();
    state.outputFilename = `${outputBaseName}.zip`;
    outputZip.clear();
    elements.saveButton.textContent = `Save ${state.outputFilename}`;
    elements.saveButton.hidden = false;
    elements.saveButton.disabled = false;
    setProgress(100);
    setStatus(`Completed. Exported ${exportedCount} conversation(s). Save ${state.outputFilename}.`);
  } catch (error) {
    resetGeneratedOutput();
    displayError("Extraction or ZIP generation failed", error);
  } finally {
    state.running = false;
    setControlsDisabled(false);
  }
}

function saveOutputZip() {
  if (!state.outputBlob || !state.outputFilename) {
    setStatus("Create an output ZIP before saving.");
    return;
  }
  try {
    const url = URL.createObjectURL(state.outputBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = state.outputFilename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    setStatus(`Save started for ${state.outputFilename}.`);
  } catch (error) {
    displayError("Failed to save output ZIP", error);
  }
}

elements.zipInput.addEventListener("click", () => { elements.zipInput.value = ""; });
elements.zipInput.addEventListener("change", () => loadZipFile(elements.zipInput.files?.[0] || null));
elements.runButton.addEventListener("click", startExtraction);
elements.saveButton.addEventListener("click", saveOutputZip);
elements.formatSelect.addEventListener("change", resetGeneratedOutput);
elements.conversationSelect.addEventListener("change", resetGeneratedOutput);
for (const input of elements.outputInputs) {
  input.addEventListener("change", () => {
    resetGeneratedOutput();
    refreshOutputControls();
  });
}
