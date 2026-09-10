# Grok Log Extraction Tool (Browser Edition)

Convert conversations from a Grok data export into readable HTML, JSON, and TXT files.

The tool runs entirely in Chrome or Edge. No application installation is required, and your Grok data is not uploaded to a server.

---

# What This Tool Exports

You can select any combination of these output formats:

- **HTML** — selected by default
- **JSON**
- **TXT**

For example, you can export:

- HTML only
- JSON only
- TXT only
- HTML and JSON
- HTML and TXT
- JSON and TXT
- HTML, JSON, and TXT

Only the selected format folders are created or updated.

HTML output includes the visual conversation layout, monthly pages, a monthly index, Sources, and locally available attachments. JSON and TXT remain conversation-focused and do not include expanded Sources, tool traces, or attachment metadata.

---

# Browser Requirements

Use a current desktop version of:

- Google Chrome
- Microsoft Edge

Open the tool from its GitHub Pages HTTPS address.

The browser will ask for permission to read and write the selected folder. Write permission is required because the tool creates an `extracted_logs` folder inside your Grok export folder.

This release supports Chrome and Edge. Other browsers are not supported.

---

# 1. Download Your Grok Data

Download your Grok data from:

https://accounts.x.ai/data

Unzip the downloaded archive before using the tool.

Inside the extracted archive, locate the folder that directly contains:

```text
prod-grok-backend.json
```

The same folder will normally contain:

```text
prod-mc-asset-server/
```

A typical path looks like this:

```text
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/
└── ttl/
    └── 30d/
        └── export_data/
            └── xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/
                ├── prod-grok-backend.json
                ├── prod-mc-asset-server/
                ├── prod-mc-auth-mgmt-api.json
                └── prod-mc-billing.json
```

The UUID-like folder names are automatically generated and will be different for every user.

---

# 2. Select the Correct Folder

1. Open the Grok Log Extraction Tool website in Chrome or Edge.
2. Click **Select export folder**.
3. Select the UUID-like folder that directly contains `prod-grok-backend.json`.
4. Allow read and write access when the browser asks for permission.

Select this folder:

```text
export_data/
└── xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/  ← Select this folder
    ├── prod-grok-backend.json
    └── prod-mc-asset-server/
```

Do not initially select:

- The `export_data` parent folder
- The `ttl` folder
- The `30d` folder
- The `prod-mc-asset-server` folder itself
- The `prod-grok-backend.json` file by itself

The selected folder must directly contain `prod-grok-backend.json`.

## Asset Folder Detection

When `prod-mc-asset-server` is beside `prod-grok-backend.json`, it is detected automatically.

If it cannot be detected and the Grok log contains attachment references, the page displays **Asset folder not found**. In that case, click **Select asset folder** and select either:

- The `prod-mc-asset-server` folder, or
- A folder that directly contains `prod-mc-asset-server`

Extraction can continue without the asset folder, but missing attachments will be shown as placeholders in HTML output.

---

# 3. Choose the Extraction Settings

## Date and Time Format

Select one of the following:

- `YYYY-MM-DD (ISO / Standard)`
- `MM/DD/YYYY (US Format)`
- `DD/MM/YYYY (EU Format)`

## Conversation

Select the conversation to export:

- **ALL Conversations** exports every conversation.
- Selecting one title exports only conversations with that title.

## Output Formats

Select at least one output format:

- **HTML** creates readable chat pages and copies available attachments.
- **JSON** creates simplified conversation JSON files.
- **TXT** creates plain-text conversation files.

HTML is selected by default. Enable JSON or TXT when you also need those formats, or disable HTML when you want JSON/TXT only.

---

# 4. Start Extraction

1. Click **START EXTRACTION**.
2. Keep the browser tab open.
3. Wait until the status reports that extraction has completed.

Large exports can require several minutes.

During processing:

- Reading a large `prod-grok-backend.json` file may briefly make the page appear unresponsive.
- The progress bar may pause while a large conversation is processed.
- Copying images, videos, PDFs, and other attachments can take additional time.

Do not close the page or revoke folder permission while extraction is running.

---

# Output Folder

The tool creates `extracted_logs` in the same folder as `prod-grok-backend.json`.

When HTML, JSON, and TXT are all selected, the result looks like this:

```text
export_data/
└── xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/
    ├── prod-grok-backend.json
    ├── prod-mc-asset-server/
    └── extracted_logs/
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
            ├── html/
            ├── json/
            └── txt/
```

If only JSON and TXT are selected, only those folders are created or updated:

```text
extracted_logs/
└── Conversation_A/
    ├── json/
    └── txt/
```

If output from an older extraction already exists, unselected old folders are not automatically deleted. Selected output files with the same names are overwritten.

---

# HTML Output

HTML output contains:

- A full conversation page
- Monthly conversation pages
- A monthly index
- Human messages aligned to the right
- Assistant messages aligned to the left
- Chronological date separators and timestamps
- Collapsible Sources for supported assistant responses
- Images and other locally available attachments
- Missing-attachment and missing-generated-image placeholders

Open this file first:

```text
extracted_logs/Conversation_A/html/index.html
```

Select **Full Log** to open the complete conversation, or select a month from the index.

---

# Attachments and Media

When HTML output is selected, the tool reads attachment IDs from each response and looks for the corresponding local file in `prod-mc-asset-server`.

Resolved files are copied into:

```text
extracted_logs/Conversation_A/html/Conversation_A_assets/
```

