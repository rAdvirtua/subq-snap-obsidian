import { App, PluginSettingTab, Setting } from "obsidian";
import type ResearchIdeationEngine from "./main";
import { SnapEngineSettings } from "./types";

export class SnapEngineSettingTab extends PluginSettingTab {
  plugin: ResearchIdeationEngine;

  constructor(app: App, plugin: ResearchIdeationEngine) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("SubQ API Key")
      .setDesc("Enter your SubQ API key for Snap analysis")
      .addText((text) =>
        text
          .setPlaceholder("Enter your key")
          .setValue(this.plugin.settings.subqApiKey)
          .onChange(async (value) => {
            this.plugin.settings.subqApiKey = value;
            await this.plugin.saveSettings();
          })
      )
      .then((setting) => {
        const inputEl = setting.controlEl.querySelector("input");
        if (inputEl) inputEl.type = "password";
      });

    new Setting(containerEl)
      .setName("Gemini API Key")
      .setDesc("Enter your Gemini API key")
      .addText((text) =>
        text
          .setPlaceholder("Enter your key")
          .setValue(this.plugin.settings.geminiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.geminiApiKey = value;
            await this.plugin.saveSettings();
          })
      )
      .then((setting) => {
        const inputEl = setting.controlEl.querySelector("input");
        if (inputEl) inputEl.type = "password";
      });

    new Setting(containerEl)
      .setName("Gemini Model")
      .setDesc("Select the Gemini model to use")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("gemini-3.8-flash", "gemini-3.8-flash")
          .addOption("gemini-3.5-flash", "gemini-3.5-flash")
          .addOption("gemini-3.7-flash", "gemini-3.7-flash")
          .setValue(this.plugin.settings.geminiModel)
          .onChange(async (value) => {
            this.plugin.settings.geminiModel = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
