# Grok Log Extraction Tool (Browser Edition)

Extract conversations from your exported Grok data and convert them into easy-to-read HTML, JSON, and TXT files.

No installation or executable download is required. The tool runs as a static website hosted on GitHub Pages and processes the selected Grok export folder locally in your browser.

---

# Browser Requirements

Use a current desktop version of:

- Google Chrome
- Microsoft Edge

The tool uses the File System Access API to read the selected Grok export and create output files inside it. This release supports Chrome and Edge; other browsers are not supported.

Open the tool through its GitHub Pages HTTPS address. Opening `index.html` directly from your computer may prevent browser modules or folder access from working correctly.

---

# Preparation

## 1. Open the Browser Tool

Open the published **Grok Log Extraction Tool** GitHub Pages site in Chrome or Edge.

No application installation is required.

## 2. Download Your Grok Data

Download and unzip your data from:

https://accounts.x.ai/data

After extracting the archive, locate the folder containing:

```text
prod-grok-backend.json
```

The same folder will normally also contain:

```text
prod-mc-asset-server/
```

The folder path will look similar to:

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

# How to Use

1. Open the GitHub Pages site in Chrome or Edge.

2. Click **Select export folder**.

3. Select the folder that directly contains `prod-grok-backend.json`.

4. Allow the browser to read and write files in the selected folder.

5. Select your preferred date/time format.

6. Select one or more output formats.

   - **HTML** is selected by default.
   - **HTML**, **JSON**, and **TXT** can be enabled independently or together.
   - At least one output format must be selected.

7. Select the conversation to export.

   - **ALL Conversations** exports every conversation.
   - Selecting an individual conversation exports only that conversation.

8. Click **START EXTRACTION**.

9. Wait until the status shows that extraction has completed.

If `prod-mc-asset-server` is beside `prod-grok-backend.json`, it is detected automatically. If it cannot be found and the selected conversation contains attachment references, the tool allows you to select the asset folder manually.

---

# Progress

Large conversation histories may require several minutes to process.

During extraction:

- The progress bar may temporarily stop moving while a large conversation is being processed.
- Reading and parsing a large `prod-grok-backend.json` file may briefly make the page appear unresponsive.
- Copying large images, videos, PDFs, or other attachments can increase processing time.
- This is normal. Please wait until the completion status appears.

Do not close the tab or revoke folder access while extraction is in progress.

---

# Output

The tool creates an `extracted_logs` folder beside `prod-grok-backend.json`. A folder is then created for each exported conversation.

Only the selected output-format folders are created. The example below shows the structure when HTML, JSON, and TXT are all selected.

```text
export_data/
├── prod-grok-backend.json
├── prod-mc-asset-server/
└── extracted_logs/
    ├── Conversation_A/
    │   ├── html/
    │   │   ├── Conversation_A.html          # Full conversation
    │   │   ├── YYYY-MM.html                 # Monthly conversation
    │   │   ├── index.html                   # Monthly index
    │   │   └── Conversation_A_assets/       # Resolved attachments
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

Open the following file to browse a conversation by month:

```text
extracted_logs/Conversation_A/html/index.html
```

This index is generated only when HTML output is selected.

Files with the same output name are overwritten when extraction runs again. Unrelated files and obsolete files from older runs are not automatically deleted.

---

# Exported Content

## Conversations and Branches

- Human and assistant responses are normalized as individual response nodes.
- Sender names are handled case-insensitively.
- Responses are displayed in chronological order using `create_time`.
- The original response index is used when timestamps are identical.
- Parent, child, branch, and leaf relationships are retained during processing.
- A human and assistant response are combined into a compatible pair only when they are adjacent chronologically and have a valid parent-child relationship.
- Unpaired human or assistant responses are preserved instead of being discarded.

## Attachments

Attachment IDs are resolved from each response, including:

- `file_attachments`
- `image_edit_uri`
- Generated-image metadata when available

The tool checks `prod-mc-asset-server/<asset-id>/content` and the known underscore-prefixed layout. File types are detected from their contents rather than their filename.

Supported previews and links include:

- Images such as PNG, JPEG, WebP, GIF, BMP, TIFF, and SVG
- Video such as MP4, MOV, WebM, MKV, and AVI
- Audio such as WAV, MP3, OGG, FLAC, and M4A
- PDF files
- HTML, XML, JSON, plain text, Markdown, Python, and JavaScript files
- ZIP, 7z, RAR, and unknown binary files as file links

If an attachment is referenced but not included in the Grok export, the HTML log displays a placeholder and keeps its asset ID.

Generated images are not downloaded from `generated_image_urls`. They are displayed only when a corresponding local asset exists.

Attachments are copied and rendered only when HTML output is selected. Simplified JSON and TXT output remain conversation-focused and do not include attachment metadata.

## Sources

Assistant responses can include a collapsed **Sources** section in HTML output.

Sources are collected in this priority order:

1. `cited_web_search_results`
2. External pages opened through `OpenPage`
3. `web_search_results` and supported external search references

Duplicate URLs are removed where possible. Search queries, thinking traces, internal tool details, and raw backend metadata are not displayed.

Sources and backend metadata are not expanded into TXT or simplified JSON output.

---

# Date, Time, and Time Zone

Date and time are displayed using the selected format.

Unix timestamps and timezone-aware timestamps are converted using the local time zone configured on the computer running the browser. The date/time format option changes only the display format; it does not select a time zone.

Timezone-free timestamp strings are used as provided by the export.

---

# Notes and Limitations

- Conversation titles are automatically sanitized and used as folder names.
- Empty assistant audio responses are preserved as empty speech bubbles; unavailable transcripts are not fabricated.
- Sender or tool nodes that are not identified as human or assistant are retained internally but are not rendered as chat messages.
- Thinking traces and internal tools such as Bash, ReadFile, EditFile, and local MCP operations are not included in HTML Sources.
- Missing generated images, audio transcripts, or assets cannot be reconstructed when their contents are absent from the Grok export.
- Very large exports require substantial browser memory and may take time to parse.

---

# Privacy

All processing is performed locally in your browser.

The tool does not:

- Upload conversation logs or attachments
- Send analytics or telemetry
- Contact external APIs
- Request files referenced by `generated_image_urls`
- Send prompts, search contents, or metadata over the Internet

The GitHub Pages host serves only the application files. After the page loads, the extraction workflow reads and writes only the folder you explicitly select.

---

# Folder Access and Troubleshooting

The browser displays a permission prompt because the tool needs to create `extracted_logs` in the selected folder.

If extraction cannot start:

1. Confirm that you are using a current desktop version of Chrome or Edge.
2. Confirm that the site is opened over HTTPS.
3. Select the folder that directly contains `prod-grok-backend.json`, not one of its parent folders.
4. Allow both read and write access when prompted.
5. Confirm that the selected folder is not read-only.

If attachments appear as missing, confirm that `prod-mc-asset-server` is beside `prod-grok-backend.json`, or select it manually when prompted.

---

# Deploying to GitHub Pages

The browser edition is a dependency-free static site. No build command or package installation is required.

1. Place the contents of this `docs` directory in the repository's `docs/` folder.
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
