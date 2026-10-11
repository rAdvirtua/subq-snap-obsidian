import {
  App,
  Modal,
  Notice,
  TFile,
  MarkdownRenderer,
} from "obsidian";
import {
  SnapEngineSettings,
  EngineResult,
  VerificationResult,
  BlueprintResult,
  BlueprintVerificationResult,
  SnapNoulAnswer,
  SnapChoiceAnswer,
  SnapScoreAnswer
} from "./types";
import { readVault } from "./corpus";
import { snapTriage, snapPinpoint, snapVerify, snapBlueprintTriage, snapBlueprintVerify } from "./snap";
import { parseHeadings, buildHeadingCriteria, extractSection } from "./excerpt";
import { generateNote, generateRoadmapNote } from "./writer";
import { verifyNote } from "./verify";
import { CopilotIntegration } from "./copilot";

export class EngineModal extends Modal {
  private settings: SnapEngineSettings;
  private containerEl_: HTMLElement;
  private activeMode: "select" | "vault" | "scratch" = "vault";

  private userIdea: string = "";
  private imageBase64: string | null = null;
  private imageMimeType: string | null = null;
  private imageFileName: string | null = null;
  private activeTab: "note" | "excerpt" | "breakdown" = "note";

  private lastResult: EngineResult | null = null;
  private lastVerification: VerificationResult | null = null;
  private lastNoteContent: string | null = null;
  private lastCreatedFile: TFile | null = null;

  private lastBlueprint: BlueprintResult | null = null;
  private lastBlueprintVerification: BlueprintVerificationResult | null = null;

  constructor(app: App, settings: SnapEngineSettings) {
    super(app);
    this.settings = Object.assign({}, settings);
    if (!this.settings.subqApiKey && typeof process !== "undefined" && process.env?.SUBQ_API_KEY) {
      this.settings.subqApiKey = process.env.SUBQ_API_KEY;
    }
    if (!this.settings.geminiApiKey && typeof process !== "undefined" && process.env?.GEMINI_API_KEY) {
      this.settings.geminiApiKey = process.env.GEMINI_API_KEY;
    }
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("snap-engine-modal");
    this.containerEl_ = contentEl;

    const fileCount = this.app.vault.getMarkdownFiles().length;
    if (fileCount < 3) {
      this.activeMode = "select";
      this.renderModeSelectionScreen();
    } else {
      this.activeMode = "vault";
      this.renderVaultInputScreen();
    }
  }

  onClose() {
    this.contentEl.empty();
  }

  private renderModeSelectionScreen() {
    const el = this.containerEl_;
    el.empty();

    const header = el.createDiv({ cls: "snap-header" });
    header.createEl("h2", { text: "Research Engine" });
    header.createEl("p", {
      text: "How would you like to begin your research today?",
      cls: "snap-subtitle",
    });

    const fileCount = this.app.vault.getMarkdownFiles().length;
    const cardsContainer = el.createDiv({ cls: "snap-mode-cards" });

    const cardScratch = cardsContainer.createDiv({ cls: "snap-mode-card" });
    cardScratch.createEl("div", { text: "NEW RESEARCH", cls: "snap-mode-tag" });
    cardScratch.createEl("h3", { text: "Start from Scratch" });
    cardScratch.createEl("p", {
      text: "Your vault is empty or you have a new hypothesis. Snap will map the theoretical search space, classify prerequisites, and build an ArXiv/SSRN literature collection roadmap.",
      cls: "snap-mode-desc",
    });
    const btnScratch = cardScratch.createEl("button", {
      text: "Create Research Blueprint",
      cls: "snap-submit-btn snap-mode-btn",
    });
    btnScratch.addEventListener("click", () => {
      this.activeMode = "scratch";
      this.renderScratchInputScreen();
    });

    const cardVault = cardsContainer.createDiv({ cls: "snap-mode-card" });
    const tagText = fileCount > 0 ? `${fileCount} NOTES DETECTED` : "EMPTY VAULT";
    cardVault.createEl("div", { text: tagText, cls: "snap-mode-tag" });
    cardVault.createEl("h3", { text: "Analyze Existing Vault" });
    cardVault.createEl("p", {
      text: "You already have papers, notes, or case studies in this vault. Snap evaluates 200K+ tokens in seconds to pinpoint key evidence and synthesize verified notes.",
      cls: "snap-mode-desc",
    });
    const btnVault = cardVault.createEl("button", {
      text: "Analyze Vault Corpus",
      cls: "snap-submit-btn snap-copilot-btn snap-mode-btn",
    });
    btnVault.addEventListener("click", () => {
      this.activeMode = "vault";
      this.renderVaultInputScreen();
    });
  }

