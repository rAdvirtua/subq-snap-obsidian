import { ItemView, WorkspaceLeaf } from "obsidian";
import type ResearchIdeationEngine from "./main";
import { EngineModal } from "./engineModal";

export const VIEW_TYPE_SNAP_ENGINE = "subq-snap-engine-view";

export class SnapEngineView extends ItemView {
  plugin: ResearchIdeationEngine;

  constructor(leaf: WorkspaceLeaf, plugin: ResearchIdeationEngine) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_SNAP_ENGINE;
  }

  getDisplayText(): string {
    return "Research Engine";
  }

  getIcon(): string {
    return "brain";
  }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("snap-sidebar-container");

    const header = container.createDiv({ cls: "snap-sidebar-header" });
    header.createEl("h3", { text: "Research Engine" });
    header.createEl("p", {
      text: "Powered by SubQ Snap 384K context",
      cls: "snap-subtitle",
    });

    const body = container.createDiv({ cls: "snap-sidebar-body" });
    body.createEl("p", {
      text: "Analyze your entire vault in seconds. Pinpoint evidence and draft verified notes.",
      cls: "snap-sidebar-desc"
    });

    const btnRow = body.createDiv({ cls: "snap-sidebar-btn-row" });
    const launchBtn = btnRow.createEl("button", {
      text: "Open Research Engine",
      cls: "snap-submit-btn snap-sidebar-launch-btn"
    });
    launchBtn.addEventListener("click", () => {
      new EngineModal(this.app, this.plugin.settings).open();
    });

    const statsBox = body.createDiv({ cls: "snap-sidebar-stats" });
    statsBox.createEl("h4", { text: "Vault Telemetry" });

    const files = this.app.vault.getMarkdownFiles();

    const statRows = [
      { label: "Context Window", value: "384,000 tokens" },
      { label: "Engine", value: "SubQ Snap" },
      { label: "Writer", value: this.plugin.settings.geminiModel },
      { label: "Indexed Notes", value: `${files.length} files` },
      { label: "Speed", value: "~45,000 tok/s" },
      { label: "Copilot", value: "Connected" },
    ];

    for (const item of statRows) {
      const row = statsBox.createDiv({ cls: "snap-sidebar-stat-row" });
      row.createSpan({ cls: "snap-stat-label", text: item.label });
      row.createSpan({ cls: "snap-stat-value", text: item.value });
    }
  }

  async onClose() {}
}
