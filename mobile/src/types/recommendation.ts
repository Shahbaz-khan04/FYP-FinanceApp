export type RecommendationItem = {
  id: string;
  type: 'reduce_overspending' | 'increase_budget' | 'increase_savings' | 'goal_prioritization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  reason: string;
  metrics: Record<string, number | string>;
};

export type RecommendationSummary = {
  month: string;
  recommendations: RecommendationItem[];
  generatedAt: string;
};

export type AiRecommendationItem = {
  title: string;
  message: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
};

export type AiRecommendationSummary = {
  month: string;
  model: string;
  source: 'cache' | 'fresh';
  generatedAt: string;
  summary: string;
  recommendations: AiRecommendationItem[];
};
