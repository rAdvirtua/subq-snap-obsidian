import { snapVerify } from './snap';
import { VerificationResult, SnapNoulAnswer, SnapScoreAnswer } from './types';

export async function verifyNote(
  apiKey: string,
  excerpt: string,
  userIdea: string,
  generatedNote: string
): Promise<VerificationResult> {
  const start = performance.now();
  const response = await snapVerify(apiKey, excerpt, userIdea, generatedNote);
  const latency = performance.now() - start;
  
  const missedCtx = response.answers.missed_context as SnapNoulAnswer;
  const faithful = response.answers.faithfulness as SnapScoreAnswer;
  
  const missedContext = missedCtx.noul;
  const faithfulness = faithful.score;
  const faithfulnessConfidence = faithful.confidence;
  
  const isVerified = missedContext < 0.3 && faithfulness >= 1.5;
  
  return {
    missedContext,
    faithfulness,
    faithfulnessConfidence,
    isVerified,
    usageCall3: response.usage,
    latencyCall3: latency,
  };
}
