import { requestUrl } from 'obsidian';
import { SnapResponse } from './types';

const SNAP_URL = 'https://api.subq.ai/v1/systemone';

export async function snapTriage(
  apiKey: string,
  corpus: string,
  userIdea: string,
  fileNames: string[],
  imageBase64?: string,
  imageMimeType?: string
): Promise<SnapResponse> {
  const state = `=== USER IDEA ===\n${userIdea}\n\n${corpus}`;
  
  const fileCriteria: Record<string, null> = {};
  for (const name of fileNames) {
    fileCriteria[name] = null;
  }
  
  const body: any = {
    model: 'subq-snap-preview',
    state,
    questions: {
      idea_valid: {
        type: 'noul',
        instructions: 'Based on all the research papers, case studies, and notes provided, does the user\'s idea hold up as viable and grounded in evidence?',
        criteria: {
          true: 'The idea is supported by evidence in the corpus, or the corpus provides a foundation to build on',
          false: 'The idea contradicts the evidence, is unsupported, or the corpus is irrelevant to the idea'
        }
      },
      key_document: {
        type: 'choice',
        instructions: 'Which single document from the corpus is most relevant and useful for developing the user\'s idea?',
        criteria: fileCriteria
      },
      template: {
        type: 'choice',
        instructions: 'Given the user\'s idea and the type of evidence available, which Obsidian note template fits best for the output?',
        criteria: {
          action_plan: 'The idea needs concrete next steps, milestones, and a roadmap',
          literature_summary: 'The idea needs a synthesis of existing research findings',
          risk_critique: 'The idea needs critical analysis of risks, gaps, and counterarguments',
          concept_note: 'The idea is vague and needs to be crystallized into a clear concept'
        }
      }
    }
  };
  
  if (imageBase64 && imageMimeType) {
    body.images = [{ mediaType: imageMimeType, base64: imageBase64 }];
  }
  
  const response = await requestUrl({
    url: SNAP_URL,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  return response.json as SnapResponse;
}

export async function snapPinpoint(
  apiKey: string,
  documentContent: string,
  documentName: string,
  userIdea: string,
  headings: Record<string, string>
): Promise<SnapResponse> {
  const state = `=== USER IDEA ===\n${userIdea}\n\n=== DOCUMENT: ${documentName} ===\n${documentContent}`;
  
  const body = {
    model: 'subq-snap-preview',
    state,
    questions: {
      key_section: {
        type: 'choice',
        instructions: 'Which section of this document contains the most relevant evidence or insight for the user\'s idea?',
        criteria: headings
      }
    }
  };
  
  const response = await requestUrl({
    url: SNAP_URL,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  return response.json as SnapResponse;
}

export async function snapVerify(
  apiKey: string,
  excerpt: string,
  userIdea: string,
  generatedNote: string
): Promise<SnapResponse> {
  const state = `=== ORIGINAL EXCERPT ===\n${excerpt}\n\n=== USER IDEA ===\n${userIdea}\n\n=== GENERATED NOTE ===\n${generatedNote}`;
  
  const body = {
    model: 'subq-snap-preview',
    state,
    questions: {
      missed_context: {
        type: 'noul',
        instructions: 'Did the generated note miss any important evidence or context from the original excerpt that would be relevant to the user\'s idea?',
        criteria: {
          true: 'Key findings, data points, or arguments from the excerpt are absent from the note',
          false: 'The note adequately covers the relevant evidence from the excerpt'
        }
      },
      faithfulness: {
        type: 'score',
        instructions: 'How faithful is the generated note to the source excerpt? Does it accurately represent the evidence without hallucination?',
        criteria: [
          'Unfaithful — contains claims not in the excerpt',
          'Mostly faithful — minor liberties but core is accurate',
          'Fully faithful — all claims traceable to the excerpt'
        ]
      }
    }
  };
  
  const response = await requestUrl({
    url: SNAP_URL,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  return response.json as SnapResponse;
}

export async function snapBlueprintTriage(
  apiKey: string,
  userIdea: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<SnapResponse> {
  const state = `=== USER RESEARCH IDEA ===\n${userIdea}`;
  
  const body: any = {
    model: 'subq-snap-preview',
    state,
    questions: {
      research_domain: {
        type: 'choice',
        instructions: 'Which quantitative/scientific domain does this research hypothesis belong to?',
        criteria: {
          market_microstructure: 'Order book dynamics, limit orders, tick-level flow, VPIN, queue priority',
          factor_investing: 'Cross-sectional risk premia, Fama-French, momentum, quality anomalies',
          statistical_arbitrage: 'Cointegration, pairs trading, mean reversion, relative value spreads',
          deep_learning_alpha: 'Neural networks, transformers, alternative text embeddings, reinforcement learning',
          derivatives_volatility: 'Options surface, implied volatility, delta-gamma hedging, dispersion',
          macro_economic_regimes: 'Interest rate yield curves, credit spreads, monetary policy shock propagation'
        }
      },
      theoretical_soundness: {
        type: 'noul',
        instructions: 'Is the proposed hypothesis theoretically viable and grounded in academic econometrics/financial science?',
        criteria: {
          true: 'The hypothesis is theoretically sound, plausible, and aligns with established empirical finance literature',
          false: 'The hypothesis violates basic no-arbitrage bounds, is mathematically inconsistent, or purely speculative'
        }
      },
      core_framework: {
        type: 'choice',
        instructions: 'Which seminal academic framework is strictly required as the baseline for this research?',
        criteria: {
          cont_stoikov_order_book: 'Limit order book queue dynamics and micro-price formulation',
          carhart_fama_french: 'Multi-factor asset pricing and cross-sectional anomaly attribution',
          almgren_chriss_execution: 'Market impact functions and optimal liquidation schedules',
          engle_granger_johansen: 'Cointegration vector error correction and econometric mean reversion',
          avellaneda_stoikov_mm: 'Inventory risk management and continuous quoting bounds',
          merton_jump_diffusion: 'Jump diffusion processes and heavy-tail risk management'
        }
      },
      data_prerequisites: {
        type: 'choice',
        instructions: 'What primary data granularity and source is required to conduct this empirical case study?',
        criteria: {
          nanosecond_level3_itch: 'Tick-by-tick Level 3 order events and queue cancellations (NASDAQ ITCH)',
          millisecond_level2_book: 'Top 10 order book depth and millisecond bid/ask snapshots',
          daily_crsp_compustat: 'End-of-day equity prices and fundamental accounting financial ratios',
          tick_level_options: 'Option chain quotes, strikes, and implied volatility surfaces',
          alternative_text_sec: 'SEC 10-K/10-Q filings, earnings transcripts, and NLP sentiment feeds'
        }
      }
    }
  };

  if (imageBase64 && imageMimeType) {
    body.images = [{ mediaType: imageMimeType, base64: imageBase64 }];
  }

  const response = await requestUrl({
    url: SNAP_URL,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json as SnapResponse;
}

export async function snapBlueprintVerify(
  apiKey: string,
  userIdea: string,
  generatedRoadmap: string
): Promise<SnapResponse> {
  const state = `=== USER RESEARCH IDEA ===\n${userIdea}\n\n=== GENERATED RESEARCH ROADMAP ===\n${generatedRoadmap}`;

  const body = {
    model: 'subq-snap-preview',
    state,
    questions: {
      coverage: {
        type: 'noul',
        instructions: 'Does the generated research roadmap cover all critical theoretical prerequisites and implementation risks for the user\'s idea?',
        criteria: {
          true: 'The roadmap adequately specifies seminal literature, data sources, and execution risks',
          false: 'Critical methodology gaps or prerequisite datasets are missing from the roadmap'
        }
      },
      relevance: {
        type: 'score',
        instructions: 'How actionable and relevant are the suggested literature search queries and research milestones for the user\'s idea?',
        criteria: [
          'Generic or irrelevant — suggested papers and queries do not fit the idea',
          'Moderately relevant — useful direction with minor omissions',
          'Highly relevant — precise seminal papers, clean ArXiv queries, and actionable milestones'
        ]
      }
    }
  };

  const response = await requestUrl({
    url: SNAP_URL,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json as SnapResponse;
}
