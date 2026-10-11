export interface Template {
  name: string;
  systemPrompt: string;
  structure: string;
}

const COMMON_PROMPT = `
Output a complete markdown note with YAML frontmatter.
Use the provided template structure exactly as outlined.
You MUST include exact Obsidian-style backlinks to the source (e.g., [[filename#section]]) inside your text.
Only cite evidence from the provided excerpt. Do not hallucinate or add outside information.
Be concise and atomic.
`;

export const TEMPLATES: Record<string, Template> = {
  action_plan: {
    name: 'Action Plan',
    systemPrompt: `You are an expert strategist. Create an actionable plan based on the user's idea and the provided evidence.${COMMON_PROMPT}`,
    structure: `---
type: action_plan
tags: [action, plan]
status: draft
---
# Action Plan: {Title}

## Objective
[Brief summary of what is trying to be achieved, citing the source]

## Next Steps / Roadmap
- [ ] Step 1: ... (See [[citation]])
- [ ] Step 2: ...

## Required Resources
- Resource 1
`
  },
  literature_summary: {
    name: 'Literature Summary',
    systemPrompt: `You are an expert researcher. Create a synthesis of existing research findings based on the user's idea and the provided evidence.${COMMON_PROMPT}`,
    structure: `---
type: literature_summary
tags: [research, summary]
---
# Synthesis: {Title}

## Key Findings
- Finding 1 with source link [[citation]]
- Finding 2 with source link [[citation]]

## Analysis
[Provide your synthesis here]

## Source References
- [[citation]]
`
  },
  risk_critique: {
    name: 'Risk Critique',
    systemPrompt: `You are a critical risk analyst. Provide a critical analysis of risks, gaps, and counterarguments based on the user's idea and the provided evidence.${COMMON_PROMPT}`,
    structure: `---
type: risk_critique
tags: [critique, risk]
---
# Critique: {Title}

## Potential Risks
- Risk 1: (Linked to [[citation]])
- Risk 2: 

## Counterarguments & Gaps
[Critical analysis discussing where the idea may fail based on the evidence]

## Mitigation Strategies
[Suggestions for overcoming the identified gaps]
`
  },
  concept_note: {
    name: 'Concept Note',
    systemPrompt: `You are a conceptual thinker. Crystallize the user's vague idea into a clear concept based on the provided evidence.${COMMON_PROMPT}`,
    structure: `---
type: concept_note
tags: [concept, idea]
---
# Concept: {Title}

## Core Idea
[Clear articulation of the concept, referencing [[citation]]]

## Context & Motivation
[Why this concept matters, grounded in the source]

## Connections
- Relates to: [[citation]]
`
  }
};

export function getTemplate(key: string): Template {
  return TEMPLATES[key] || TEMPLATES['concept_note'];
}
