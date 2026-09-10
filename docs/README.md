# Grok Log Extraction Tool (Browser Edition)

Extract conversations from an SpaceXAI Grok export ZIP and convert them into readable HTML, JSON, and TXT files.

The ZIP does not need to be unzipped. All parsing, attachment extraction, and output generation run locally in your browser.

---

# Quick Start

1. Download your Grok export ZIP from <https://accounts.x.ai/data>.
2. Open the Grok Log Extraction Tool website.
3. Click **Select Grok export ZIP** and select the downloaded ZIP file.
4. Select the date format, conversation, and output formats.
5. Click **START EXTRACTION**.
6. When processing finishes, click **Save extracted_grok_logs_YYYYMMDD.zip**.

Do not unzip the SpaceXAI export before selecting it.

---

# Supported Browsers

Use a current version of a browser with standard file selection, Blob, streams, and JavaScript module support.

The intended browser targets are:

- Chrome on desktop
- Edge on desktop
- Brave on desktop
- Safari on desktop
- Safari on iPhone and iPad
- Chrome on iPhone and iPad

Browser support does not guarantee that every device can process every export size. Large Grok exports can exceed the memory available to a mobile browser, especially on iPhone and iPad.

---

# Select the Grok Export ZIP

Select the original ZIP downloaded from SpaceXAI.

The tool recursively searches the ZIP and automatically locates:

```text
prod-grok-backend.json
prod-mc-asset-server/
```

The ZIP's UUID folder names and nesting depth do not need to match a fixed layout.

Exactly one `prod-grok-backend.json` must be present. If none is found, extraction stops with an error. If multiple backend JSON files are found, the tool does not choose one automatically and stops with an ambiguity error.

When `prod-mc-asset-server` is found, it is connected to the existing attachment resolver automatically. If no asset server is found, conversation extraction can continue and unavailable attachments use placeholders in HTML.

---

# Extraction Settings

## Date and Time Format

Select one of the following display formats:

- `YYYY-MM-DD (ISO / Standard)`
- `MM/DD/YYYY (US Format)`
- `DD/MM/YYYY (EU Format)`

Timestamps are converted using the local time zone configured on the device running the browser. The selected format changes presentation only; it does not change the time zone.

## Conversation

- **ALL Conversations** exports every conversation.
- Selecting a title exports conversations with that title.

## Output Formats

Select any non-empty combination of:

- **HTML** — selected by default
- **JSON**
- **TXT**

The following combinations are supported:

- HTML only
- JSON only
- TXT only
- HTML and JSON
- HTML and TXT
- JSON and TXT
- HTML, JSON, and TXT

Extraction cannot start when no output format is selected. Only selected format folders are included in the output ZIP.

---

# Output ZIP

The output filename uses the extraction date from the browser device:

```text
extracted_grok_logs_YYYYMMDD.zip
```

For example, an extraction run on September 11, 2026 produces:

```text
extracted_grok_logs_20260911.zip
```

The ZIP contains a root folder with the same dated name:

```text
extracted_grok_logs_20260911.zip
└── extracted_grok_logs_20260911/
    ├── Conversation_A/
    │   ├── html/
    │   │   ├── Conversation_A.html
    │   │   ├── YYYY-MM.html
    │   │   ├── index.html
    │   │   └── Conversation_A_assets/
    │   ├── json/
    │   │   ├── Conversation_A.json
    │   │   └── YYYY-MM.json
    │   └── txt/
    │       ├── Conversation_A.txt
    │       └── YYYY-MM.txt
    └── Conversation_B/
        └── ...
```

The `_assets` folder is included only when HTML is selected and at least one local attachment can be resolved.

On iPhone and iPad, saving may open a browser download view or the system file-handling interface. The exact destination is controlled by the browser and operating system.

---

# HTML Output

HTML output includes:

- A full conversation page
- Monthly conversation pages
- A monthly index
- Human messages aligned to the right
- Assistant messages aligned to the left
- Chronological date separators and timestamps
- Empty audio assistant messages as empty speech bubbles
- Collapsible Sources for supported assistant responses
- Local attachments and media when available
- Grok-generated and edited image links
- Missing-attachment placeholders

After extracting the output ZIP, open the conversation's `html/index.html`. Select **Full Log** for the complete conversation or select a month.

## iOS Notes

Extraction has been confirmed to work on iOS.

However, there are some limitations when viewing the exported HTML on iPhone or iPad:

- Local media included in the exported HTML may not be viewable through the iOS Files app's Quick Look preview.
- Links to Grok-generated or edited images may not open properly on iOS.

If you encounter these issues, viewing the extracted HTML on a desktop browser is recommended.

---

# Attachments and Media

Attachment IDs are read from each response. When HTML is selected, the tool looks for the corresponding file inside the input ZIP at a detected `prod-mc-asset-server` location.

Only referenced assets are decompressed. The tool does not unpack every file in the input ZIP.

Resolved files are placed in:

```text
Conversation_Name/html/Conversation_Name_assets/
```

The asset UUID remains in the copied filename. The extension is detected from the file contents because Grok asset files normally use the extensionless name `content`.

Depending on the detected type:

- Images are displayed in the conversation.
- Video files use browser video controls.
- Audio files use browser audio controls.
- PDFs use file links.
- Text and source-code files can include a short preview and a file link.
- Unknown types are preserved as generic file links.