The asset ID is preserved in the copied filename. The extension is detected from the file contents because Grok asset files are normally stored without an extension.

Media and files you sent to Grok can then be accessed from the related message in the HTML conversation.

Depending on the file type:

- Images are displayed directly in the conversation.
- Video files are displayed with video controls.
- Audio files are displayed with audio controls.
- PDFs are displayed as file links.
- Text and source-code files can include a short preview and a file link.
- Unknown file types are preserved as generic file links.

Supported detection includes PNG, JPEG, WebP, GIF, BMP, TIFF, SVG, PDF, MP4, MOV, WebM, MKV, AVI, WAV, MP3, OGG, FLAC, M4A, HTML, XML, JSON, Markdown, Python, JavaScript, ZIP, 7z, RAR, text, and unknown binary files.

If an attachment ID exists but its local `content` file is not included in the export, the HTML page displays:

```text
[Attachment not included in Grok export]
```

The asset ID remains visible for investigation.

## Grok-Generated and Edited Images

Grok-generated and edited image cards are handled separately from files that you attached to a message.

- HTML displays a **Generated Image** or **Edited Image** link when the card contains a usable image URL.
- The link opens the image on `assets.grok.com` in a new tab.
- External images are not automatically downloaded or embedded with an `<img>` element.
- Long internal paths, user IDs, and image UUIDs are not displayed as visible link text.
- If a corresponding local asset happens to exist in the export, the normal local attachment handling can still make it available.

Legacy generated-image references without a usable card URL continue to use the existing local-asset or missing-asset behavior.

Attachments are resolved and copied only when HTML output is selected. JSON-only and TXT-only extraction does not copy asset files.

---

# JSON Output

JSON output keeps the established simplified conversation structure.

Each message contains:

- `sender` through its `human` or `assistant` record key
- `message`
- `time`

Assistant messages that contain Grok-generated or edited image cards also include a structured `image_renders` array. It can contain the image kind, UUID, external URL, prompt, resolution, progress, sequence, and an edited image's source image ID when available. Raw `<grok:render>` markup is removed from `message`.

Full-conversation and monthly JSON files are created.

Sources, normal attachment metadata, backend tool traces, and raw response metadata are not expanded into simplified JSON output.

---

# TXT Output

TXT output contains each message followed by its timestamp.

An empty line is inserted between individual messages. Full-conversation and monthly TXT files are created.

Generated and edited image cards are represented as a short marker followed by the URL when available:

```text
[Generated Image]
https://assets.grok.com/...
```

Raw `<grok:render>` markup and image prompts are not written to TXT.

Sources, attachment metadata, and backend tool traces are not expanded into TXT output.

---

# Conversation Ordering and Branches

- Each Grok response is processed as an individual node.
- Human and assistant sender names are handled case-insensitively.
- Responses are exported in ascending `create_time` order.
- The original response index is used when timestamps are identical.
- Parent, child, branch, and leaf relationships are retained during processing.
- Human and assistant responses are paired only when they are adjacent chronologically and have a valid parent-child relationship.
- Unpaired human and assistant responses are preserved.
- Empty audio assistant responses are preserved as empty speech bubbles; unavailable transcripts are not fabricated.

---

# Sources

Supported assistant responses can display a collapsed **Sources** section in HTML.

Sources are collected in this priority order:

1. Cited web results
2. External pages opened through `OpenPage`
3. Web search results and supported external search references

Duplicate URLs are removed where possible.

The HTML output does not expose search queries, thinking traces, Bash, ReadFile, EditFile, local MCP operations, or raw backend metadata.

Sources are not expanded into JSON or TXT output.

---

# Date, Time, and Time Zone

Unix timestamps and timezone-aware timestamps are converted using the local time zone configured on the computer running the browser.

The date/time format setting changes only how dates are displayed. It does not select a different time zone.

Timezone-free timestamp strings are interpreted as local date and time values.

---

# Privacy

All Grok export processing is performed locally in your browser.

The tool does not:

- Upload conversations or attachments
- Send analytics or telemetry
- Contact external APIs during extraction
- Download generated images from external paths
- Send prompts, Sources, search contents, or metadata over the Internet

GitHub Pages serves the application files only. The selected Grok export remains on your computer.

---

# Troubleshooting

## `prod-grok-backend.json` Was Not Found

Select the folder that directly contains `prod-grok-backend.json`. Do not select one of its parent folders.

## The Browser Cannot Write `extracted_logs`

- Use a current desktop version of Chrome or Edge.
- Open the tool from its GitHub Pages HTTPS address.
- Allow read and write access when prompted.
- Confirm that the selected folder is not read-only.

## Attachments Are Missing

- Confirm that `prod-mc-asset-server` is beside `prod-grok-backend.json`.
- If the page displays **Asset folder not found**, select the asset folder manually.
- Some referenced assets, especially generated images, may not be included in the Grok export.

## Extraction Appears to Stop

Large conversations and media files can take time to process. Keep the page open and wait for the completion status.

---

# Deploying to GitHub Pages

This browser edition is a dependency-free static site. No build command or package installation is required.

1. Place the browser files in the repository's `docs/` folder.
2. Commit and push the files to the target branch.
3. Open the repository's **Settings** page on GitHub.
4. Select **Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**.
6. Select the target branch and the `/docs` folder.
7. Save the settings and wait for the GitHub Pages address to become available.

---

# Disclaimer

Use this software at your own risk.

The author assumes no responsibility for any loss, damage, incomplete exports, or data corruption resulting from the use of this software.
