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
      // Default initial mock history to demonstrate loop
      return [
        {
          id: "fb-1",
          recommendationId: "soil_compost_addition",
          recommendationTitle: "Apply 2t/ha Farmyard Manure to Boost Organic Carbon",
          category: "Fertilizer",
          actionTaken: "completed",
          completedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          wasHelpful: true,
          rating: 5,
          cropConditionObservation: "Improved",
          notes: "Applied well-decomposed FYM before field preparation. Soil moisture retention visibly improved.",
          costSavedEstimate: "₹850"
        }
      ];
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