  private renderVaultInputScreen() {
    const el = this.containerEl_;
    el.empty();

    const topBar = el.createDiv({ cls: "snap-top-bar" });
    const files = this.app.vault.getMarkdownFiles();
    
    const segmented = topBar.createDiv({ cls: "snap-segmented-control snap-mode-switcher" });
    segmented.createEl("button", {
      text: `Analyze Vault (${files.length})`,
      cls: "snap-segment-btn active"
    });
    const btnScratchMode = segmented.createEl("button", {
      text: "New Research Blueprint",
      cls: "snap-segment-btn"
    });

    btnScratchMode.addEventListener("click", () => {
      this.activeMode = "scratch";
      this.renderScratchInputScreen();
    });

    const header = el.createDiv({ cls: "snap-header" });
    header.createEl("h2", { text: "Vault Research Engine" });
    header.createEl("p", {
      text: "Deep analysis across your entire vault with SubQ Snap.",
      cls: "snap-subtitle",
    });

    const inputGroup = el.createDiv({ cls: "snap-input-group" });
    inputGroup.createEl("label", { text: "What are you researching?" });
    const textarea = inputGroup.createEl("textarea", {
      cls: "snap-textarea",
      attr: {
        placeholder: "Describe a question, hypothesis, or idea (e.g. How can we use limit order book imbalances to predict price jumps?)...",
        rows: "4"
      },
    });
    textarea.value = this.userIdea;
    textarea.addEventListener("input", () => {
      this.userIdea = textarea.value;
    });

    this.renderAttachmentRow(el);

    const vaultInfo = el.createDiv({ cls: "snap-vault-info" });
    vaultInfo.createEl("span", {
      text: `${files.length} notes · ~${Math.round(files.length * 3000 / 1000)}K tokens`,
      cls: "snap-info-badge",
    });
    vaultInfo.createEl("span", {
      text: "SubQ Snap 384K context",
      cls: "snap-info-badge",
    });
    if (CopilotIntegration.isAvailable(this.app)) {
      vaultInfo.createEl("span", {
        text: "Copilot linked",
        cls: "snap-info-badge snap-badge-accent",
      });
    }

    const btnRow = el.createDiv({ cls: "snap-btn-row" });
    const submitBtn = btnRow.createEl("button", {
      text: "Analyze Vault",
      cls: "snap-submit-btn",
    });
    submitBtn.addEventListener("click", () => {
      if (!this.userIdea.trim()) {
        new Notice("Please describe your idea or question first");
        return;
      }
      if (!this.settings.subqApiKey || !this.settings.geminiApiKey) {
        new Notice("Please add your API keys in Settings → Research & Ideation Engine");
        return;
      }
      this.runVaultPipeline();
    });
  }

  private renderScratchInputScreen() {
    const el = this.containerEl_;
    el.empty();

    const topBar = el.createDiv({ cls: "snap-top-bar" });
    const files = this.app.vault.getMarkdownFiles();
    
    const segmented = topBar.createDiv({ cls: "snap-segmented-control snap-mode-switcher" });
    const btnVaultMode = segmented.createEl("button", {
      text: `Analyze Vault (${files.length})`,
      cls: "snap-segment-btn"
    });
    segmented.createEl("button", {
      text: "New Research Blueprint",
      cls: "snap-segment-btn active"
    });

    btnVaultMode.addEventListener("click", () => {
      this.activeMode = "vault";
      this.renderVaultInputScreen();
    });

    const header = el.createDiv({ cls: "snap-header" });
    header.createEl("h2", { text: "New Research Blueprint" });
    header.createEl("p", {
      text: "Map search space, theoretical prerequisites, and seminal papers for a new vault.",
      cls: "snap-subtitle",
    });

    const inputGroup = el.createDiv({ cls: "snap-input-group" });
    inputGroup.createEl("label", { text: "Describe your hypothesis or strategy concept:" });
    const textarea = inputGroup.createEl("textarea", {
      cls: "snap-textarea",
      attr: {
        placeholder: "e.g. I want to build a statistical arbitrage strategy on cross-sectional equity momentum using high-frequency order book imbalances and reinforcement learning...",
        rows: "4"
      },
    });
    textarea.value = this.userIdea;
    textarea.addEventListener("input", () => {
      this.userIdea = textarea.value;
    });

    this.renderAttachmentRow(el);

    const infoStrip = el.createDiv({ cls: "snap-vault-info" });
    infoStrip.createEl("span", {
      text: "Literature Search Space Mapping",
      cls: "snap-info-badge",
    });
    infoStrip.createEl("span", {
      text: "SubQ Snap 384K Decision Core",
      cls: "snap-info-badge",
    });
    if (CopilotIntegration.isAvailable(this.app)) {
      infoStrip.createEl("span", {
        text: "Copilot Chat Ready",
        cls: "snap-info-badge snap-badge-accent",
      });
    }

    const btnRow = el.createDiv({ cls: "snap-btn-row" });
    const submitBtn = btnRow.createEl("button", {
      text: "Generate Research Roadmap",
      cls: "snap-submit-btn",
    });
    submitBtn.addEventListener("click", () => {
      if (!this.userIdea.trim()) {
        new Notice("Please describe your research concept first");
        return;
      }
      if (!this.settings.subqApiKey || !this.settings.geminiApiKey) {
        new Notice("Please add your API keys in Settings → Research & Ideation Engine");
        return;
      }
      this.runScratchPipeline();
    });
  }

