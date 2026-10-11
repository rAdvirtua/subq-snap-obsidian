# Obsidian Research & Ideation Engine — Demo Guide & Submission Pack (v2)

## 1. Verified Benchmark Performance

In our live integration tests across the demo vault (**25 research files, 467,500 characters, ~116,875 tokens**):

| Step | Engine | Payload / Task | Measured Latency | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Call 1: Triage** | **SubQ Snap** | **116,875 tokens** (full vault) | **2.77s** | • 97.2% Idea Validity<br>• Selected: `NASA_Turbofan_C_MAPSS_Benchmark_Report.md` (63.1%)<br>• Selected: `action_plan` template (81.1%) |
| **Call 2: Pinpoint** | **SubQ Snap** | Selected doc headings | **1.19s** | • Pinpointed: `§ 5. Automated Triage and Work Order Generation` (90.5%) |
| **Call 3: Writer** | **Gemini 3.8 Flash** | ~1k token excerpt | ~6–14s | Generated structured note with YAML frontmatter + `[[backlinks]]` |
| **Call 4: Verify** | **SubQ Snap** | Note vs original excerpt | **0.86s** | Closed-loop verification of hallucination & completeness |
| **Total Snap Time** | **SubQ Snap** | **3 decisions across 116k tokens** | **4.81s** | Complete triage-to-verification loop |

---

## 2. Key Features & Workflow Integrations

1. **Dual Interface**:
   - **Interactive Modal**: Press `Ctrl + P` -> `Research & Ideation Engine: Analyze Vault (Modal)` or click the Brain icon.
   - **Dedicated Sidebar View**: Press `Ctrl + P` -> `Research & Ideation Engine: Open in Sidebar` to pin the SubQ Snap Engine into the right sidebar next to Copilot!
2. **Deep Copilot Chat Integration**:
   - One-click **"💬 Send to Copilot Chat"** button directly connects SubQ Snap's output into Logan Yang's Copilot plugin.
   - Automatically opens Copilot Chat, links the verified note as context, and generates a grounded query ready to chat with the agent!
3. **SubQ Probability Matrix Visualizer**:
   - Tab 2 inside the engine surfaces the inner decision probabilities returned by SubQ Snap.
   - Displays animated percentage bars for top candidate documents (e.g. `63.1%`, `24.2%`) and note templates.
   - Visualizes **99.1% Context Reduction** (from 116k+ tokens down to a ~1.1k excerpt) and processing speed (**~48,000 tokens/sec**).
4. **Resilient Multimodal Vision & Writer**:
   - Accepts architecture diagrams & sketches (`PNG/JPEG/WebP`).
   - Exponential backoff retry loop and automated model fallbacks for Google Gemini (`3.8-flash` -> `2.5-flash` -> `3.5-flash`).

---

## 3. How to Run the Demo in Obsidian

1. **Open Obsidian**:
   - Open the **AIR** vault (`C:\Users\anura\Downloads\ugh\AIR`).
   - Press `Ctrl + R` to reload the updated plugin bundle.
2. **Launch the Engine**:
   - Click the **Brain icon** in the left ribbon bar, or open the Command Palette (`Ctrl + P`):
     - `Research & Ideation Engine: Analyze Vault (Modal)` OR
     - `Research & Ideation Engine: Open in Sidebar`
3. **Run the Analysis**:
   - **Enter an Idea**:
     > *"I want to build an automated closed-loop triage agent that reads streaming turbofan sensor telemetry from 21 channels and issues maintenance work orders when degradation exceeds safe limits, with no manual steps."*
   - *(Optional)* Attach `pipeline_architecture_sketch.png`.
   - Click **⚡ Analyze Vault with SubQ Snap**.
4. **Explore the Results**:
   - **Tab 1 (Synthesis & Note)**:
     - Review the 4 Decision Cards: Validity (97%), Key Source, Template, and Verification.
     - Inspect the extracted excerpt and the generated note.
     - Click **📝 Create Note in Vault** to save it.
     - Click **💬 Send to Copilot Chat** to immediately open Copilot with the verified note attached!
   - **Tab 2 (Snap Probability Matrix)**:
     - Show the live candidate document distribution bars and the 99.1% context reduction metric on video!
