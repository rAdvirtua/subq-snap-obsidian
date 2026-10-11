# Research & Ideation Engine for Obsidian

> **Supercharge Obsidian with Subquadratic Snap's 384K-token Decision Core & Google Gemini Flash.**  
> Triage 200,000+ tokens of unstructured research notes in under 2 seconds, pinpoint exact evidence, and generate verified atomic notes with zero hallucination.

Designed with an ultra-minimalist dark aesthetic inspired by Neuralink and Apple, featuring native integration with Logan Yang's Copilot Chat plugin.

---

## Key Features

- **384K-Token Context in a Single Call**: Evaluates entire research vaults (tested up to 208K+ tokens across 70+ papers) without chunking, embedding fragmentation, or retrieval vector loss.
- **Sub-2-Second Whole-Vault Triage**: Evaluates ~100K–200K tokens at throughputs exceeding 100,000 tokens/second for immediate decision intelligence.
- **Multimodal Diagram & Whiteboard Ingestion**: Pass whiteboard sketches, architecture flowcharts, and handwritten notes alongside hundreds of thousands of text tokens in the same request.
- **Cents-per-Decision Economics**: Built on Subquadratic System One (`subq-snap-preview`) at \$0.09 per million input tokens with free output tokens. A complete whole-vault triage costs $\approx \$0.01$.
- **Dual-Mode Accommodating Workflow**:
  - **Mode A: Analyze Existing Vault**: Evaluates 200K+ tokens, pinpoints exact sections, synthesizes atomic notes, and runs closed-loop verification.
  - **Mode B: Start from Scratch (Research Blueprint)**: When starting with an empty vault, Snap structures the research taxonomy and literature search space, and Gemini drafts an ArXiv/SSRN collection roadmap to seed the vault or feed to Copilot.
- **Copilot Chat Integration**: One-click bridge to Logan Yang's Copilot plugin for interactive dialogue over verified notes.

---

## Project Structure

```
obsidian-snap-engine/
├── src/
│   ├── main.ts            # Plugin entrypoint, ribbon icon & commands
│   ├── engineModal.ts     # Neuralink/iPhone modal UI & dual-mode pipelines
│   ├── snap.ts            # SubQ Snap System One API client (Triage, Pinpoint, Verify)
│   ├── writer.ts          # Gemini Flash resilient writer with auto-fallback
│   ├── corpus.ts          # Whole-vault markdown reader & token estimator
│   ├── excerpt.ts         # Heading parser & section extractor
│   ├── verify.ts          # Closed-loop faithfulness & coverage validator
│   ├── copilot.ts         # Native Logan Yang Copilot plugin bridge
│   ├── settings.ts        # Obsidian Settings tab
│   ├── templates.ts       # Structured note templates
│   └── types.ts           # TypeScript interfaces & typed contracts
├── styles.css             # Pitch-black glass, capsule pills & SF typography
├── manifest.json          # Obsidian plugin metadata
├── esbuild.config.mjs     # Build pipeline
└── package.json           # Dependencies
```

---

## Installation & Setup

### 1. Development Build
```bash
git clone https://github.com/your-username/obsidian-snap-engine.git
cd obsidian-snap-engine
npm install
npm run build
```

### 2. Install into Obsidian
Copy `main.js`, `styles.css`, and `manifest.json` into your Obsidian vault:
`<YourVault>/.obsidian/plugins/obsidian-snap-engine/`

### 3. Configure API Keys
1. Open Obsidian **Settings** → **Community Plugins** → Enable **Research & Ideation Engine**.
2. Go to **Research & Ideation Engine** in the sidebar settings:
   - **SubQ API Key**: Your key from [Subquadratic](https://api.subq.ai)
   - **Gemini API Key**: Your Google Gemini API key
   - **Gemini Model**: `gemini-3.8-flash` (or `gemini-2.5-flash` / `gemini-3.5-flash`)

Alternatively, set persistent environment variables:
`SUBQ_API_KEY` and `GEMINI_API_KEY`.

---

## Publishing to the Official Obsidian Community Directory

To release this plugin to the public Obsidian Community Store:

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial release of Research & Ideation Engine v1.0.0"
   git remote add origin https://github.com/<your-username>/obsidian-snap-engine.git
   git push -u origin main
   ```

2. **Create a GitHub Release**:
   - Create a release tag matching the version in `manifest.json` (e.g. `1.0.0`).
   - Attach these 3 files as assets to the release:
     - `manifest.json`
     - `main.js`
     - `styles.css`

3. **Submit a Pull Request to Obsidian Releases**:
   - Fork [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases).
   - In `community-plugins.json`, add your entry in alphabetical order:
     ```json
     {
       "id": "obsidian-snap-engine",
       "name": "Research & Ideation Engine",
       "author": "Anura",
       "description": "SubQ Snap 384K decision core for whole-vault evidence triage, section pinpointing, and verifiable note synthesis.",
       "repo": "your-username/obsidian-snap-engine"
     }
     ```
   - Open a Pull Request. The Obsidian team will review and approve.

---

## License
MIT License.
