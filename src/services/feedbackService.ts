// THINAI Recommendation Feedback Loop Service
// Recommendation -> Action -> Feedback -> Farm History

export interface ActionFeedback {
  id: string;
  recommendationId: string;
  recommendationTitle: string;
  category: string;
  actionTaken: "completed" | "skipped" | "in_progress";
  completedAt: string;
  wasHelpful: boolean;
  rating?: number; // 1 to 5 stars
  cropConditionObservation?: "Improved" | "Normal" | "Degraded" | "No Change";
  notes?: string;
  yieldImpactEstimate?: string;
  costSavedEstimate?: string;
}

const STORAGE_KEY = "thinai_recommendation_feedbacks";

export function getFeedbackHistory(): ActionFeedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordFeedback(feedback: Omit<ActionFeedback, "id" | "completedAt">): ActionFeedback {
  const history = getFeedbackHistory();
  const entry: ActionFeedback = {
    ...feedback,
    id: `fb-${Date.now()}`,
    completedAt: new Date().toISOString()
  };
  const updated = [entry, ...history];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to store feedback in localStorage", e);
  }
  return entry;
}

export function getCompletedActionIds(): string[] {
  const history = getFeedbackHistory();
  return history
    .filter(f => f.actionTaken === "completed")
    .map(f => f.recommendationId);
}
