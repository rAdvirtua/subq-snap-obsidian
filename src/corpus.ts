import { Vault } from 'obsidian';

export interface CorpusResult {
  manifest: Map<string, string>;
  concatenated: string;
  fileCount: number;
  estimatedTokens: number;
}

export async function readVault(vault: Vault): Promise<CorpusResult> {
  const files = vault.getMarkdownFiles();
  const manifest = new Map<string, string>();
  let concatenated = '';
  
  for (const file of files) {
    const content = await vault.read(file);
    manifest.set(file.path, content);
    concatenated += `\n=== FILE: ${file.path} ===\n${content}\n`;
  }
  
  const estimatedTokens = Math.ceil(concatenated.length / 4);
  
  return {
    manifest,
    concatenated,
    fileCount: files.length,
    estimatedTokens,
  };
}