If an attachment is referenced but unavailable, HTML displays:

```text
[Attachment not included in Grok export]
```

JSON-only and TXT-only extraction does not read or copy attachment binaries into the output ZIP.

---

# Grok-Generated and Edited Images

The browser edition recognizes:

- `render_generated_image`
- `render_edited_image`

Raw `<grok:render>` blocks are removed from assistant message text.

Image cards from `card_attachments_json` are normalized by image UUID. When intermediate and completed entries share an image UUID, the completed entry with `progress=100` is preferred.

Relative `users/...` image paths are converted to `https://assets.grok.com/...` links.

Output behavior:

- HTML displays **Generated Image** or **Edited Image** as a clickable external link.
- JSON stores structured data in an `image_renders` array.
- TXT displays `[Generated Image]` or `[Edited Image]`, followed by the URL when available.

External Grok image URLs are not downloaded and are not embedded automatically with `<img>`. A network request occurs only if the user chooses to open a generated or edited image link from the exported HTML.

Normal user file attachments continue to use the local asset resolver described above.

---

# JSON Output

JSON output keeps the established conversation-focused structure:

```json
{
  "assistant": {
    "message": "Example response",
    "time": "2026-09-11 12:34:56"
  }
}
```

Assistant image cards add a structured `image_renders` array containing available fields such as:

- `kind`
- `image_uuid`
- `url`
- `prompt`
- `resolution`
- `progress`
- `seq`
- `source_image_id` for edited images when available

Sources, normal attachment metadata, tool traces, and raw backend metadata are not expanded into simplified JSON output.

---

# TXT Output

TXT output contains each message followed by its timestamp, with an empty line between messages.

Generated and edited image cards are represented briefly:

```text
[Generated Image]
https://assets.grok.com/...
```

Image prompts and raw `<grok:render>` markup are not written to TXT. Sources, attachment metadata, and backend tool traces are not expanded into TXT.

---

# Conversation Ordering and Branches

- Every response is processed as an individual node.
- Human and assistant sender names are handled case-insensitively.
- Responses are exported in ascending `create_time` order.
- The original response index resolves identical timestamps.
- Parent, child, branch, and leaf relationships remain available internally.
- Human and assistant responses are paired only when chronologically adjacent and connected by the correct parent-child relationship.
- Unpaired human and assistant responses are preserved.
- Missing audio transcripts are not fabricated.

---

# Sources

Supported assistant responses can display a collapsed **Sources** section in HTML.

Sources are collected in this priority order:

1. Cited web results
2. External pages opened through `OpenPage`
3. Web search results and supported external references

Duplicate URLs are removed where possible. Search queries, thinking traces, Bash, ReadFile, EditFile, local MCP operations, and raw backend metadata are not exposed in HTML.

Source links contact their external website only when the user clicks them.

---

# Privacy

Input and output processing occurs locally in the browser.

During extraction, the tool does not:

- Upload the Grok export ZIP
- Upload conversations, attachments, prompts, or metadata
- Send analytics or telemetry
- Contact external APIs
- Download Grok-generated or edited images
- Open Sources automatically

GitHub Pages serves only the application files. The selected ZIP remains on the user's device.

---

# Memory and ZIP Limitations

Large exports require significant browser memory for the backend JSON, parsed conversation model, generated logs, and output ZIP.

The implementation reduces unnecessary work by:

- Reading the ZIP central directory before accessing file contents
- Decompressing only `prod-grok-backend.json` and referenced assets
- Avoiding attachment extraction for JSON-only and TXT-only output
- Reusing resolved attachment data during a conversation export
- Releasing temporary output-writer references after ZIP generation

Even with these measures, a large export may exceed the limits of an iPhone, iPad, or memory-constrained browser tab. A desktop browser is recommended for very large exports.

Current ZIP limitations:

- Standard ZIP archives using stored or DEFLATE-compressed entries are supported.
- ZIP64 and multi-part archives are not supported.
- Encrypted ZIP entries are not supported.
- The generated output ZIP uses stored entries, so it may be larger than a compressed archive.
- The browser must hold references needed to create the final downloadable Blob.

---

# Error Messages

The interface reports errors for:

- No ZIP selected
- Unreadable or damaged ZIP data
- Missing `prod-grok-backend.json`
- Multiple `prod-grok-backend.json` files
- Invalid backend JSON
- Unsupported ZIP features or compression methods
- Output ZIP generation failure
- Possible browser memory exhaustion

If a large export fails on mobile, retry on a desktop browser or export one conversation at a time.

---

# Included ZIP Dependency

The repository includes `fflate` 0.8.2 under its MIT license.

It is stored locally under `docs/vendor/` and is never loaded from a CDN. It provides a DEFLATE fallback when the browser's native decompression stream cannot read a standard compressed ZIP entry.

---

# Deploying to GitHub Pages

This browser edition is a dependency-free-at-runtime static site. No build command or package installation is required for deployment.

1. Place the browser files in the repository's `docs/` folder.
2. Commit and push the files to the target branch.
3. Open the repository's **Settings** page on GitHub.
4. Select **Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**.
6. Select the target branch and the `/docs` folder.
7. Save the settings and wait for the GitHub Pages address.

---

# Disclaimer

Use this software at your own risk.

The author assumes no responsibility for loss, damage, incomplete exports, browser crashes, or data corruption resulting from the use of this software.