  private renderAttachmentRow(parent: HTMLElement) {
    const imageGroup = parent.createDiv({ cls: "snap-input-group" });
    imageGroup.createEl("label", { text: "Diagram or sketch (optional)" });
    const imageRow = imageGroup.createDiv({ cls: "snap-image-row" });

    const fileLabel = imageRow.createEl("label", { cls: "snap-file-label" });
    const fileLabelText = fileLabel.createSpan({
      cls: "snap-file-label-btn",
      text: this.imageFileName ? this.imageFileName : "Choose Image"
    });
    const fileInput = fileLabel.createEl("input", {
      attr: { type: "file", accept: "image/png,image/jpeg,image/webp" },
      cls: "snap-file-input",
    });

    const imagePreview = imageRow.createDiv({ cls: "snap-image-preview" });
    if (this.imageBase64 && this.imageMimeType) {
      const img = imagePreview.createEl("img", { attr: { src: `data:${this.imageMimeType};base64,${this.imageBase64}` } });
      img.style.maxWidth = "100px";
      img.style.maxHeight = "50px";
      imagePreview.style.display = "block";
    } else {
      imagePreview.style.display = "none";
    }

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        new Notice("Image must be under 4 MiB");
        return;
      }
      const buffer = await file.arrayBuffer();
      this.imageBase64 = this.arrayBufferToBase64(buffer);
      this.imageMimeType = file.type as string;
      this.imageFileName = file.name;
      fileLabelText.textContent = file.name;

