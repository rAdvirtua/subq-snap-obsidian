import { requestUrl } from 'obsidian';
import { getTemplate } from './templates';

export async function generateNote(
  apiKey: string,
  model: string,
  excerpt: string,
  templateKey: string,
  userIdea: string,
  citation: string
): Promise<string> {
  const template = getTemplate(templateKey);
  
  const prompt = `${template.systemPrompt}

User's Idea: ${userIdea}
Source Citation: ${citation}
Template: ${template.name}

EXCERPT FROM SOURCE:
${excerpt}

Write the complete Obsidian note now. Output ONLY the markdown — no explanations, no code fences.`;
  
  return await callGeminiWithFallbacks(apiKey, model, prompt);
}

export async function generateRoadmapNote(
  apiKey: string,
  model: string,
  userIdea: string,
  domain: string,
  coreFramework: string,
  dataPrerequisites: string,
  soundness: number
): Promise<string> {
  const prompt = `You are an expert academic research supervisor and quantitative strategist.
A researcher has started a new Obsidian vault with the following research hypothesis:
"${userIdea}"

SubQ Snap evaluated this hypothesis with the following structural taxonomy:
- Research Domain: ${domain.replace(/_/g, ' ')}
- Theoretical Plausibility: ${(soundness * 100).toFixed(0)}%
- Seminal Literature Framework: ${coreFramework.replace(/_/g, ' ')}
- Primary Data Prerequisite: ${dataPrerequisites.replace(/_/g, ' ')}

Create a complete, beautifully structured Obsidian research blueprint note.
Include:
1. YAML frontmatter (type: research_roadmap, status: active, tags: [research, roadmap, literature-survey, ${domain.replace(/_/g, '-')}])
2. # Research Roadmap: [Descriptive Title]
3. ## Executive Hypothesis & Scope
4. ## Seminal Literature to Collect (List 4-5 classic and modern landmark papers with Title, Authors, Year, Core Equation or Key Insight)
5. ## Target ArXiv & SSRN Search Queries (Exact boolean search strings ready to copy into search engines)
6. ## Required Benchmark Datasets & APIs
7. ## Implementation Milestones & Checklist (Using native Obsidian \`- [ ]\` checkboxes)
8. ## Key Econometric Risks & Empirical Gaps

Output ONLY clean Obsidian markdown. Do not include markdown code fences or conversational text.`;

  return await callGeminiWithFallbacks(apiKey, model, prompt);
}

async function callGeminiWithFallbacks(apiKey: string, model: string, prompt: string): Promise<string> {
  const fallbackModels = [model, 'gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  const modelsToTry = Array.from(new Set(fallbackModels));

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
        const response = await requestUrl({
          url,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 2500,
              temperature: 0.7,
            }
          }),
        });

        const data = response.json;
        if (data.error) {
          throw new Error(data.error.message || `HTTP ${data.error.code}`);
        }

        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        text = text.replace(/^```markdown\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
        if (text.trim()) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const status = err?.status || 0;
        if (status === 503 || status === 429 || errMsg.includes('503') || errMsg.includes('demand')) {
          await new Promise((r) => setTimeout(r, 1200 * attempt));
          continue;
        }
        break;
      }
    }
  }

  throw new Error(`Gemini generation failed: ${lastError?.message || lastError || 'Unknown error'}`);
}
