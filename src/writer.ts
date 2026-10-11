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
  const preferred = model && !model.includes('3.8') ? model : 'gemini-3.5-flash-lite';
  const fallbackModels = [
    preferred,
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
  ];
  const modelsToTry = Array.from(new Set(fallbackModels)).filter(Boolean);

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    let timer: any;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout on ${currentModel}`)), 9000);
      });

      const fetchPromise = requestUrl({
        url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2500,
            temperature: 0.7,
          },
        }),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]) as any;
      clearTimeout(timer);

      const data = response.json;
      if (data?.error) {
        throw new Error(data.error.message || `HTTP ${data.error.code}`);
      }

      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/^```markdown\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
      if (text.trim()) {
        return text;
      }
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      continue;
    }
  }

  throw new Error(`Gemini generation failed: ${lastError?.message || lastError || 'Unknown error'}`);
}