      imagePreview.empty();
      const img = imagePreview.createEl("img", { attr: { src: `data:${file.type};base64,${this.imageBase64}` } });
      img.style.maxWidth = "100px";
      img.style.maxHeight = "50px";
      imagePreview.style.display = "block";
    });
  }

  private async runVaultPipeline() {
    const el = this.containerEl_;
    el.empty();

    const header = el.createDiv({ cls: "snap-header" });
    header.createEl("h2", { text: "Analyzing Vault" });
    header.createEl("p", {
      text: "Evaluating full vault corpus against your research query...",
      cls: "snap-subtitle",
    });

    const progress = el.createDiv({ cls: "snap-progress" });
    const steps = [
      { id: "scan", label: "Reading vault notes" },
      { id: "snap1", label: "Finding relevant research" },
      { id: "snap2", label: "Pinpointing key section" },
      { id: "write", label: "Drafting structured note" },
      { id: "verify", label: "Verifying accuracy" },
    ];

    const stepEls: Record<string, { row: HTMLElement; icon: HTMLElement; detail: HTMLElement }> = {};
    for (const step of steps) {
      const row = progress.createDiv({ cls: "snap-step" });
      const left = row.createDiv({ cls: "snap-step-left" });
      const icon = left.createSpan({ cls: "snap-step-icon" });
      left.createSpan({ cls: "snap-step-label", text: step.label });
      const detail = row.createDiv({ cls: "snap-step-detail" });
      stepEls[step.id] = { row, icon, detail };
    }

    const metricsBar = el.createDiv({ cls: "snap-metrics-bar" });
    metricsBar.style.display = "none";

    const updateStep = (id: string, status: "running" | "done" | "error", detailText?: string) => {
      const s = stepEls[id];
      if (!s) return;
      s.row.removeClass("snap-step-running");
      s.row.removeClass("snap-step-done");
      s.row.removeClass("snap-step-error");
      s.detail.empty();

      if (status === "running") {
        s.row.addClass("snap-step-running");
      } else if (status === "done") {
        s.row.addClass("snap-step-done");
      } else {
        s.row.addClass("snap-step-error");
      }

      if (detailText) {
        s.detail.createSpan({ cls: "snap-step-text", text: detailText });
      }
    };

    try {
      updateStep("scan", "running");
      const corpus = await readVault(this.app.vault);
      updateStep("scan", "done", `${corpus.fileCount} notes · ~${Math.round(corpus.estimatedTokens / 1000)}K tokens`);

      updateStep("snap1", "running");
      const triageStart = performance.now();
      const fileNames = Array.from(corpus.manifest.keys());
      const triageResponse = await snapTriage(
        this.settings.subqApiKey,
        corpus.concatenated,
        this.userIdea,
        fileNames,
        this.imageBase64 || undefined,
        this.imageMimeType || undefined
      );
      const triageLatency = performance.now() - triageStart;

      const ideaValid = (triageResponse.answers.idea_valid as SnapNoulAnswer).noul;
      const keyDocAnswer = triageResponse.answers.key_document as SnapChoiceAnswer;
      const templateAnswer = triageResponse.answers.template as SnapChoiceAnswer;

      const shortDocName = keyDocAnswer.choice.split(/[\\/]/).pop() || keyDocAnswer.choice;
      const templateName = templateAnswer.choice.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

      updateStep("snap1", "done", `${shortDocName} · ${(triageLatency / 1000).toFixed(1)}s`);

      updateStep("snap2", "running");

      let chosenDocContent = corpus.manifest.get(keyDocAnswer.choice);
      if (!chosenDocContent) {
        const target = keyDocAnswer.choice.toLowerCase();
        for (const [p, c] of corpus.manifest.entries()) {
          const pLower = p.toLowerCase();
          if (pLower === target || pLower.endsWith(target) || target.endsWith(pLower)) {
            chosenDocContent = c;
            break;
          }
        }
      }
      chosenDocContent = chosenDocContent || "";
      const sections = parseHeadings(chosenDocContent);

      let sectionKey = "full_document";
      let sectionHeading = "Document";
      let excerpt = chosenDocContent.substring(0, 4000);
      let sectionConfidence = 0.8;
      let sectionProbabilities: Record<string, number> = {};

      if (sections.length === 0) {
        updateStep("snap2", "done", "Full Document");
      } else {
        const headingCriteria = buildHeadingCriteria(sections);
        const pinpointStart = performance.now();
        const pinpointResponse = await snapPinpoint(
          this.settings.subqApiKey,
          chosenDocContent,
          keyDocAnswer.choice,
          this.userIdea,
          headingCriteria
        );
        const pinpointLatency = performance.now() - pinpointStart;

        const sectionAnswer = pinpointResponse.answers.key_section as SnapChoiceAnswer;
        sectionKey = sectionAnswer.choice;
        sectionConfidence = sectionAnswer.confidence;
        sectionProbabilities = sectionAnswer.probabilities || {};
        const extracted = extractSection(sections, sectionKey);
        excerpt = extracted.excerpt;
        sectionHeading = extracted.heading;

        updateStep("snap2", "done", `${sectionHeading} · ${(pinpointLatency / 1000).toFixed(1)}s`);
      }

      const citation = `[[${shortDocName}#${sectionHeading}]]`;

      metricsBar.empty();
      metricsBar.style.display = "flex";
      const throughputTokensSec = Math.round(corpus.estimatedTokens / (triageLatency / 1000));
      const estCost = ((corpus.estimatedTokens / 1000000) * 0.09).toFixed(3);
      metricsBar.createEl("span", {
        text: `${corpus.estimatedTokens.toLocaleString()} tokens in ${(triageLatency / 1000).toFixed(1)}s (${throughputTokensSec.toLocaleString()} tok/s) · $${estCost}`,
        cls: "snap-metrics-highlight",
      });

      updateStep("write", "running");
      const writeStart = performance.now();
      let noteContent = "";
      try {
        noteContent = await generateNote(
          this.settings.geminiApiKey,
          this.settings.geminiModel,
          excerpt,
          templateAnswer.choice,
          this.userIdea,
          citation
        );
        const writeLatency = performance.now() - writeStart;
        updateStep("write", "done", `Ready · ${(writeLatency / 1000).toFixed(1)}s`);
      } catch (err: any) {
        updateStep("write", "error", err?.message?.substring(0, 30) || "Error");
        return;
      }

      updateStep("verify", "running");
      const verification = await verifyNote(
        this.settings.subqApiKey,
        excerpt,
        this.userIdea,
        noteContent
      );

      updateStep("verify", "done", `Score ${verification.faithfulness.toFixed(1)}/2.0 · ${(verification.latencyCall3 / 1000).toFixed(1)}s`);

      const engineResult: EngineResult = {
        ideaValid,
        keyDocument: shortDocName,
        keyDocConfidence: keyDocAnswer.confidence,
        keyDocProbabilities: keyDocAnswer.probabilities || {},
        keySection: sectionKey,
        keySectionConfidence: sectionConfidence,
        sectionProbabilities,
        template: templateAnswer.choice,
        templateConfidence: templateAnswer.confidence,
        templateProbabilities: templateAnswer.probabilities || {},
        excerpt,
        citation,
        totalVaultTokens: corpus.estimatedTokens,
        usageCall1: triageResponse.usage,
        usageCall2: { input_tokens: 0, output_tokens: 0 },
        latencyCall1: triageLatency,
        latencyCall2: 0,
      };

      this.lastResult = engineResult;
      this.lastVerification = verification;
      this.lastNoteContent = noteContent;

      this.renderVaultResults(el, engineResult, verification, noteContent);

    } catch (err: any) {
      new Notice(`Engine error: ${err?.message || err}`);
      console.error(err);
    }
  }

  private async runScratchPipeline() {
    const el = this.containerEl_;
    el.empty();

    const header = el.createDiv({ cls: "snap-header" });
    header.createEl("h2", { text: "Mapping Research Blueprint" });
    header.createEl("p", {
      text: "Classifying domain taxonomy, seminal papers, and literature search space...",
      cls: "snap-subtitle",
    });

    const progress = el.createDiv({ cls: "snap-progress" });
    const steps = [
      { id: "classify", label: "SubQ Snap: Classifying research domain & framework" },
      { id: "soundness", label: "SubQ Snap: Evaluating theoretical viability" },
      { id: "writer", label: "Gemini Flash: Drafting literature collection roadmap" },
      { id: "verify", label: "SubQ Snap: Verifying roadmap coverage" },
    ];

    const stepEls: Record<string, { row: HTMLElement; icon: HTMLElement; detail: HTMLElement }> = {};
    for (const step of steps) {
      const row = progress.createDiv({ cls: "snap-step" });
      const left = row.createDiv({ cls: "snap-step-left" });
      const icon = left.createSpan({ cls: "snap-step-icon" });
      left.createSpan({ cls: "snap-step-label", text: step.label });
      const detail = row.createDiv({ cls: "snap-step-detail" });
      stepEls[step.id] = { row, icon, detail };
    }

    const updateStep = (id: string, status: "running" | "done" | "error", detailText?: string) => {
      const s = stepEls[id];
      if (!s) return;
      s.row.removeClass("snap-step-running");
      s.row.removeClass("snap-step-done");
      s.row.removeClass("snap-step-error");
      s.detail.empty();

      if (status === "running") {
        s.row.addClass("snap-step-running");
      } else if (status === "done") {
        s.row.addClass("snap-step-done");
      } else {
        s.row.addClass("snap-step-error");
      }

      if (detailText) {
        s.detail.createSpan({ cls: "snap-step-text", text: detailText });
      }
    };

    try {
      updateStep("classify", "running");
      const triageStart = performance.now();
      const triageResponse = await snapBlueprintTriage(
        this.settings.subqApiKey,
        this.userIdea,
        this.imageBase64 || undefined,
        this.imageMimeType || undefined
      );
      const triageLatency = performance.now() - triageStart;

      const domainAns = triageResponse.answers.research_domain as SnapChoiceAnswer;
      const soundAns = triageResponse.answers.theoretical_soundness as SnapNoulAnswer;
      const frameworkAns = triageResponse.answers.core_framework as SnapChoiceAnswer;
      const dataAns = triageResponse.answers.data_prerequisites as SnapChoiceAnswer;

      const domainName = domainAns.choice.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const frameworkName = frameworkAns.choice.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

      updateStep("classify", "done", `${domainName} · ${(triageLatency / 1000).toFixed(1)}s`);
      updateStep("soundness", "done", `${(soundAns.noul * 100).toFixed(0)}% Viable`);

      updateStep("writer", "running");
      const writeStart = performance.now();
      const roadmapNote = await generateRoadmapNote(
        this.settings.geminiApiKey,
        this.settings.geminiModel,
        this.userIdea,
        domainAns.choice,
        frameworkAns.choice,
        dataAns.choice,
        soundAns.noul
      );
      const writeLatency = performance.now() - writeStart;
      updateStep("writer", "done", `Ready · ${(writeLatency / 1000).toFixed(1)}s`);

      updateStep("verify", "running");
      const verifyStart = performance.now();
      const verifyResponse = await snapBlueprintVerify(
        this.settings.subqApiKey,
        this.userIdea,
        roadmapNote
      );
      const verifyLatency = performance.now() - verifyStart;

      const coverageAns = verifyResponse.answers.coverage as SnapNoulAnswer;
      const relevanceAns = verifyResponse.answers.relevance as SnapScoreAnswer;

      updateStep("verify", "done", `Coverage ${(coverageAns.noul * 100).toFixed(0)}% · Score ${relevanceAns.score.toFixed(1)}/2.0 · ${(verifyLatency / 1000).toFixed(1)}s`);

      const blueprint: BlueprintResult = {
        domain: domainName,
        domainConfidence: domainAns.confidence,
        theoreticalSoundness: soundAns.noul,
        coreFramework: frameworkName,
        frameworkConfidence: frameworkAns.confidence,
        dataPrerequisites: dataAns.choice.replace(/_/g, " "),
        dataConfidence: dataAns.confidence,
        generatedRoadmap: roadmapNote,
        usageCall1: triageResponse.usage,
        latencyCall1: triageLatency,
      };

      const bpVerify: BlueprintVerificationResult = {
        coverageScore: coverageAns.noul,
        relevanceScore: relevanceAns.score,
        isVerified: coverageAns.noul >= 0.7 && relevanceAns.score >= 1.4,
        usageCall2: verifyResponse.usage,
        latencyCall2: verifyLatency,
      };

      this.lastBlueprint = blueprint;
      this.lastBlueprintVerification = bpVerify;

      this.renderBlueprintResults(el, blueprint, bpVerify);

    } catch (err: any) {
      new Notice(`Blueprint error: ${err?.message || err}`);
      console.error(err);
    }
  }

  private renderVaultResults(
    parentEl: HTMLElement,
    result: EngineResult,
    verification: VerificationResult,
    noteContent: string
  ) {
    const results = parentEl.createDiv({ cls: "snap-results" });
    const cards = results.createDiv({ cls: "snap-cards" });

    this.renderCard(
      cards,
      "IDEA FIT",
      `${(result.ideaValid * 100).toFixed(0)}%`,
      result.ideaValid >= 0.7 ? "Strong Evidence" : "Uncertain",
      result.ideaValid >= 0.7 ? "success" : "neutral"
    );

    this.renderCard(
      cards,
      "TOP SOURCE",
      result.keyDocument,
      `${(result.keyDocConfidence * 100).toFixed(0)}% match`,
      "neutral"
    );

    const templateDisplay = result.template.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    this.renderCard(
      cards,
      "FORMAT",
      templateDisplay,
      `${(result.templateConfidence * 100).toFixed(0)}% fit`,
      "neutral"
    );

    this.renderCard(
      cards,
      "ACCURACY",
      verification.isVerified ? "Verified" : "Review",
      `${verification.faithfulness.toFixed(1)} / 2.0`,
      verification.isVerified ? "success" : "neutral"
    );

    const segmentedWrap = results.createDiv({ cls: "snap-segmented-wrap" });
    const segmentedControl = segmentedWrap.createDiv({ cls: "snap-segmented-control" });

    const btnNote = segmentedControl.createEl("button", {
      text: "Note Preview",
      cls: `snap-segment-btn ${this.activeTab === "note" ? "active" : ""}`
    });
    const btnExcerpt = segmentedControl.createEl("button", {
      text: "Source Excerpt",
      cls: `snap-segment-btn ${this.activeTab === "excerpt" ? "active" : ""}`
    });
    const btnBreakdown = segmentedControl.createEl("button", {
      text: "Probabilities",
      cls: `snap-segment-btn ${this.activeTab === "breakdown" ? "active" : ""}`
    });

    const contentArea = results.createDiv({ cls: "snap-panel-content" });

    btnNote.addEventListener("click", () => {
      this.activeTab = "note";
      btnNote.addClass("active");
      btnExcerpt.removeClass("active");
      btnBreakdown.removeClass("active");
      this.renderNoteTab(contentArea, noteContent);
    });

    btnExcerpt.addEventListener("click", () => {
      this.activeTab = "excerpt";
      btnExcerpt.addClass("active");
      btnNote.removeClass("active");
      btnBreakdown.removeClass("active");
      this.renderExcerptTab(contentArea, result);
    });

    btnBreakdown.addEventListener("click", () => {
      this.activeTab = "breakdown";
      btnBreakdown.addClass("active");
      btnNote.removeClass("active");
      btnExcerpt.removeClass("active");
      this.renderBreakdownTab(contentArea, result);
    });

    this.renderNoteTab(contentArea, noteContent);

    const btnRow = results.createDiv({ cls: "snap-btn-row" });

    const createBtn = btnRow.createEl("button", {
      text: "Save Note",
      cls: "snap-submit-btn",
    });
    createBtn.addEventListener("click", async () => {
      this.lastCreatedFile = await this.createNoteInVault(noteContent, result.template);
    });

    if (CopilotIntegration.isAvailable(this.app)) {
      const copilotBtn = btnRow.createEl("button", {
        text: "Send to Copilot",
        cls: "snap-submit-btn snap-copilot-btn",
      });
      copilotBtn.addEventListener("click", async () => {
        if (!this.lastCreatedFile) {
          this.lastCreatedFile = await this.createNoteInVault(noteContent, result.template);
        }
        if (this.lastCreatedFile) {
          await CopilotIntegration.sendNoteToCopilot(this.app, this.lastCreatedFile, result.citation, this.userIdea);
        }
      });
    }
  }

  private renderBlueprintResults(
    parentEl: HTMLElement,
    blueprint: BlueprintResult,
    bpVerify: BlueprintVerificationResult
  ) {
    const results = parentEl.createDiv({ cls: "snap-results" });
    const cards = results.createDiv({ cls: "snap-cards" });

    this.renderCard(
      cards,
      "DOMAIN",
      blueprint.domain,
      `Conf ${(blueprint.domainConfidence * 100).toFixed(0)}%`,
      "neutral"
    );

    this.renderCard(
      cards,
      "VIABILITY",
      `${(blueprint.theoreticalSoundness * 100).toFixed(0)}%`,
      blueprint.theoreticalSoundness >= 0.7 ? "Theoretically Sound" : "Speculative",
      blueprint.theoreticalSoundness >= 0.7 ? "success" : "neutral"
    );

    this.renderCard(
      cards,
      "FRAMEWORK",
      blueprint.coreFramework,
      "Seminal Literature Anchor",
      "neutral"
    );

    this.renderCard(
      cards,
      "COVERAGE",
      bpVerify.isVerified ? "Verified" : "Review",
      `Score ${bpVerify.relevanceScore.toFixed(1)}/2.0`,
      bpVerify.isVerified ? "success" : "neutral"
    );

    const segmentedWrap = results.createDiv({ cls: "snap-segmented-wrap" });
    const segmentedControl = segmentedWrap.createDiv({ cls: "snap-segmented-control" });

    const btnRoadmap = segmentedControl.createEl("button", {
      text: "Roadmap Note Preview",
      cls: "snap-segment-btn active"
    });
    const btnParams = segmentedControl.createEl("button", {
      text: "Literature Search Space",
      cls: "snap-segment-btn"
    });

    const contentArea = results.createDiv({ cls: "snap-panel-content" });

    btnRoadmap.addEventListener("click", () => {
      btnRoadmap.addClass("active");
      btnParams.removeClass("active");
      this.renderNoteTab(contentArea, blueprint.generatedRoadmap);
    });

    btnParams.addEventListener("click", () => {
      btnParams.addClass("active");
      btnRoadmap.removeClass("active");
      this.renderBlueprintParamsTab(contentArea, blueprint);
    });

    this.renderNoteTab(contentArea, blueprint.generatedRoadmap);

    const btnRow = results.createDiv({ cls: "snap-btn-row" });

    const saveBtn = btnRow.createEl("button", {
      text: "Save Roadmap to Vault",
      cls: "snap-submit-btn",
    });
    saveBtn.addEventListener("click", async () => {
      this.lastCreatedFile = await this.createNoteInVault(blueprint.generatedRoadmap, "research-roadmap");
    });

    if (CopilotIntegration.isAvailable(this.app)) {
      const copilotBtn = btnRow.createEl("button", {
        text: "Send Roadmap to Copilot",
        cls: "snap-submit-btn snap-copilot-btn",
      });
      copilotBtn.addEventListener("click", async () => {
        if (!this.lastCreatedFile) {
          this.lastCreatedFile = await this.createNoteInVault(blueprint.generatedRoadmap, "research-roadmap");
        }
        if (this.lastCreatedFile) {
          const prompt = `Here is my new research roadmap [[${this.lastCreatedFile.basename}]]. Based on the ArXiv search queries and seminal literature identified by SubQ Snap, can you search and summarize the key mathematical derivations for: "${this.userIdea}"?`;
          await navigator.clipboard.writeText(prompt);
          new Notice("Copilot linked! Research query copied to clipboard.");
          await CopilotIntegration.sendNoteToCopilot(this.app, this.lastCreatedFile, "Literature Blueprint", this.userIdea);
        }
      });
    }
  }

  private renderBlueprintParamsTab(parent: HTMLElement, blueprint: BlueprintResult) {
    parent.empty();
    const container = parent.createDiv({ cls: "snap-breakdown-container" });

    const metricGrid = container.createDiv({ cls: "snap-matrix-metrics" });
    this.renderMetricTile(metricGrid, "DECISION MODEL", "SubQ Snap", "384K context");
    this.renderMetricTile(metricGrid, "WRITER MODEL", this.settings.geminiModel, "Literature Synthesis");
    this.renderMetricTile(metricGrid, "DOMAIN", blueprint.domain, "Classified Taxon");
    this.renderMetricTile(metricGrid, "DATA PREREQUISITE", blueprint.dataPrerequisites, "Required Feed");

    const infoCard = container.createDiv({ cls: "snap-dist-card" });
    infoCard.createEl("h4", { text: "Search Space & Research Guide" });
    const p = infoCard.createEl("p", {
      text: `Your vault is ready to receive literature on ${blueprint.domain}. Save the generated roadmap into your vault to establish your initial study checklist, or send it to Copilot Chat to search ArXiv and retrieve paper abstracts automatically.`,
      cls: "snap-step-text"
    });
    p.style.lineHeight = "1.6";
  }

  private async renderNoteTab(parent: HTMLElement, noteContent: string) {
    parent.empty();
    const box = parent.createDiv({ cls: "snap-doc-box" });
    try {
      await MarkdownRenderer.render(this.app, noteContent, box, "", this);
    } catch {
      const pre = box.createEl("pre", { text: noteContent });
      pre.style.whiteSpace = "pre-wrap";
    }
  }

  private async renderExcerptTab(parent: HTMLElement, result: EngineResult) {
    parent.empty();
    const meta = parent.createDiv({ cls: "snap-doc-meta" });
    meta.createEl("span", { text: `Citation: ${result.citation}`, cls: "snap-doc-citation" });

    const box = parent.createDiv({ cls: "snap-doc-box" });
    try {
      await MarkdownRenderer.render(this.app, result.excerpt, box, "", this);
    } catch {
      const pre = box.createEl("pre", { text: result.excerpt });
      pre.style.whiteSpace = "pre-wrap";
    }
  }

  private renderBreakdownTab(parent: HTMLElement, result: EngineResult) {
    parent.empty();
    const container = parent.createDiv({ cls: "snap-breakdown-container" });

    const metricGrid = container.createDiv({ cls: "snap-matrix-metrics" });
    const excerptTokens = Math.round(result.excerpt.length / 4);
    const compressionPct = (((result.totalVaultTokens - excerptTokens) / result.totalVaultTokens) * 100).toFixed(1);

    this.renderMetricTile(metricGrid, "TOKENS ANALYZED", result.totalVaultTokens.toLocaleString(), `${compressionPct}% reduced to excerpt`);
    const spd = Math.round(result.totalVaultTokens / (result.latencyCall1 / 1000));
    this.renderMetricTile(metricGrid, "SPEED", `~${spd.toLocaleString()} tok/s`, `Latency: ${(result.latencyCall1 / 1000).toFixed(1)}s`);
    const estCost = ((result.totalVaultTokens / 1000000) * 0.09).toFixed(3);
    this.renderMetricTile(metricGrid, "DECISION COST", `$${estCost}`, "$0.09/1M tokens");
    this.renderMetricTile(metricGrid, "CONTEXT WINDOW", "384,000", "Zero chunking");

    const docSection = container.createDiv({ cls: "snap-dist-card" });
    docSection.createEl("h4", { text: "Candidate Document Probabilities" });

    const docEntries = Object.entries(result.keyDocProbabilities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const docList = docSection.createDiv({ cls: "snap-dist-list" });
    for (const [docName, prob] of docEntries) {
      const cleanName = docName.split(/[\\/]/).pop() || docName;
      const isWinner = cleanName === result.keyDocument || docName === result.keyDocument;

      const row = docList.createDiv({ cls: `snap-dist-row ${isWinner ? 'winner' : ''}` });
      row.createSpan({ text: cleanName, cls: "snap-dist-label" });

      const barContainer = row.createDiv({ cls: "snap-bar-track" });
      const bar = barContainer.createDiv({ cls: "snap-bar-fill" });
      const pct = (prob * 100).toFixed(1);
      bar.style.width = `${Math.max(Number(pct), 4)}%`;

      row.createSpan({ text: `${pct}%`, cls: "snap-dist-pct" });
    }
  }

  private renderMetricTile(parent: HTMLElement, label: string, value: string, sub: string) {
    const tile = parent.createDiv({ cls: "snap-metric-tile" });
    tile.createEl("div", { text: label, cls: "snap-tile-label" });
    tile.createEl("div", { text: value, cls: "snap-tile-value" });
    tile.createEl("div", { text: sub, cls: "snap-tile-sub" });
  }

  private renderCard(
    parent: HTMLElement,
    title: string,
    value: string,
    subtitle: string,
    state: "success" | "neutral" = "neutral"
  ) {
    const card = parent.createDiv({ cls: "snap-card" });
    card.createEl("div", { text: title, cls: "snap-card-title" });
    const valEl = card.createEl("div", { text: value, cls: "snap-card-value" });
    valEl.title = value;
    card.createEl("div", { text: subtitle, cls: `snap-card-sub ${state}` });
  }

  private async createNoteInVault(noteContent: string, templateOrType: string): Promise<TFile | null> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const prefix = templateOrType.replace(/_/g, "-");
    const fileName = `snap-${prefix}-${timestamp}.md`;

    try {
      const file = await this.app.vault.create(fileName, noteContent);
      new Notice(`Note saved: ${fileName}`);

      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
      return file;
    } catch (err: any) {
      new Notice(`Failed to save note: ${err.message}`);
      return null;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
