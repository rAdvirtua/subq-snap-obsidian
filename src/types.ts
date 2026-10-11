export interface SnapNoulAnswer {
  type: "noul";
  noul: number;
}

export interface SnapChoiceAnswer {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface SnapScoreAnswer {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
}

export type SnapAnswer = SnapNoulAnswer | SnapChoiceAnswer | SnapScoreAnswer;

export interface SnapResponse {
  model: string;
  answers: Record<string, SnapAnswer>;
  usage: { input_tokens: number; output_tokens: number };
}

export interface SnapEngineSettings {
  subqApiKey: string;
  geminiApiKey: string;
  geminiModel: string;
}

export const DEFAULT_SETTINGS: SnapEngineSettings = {
  subqApiKey: "",
  geminiApiKey: "",
  geminiModel: "gemini-3.5-flash-lite",
};

export interface EngineResult {
  ideaValid: number;
  keyDocument: string;
  keyDocConfidence: number;
  keyDocProbabilities: Record<string, number>;
  keySection: string;
  keySectionConfidence: number;
  sectionProbabilities?: Record<string, number>;
  template: string;
  templateConfidence: number;
  templateProbabilities?: Record<string, number>;
  excerpt: string;
  citation: string;
  totalVaultTokens: number;
  usageCall1: { input_tokens: number; output_tokens: number };
  usageCall2: { input_tokens: number; output_tokens: number };
  latencyCall1: number;
  latencyCall2: number;
}

export interface VerificationResult {
  missedContext: number;
  faithfulness: number;
  faithfulnessConfidence: number;
  isVerified: boolean;
  usageCall3: { input_tokens: number; output_tokens: number };
  latencyCall3: number;
}

export interface BlueprintResult {
  domain: string;
  domainConfidence: number;
  theoreticalSoundness: number;
  coreFramework: string;
  frameworkConfidence: number;
  dataPrerequisites: string;
  dataConfidence: number;
  generatedRoadmap: string;
  usageCall1: { input_tokens: number; output_tokens: number };
  latencyCall1: number;
}

export interface BlueprintVerificationResult {
  coverageScore: number;
  relevanceScore: number;
  isVerified: boolean;
  usageCall2: { input_tokens: number; output_tokens: number };
  latencyCall2: number;
}
