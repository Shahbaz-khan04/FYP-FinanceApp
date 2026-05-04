export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type HelpQuestionItem = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'answered' | 'closed';
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
