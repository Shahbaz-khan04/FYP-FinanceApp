export type GoalItem = {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  remainingAmount: number;
  deadline: string;
  isCompleted: boolean;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
};

export type GoalPayload = {
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
};

export type GoalPriorityItem = {
  rank: number;
  goalId: string;
  title: string;
  deadline: string;
  daysRemaining: number;
  progressPercent: number;
  remainingAmount: number;
  targetAmount: number;
  suggestedMonthlyContribution: number;
  priority: 'high' | 'medium' | 'low';
  priorityScore: number;
  reason: string;
};

export type GoalPrioritySummary = {
  generatedAt: string;
  focusGoal: GoalPriorityItem | null;
  goals: GoalPriorityItem[];
};
