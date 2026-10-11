import { Plugin, WorkspaceLeaf } from "obsidian";
import { SnapEngineSettings, DEFAULT_SETTINGS } from "./types";
import { SnapEngineSettingTab } from "./settings";
import { EngineModal } from "./engineModal";
import { SnapEngineView, VIEW_TYPE_SNAP_ENGINE } from "./sidebarView";

export default class ResearchIdeationEngine extends Plugin {
  settings: SnapEngineSettings;

  async onload() {
    await this.loadSettings();

    this.registerView(
      VIEW_TYPE_SNAP_ENGINE,
      (leaf: WorkspaceLeaf) => new SnapEngineView(leaf, this)
    );

    this.addRibbonIcon('brain', 'Research & Ideation Engine', () => {
      new EngineModal(this.app, this.settings).open();
    });

    this.addCommand({
      id: "open-engine",
      name: "Research & Ideation Engine: Analyze Vault (Modal)",
      callback: () => {
        new EngineModal(this.app, this.settings).open();
      },
    });

    this.addCommand({
      id: "open-engine-sidebar",
      name: "Research & Ideation Engine: Open in Sidebar",
      callback: async () => {
        await this.activateSidebarView();
      },
    });

    this.addSettingTab(new SnapEngineSettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_SNAP_ENGINE);
  }

  async activateSidebarView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_SNAP_ENGINE);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_SNAP_ENGINE, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!this.settings.subqApiKey && typeof process !== "undefined" && process.env?.SUBQ_API_KEY) {
      this.settings.subqApiKey = process.env.SUBQ_API_KEY;
    }
    if (!this.settings.geminiApiKey && typeof process !== "undefined" && process.env?.GEMINI_API_KEY) {
      this.settings.geminiApiKey = process.env.GEMINI_API_KEY;
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
