// THINAI Structured Symptom Question Service (Feature 6)
// Provides a deterministic, offline-capable 3-question diagnostic triage
// for low-confidence and LAB_ONLY cases.
//
// SAFETY INVARIANTS:
// 1. Strictly <= 3 questions per crop.
// 2. Free-text LLMs are NEVER used to generate pesticide advice.
// 3. If uncertainty remains high or answers contradict the model, route to officer referral.
// 4. Chemical advice is NEVER output by this service.

import symptomQuestionsData from "../data/symptomQuestions.json";

export interface SymptomOption {
  id: string;
  labelEn: string;
  labelTa: string;
  supports: string[];
}

export interface SymptomQuestion {
  id: string;
  questionEn: string;
  questionTa: string;
  options: SymptomOption[];
}

export interface SymptomEvaluationResult {
  candidateDisease: string;
  agreementScore: number; // 0.0 to 1.0 (proportion of answers supporting model's top prediction)
  updatedUncertainty: number; // Revised uncertainty score
  isHighUncertainty: boolean;
  routeToOfficer: boolean;
  recommendation: string;
  reasoning: string[];
}

const cropQuestionDb = symptomQuestionsData.crops as Record<string, SymptomQuestion[]>;

/**
 * Returns at most 3 structured symptom questions for a given crop.
 * Falls back to Tomato if crop has no custom question set.
 */
export function getSymptomQuestionsForCrop(cropName: string): SymptomQuestion[] {
  const norm = (cropName || "Tomato").trim().toLowerCase();
  
  for (const [key, questions] of Object.entries(cropQuestionDb)) {
    if (norm.includes(key.toLowerCase()) || key.toLowerCase().includes(norm)) {
      return questions.slice(0, 3);
    }
  }

  // Default to Tomato questions if unmapped
  return (cropQuestionDb["Tomato"] || []).slice(0, 3);
}

/**
 * Combines farmer's symptom responses with the vision model prediction.
 *
 * @param params.crop - Name of crop
 * @param params.modelPrediction - Disease label predicted by vision model
 * @param params.answers - Map of questionId -> optionId selected by farmer
 * @param params.baselineUncertainty - Uncertainty score [0, 1] from model
 */
export function evaluateSymptomAnswers(params: {
  crop: string;
  modelPrediction: string;
  answers: Record<string, string>;
  baselineUncertainty: number;
}): SymptomEvaluationResult {
  const questions = getSymptomQuestionsForCrop(params.crop);
  const totalQuestions = Math.min(3, questions.length);

  if (totalQuestions === 0 || Object.keys(params.answers).length === 0) {
    return {
      candidateDisease: params.modelPrediction,
      agreementScore: 0,
      updatedUncertainty: params.baselineUncertainty,
      isHighUncertainty: true,
      routeToOfficer: true,
      recommendation: "Insufficient symptom data. Please schedule an extension officer field inspection.",
      reasoning: ["No symptom questionnaire responses provided."],
    };
  }

  let supportCount = 0;
  const reasoning: string[] = [];
  const predLower = params.modelPrediction.toLowerCase();

  for (const q of questions) {
    const selectedOptionId = params.answers[q.id];
    if (!selectedOptionId) continue;

    const option = q.options.find((opt) => opt.id === selectedOptionId);
    if (!option) continue;

    const matchesModel = option.supports.some((supported) => {
      const suppLower = supported.toLowerCase();
      return predLower.includes(suppLower) || suppLower.includes(predLower);
    });

    if (matchesModel) {
      supportCount++;
      reasoning.push(`Answer "${option.labelEn}" supports ${params.modelPrediction}.`);
    } else {
      reasoning.push(
        `Answer "${option.labelEn}" diverges from vision prediction (points towards ${option.supports.join(", ")}).`
      );
    }
  }

  const answeredCount = Object.keys(params.answers).length;
  const agreementScore = answeredCount > 0 ? supportCount / answeredCount : 0;

  // Update uncertainty:
  // - High agreement (agreementScore >= 0.67): reduces uncertainty by up to 0.20
  // - Disagreement (agreementScore < 0.50): increases uncertainty by 0.25 (contradictory symptoms)
  let updatedUncertainty = params.baselineUncertainty;
  if (agreementScore >= 0.67) {
    updatedUncertainty = Math.max(0.10, params.baselineUncertainty - 0.20);
  } else if (agreementScore <= 0.33) {
    updatedUncertainty = Math.min(1.0, params.baselineUncertainty + 0.25);
  }

  const isHighUncertainty = updatedUncertainty >= 0.65;
  const routeToOfficer = isHighUncertainty || agreementScore < 0.50;

  let recommendation: string;
  if (routeToOfficer) {
    recommendation =
      "Visual and symptomatic observations diverge. To avoid incorrect application of remedies, an extension officer must inspect the crop.";
  } else {
    recommendation =
      "Reported field symptoms align with optical diagnosis. Follow cultural sanitation and monitor closely.";
  }

  return {
    candidateDisease: params.modelPrediction,
    agreementScore: Math.round(agreementScore * 100) / 100,
    updatedUncertainty: Math.round(updatedUncertainty * 100) / 100,
    isHighUncertainty,
    routeToOfficer,
    recommendation,
    reasoning,
  };
}
