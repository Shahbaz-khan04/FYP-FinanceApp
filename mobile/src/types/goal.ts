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

