import { App, Notice, TFile } from "obsidian";

export class CopilotIntegration {
  static isAvailable(app: App): boolean {
    const plugins = (app as any).plugins;
    return !!(plugins && plugins.getPlugin("copilot") && plugins.enabledPlugins?.has("copilot"));
  }

  static async sendNoteToCopilot(
    app: App,
    file: TFile,
    citation: string,
    idea: string
  ): Promise<boolean> {
    try {
      const plugins = (app as any).plugins;
      const copilot = plugins?.getPlugin("copilot");

      if (!copilot) {
        new Notice("Copilot plugin is not installed or enabled in this vault.");
        return false;
      }

      if (typeof copilot.activateView === "function") {
        await copilot.activateView();
      } else if (typeof copilot.openOrRevealView === "function") {
        await copilot.openOrRevealView("copilot-view", true);
      }

      if (typeof copilot.addNoteToActiveChat === "function") {
        await copilot.addNoteToActiveChat(file);
      }

      const suggestedPrompt = `Analyze [[${file.basename}]] which was grounded by SubQ Snap from ${citation}.\nBased on this evidence, what are the primary implementation risks, milestones, and next research steps for: "${idea}"?`;

      await navigator.clipboard.writeText(suggestedPrompt);
      new Notice("Linked to Copilot Chat! Suggested query copied to clipboard.", 4000);
      return true;
    } catch (err: any) {
      console.warn("Copilot integration notice:", err);
      new Notice(`Copilot: Note created at [[${file.basename}]]. You can drag it into Copilot Chat.`);
      return false;
    }
  }
}
