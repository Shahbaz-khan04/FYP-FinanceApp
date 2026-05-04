export type Faq = {
  id: string;
  question: string;
  answer: string;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type HelpQuestion = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'answered' | 'closed';
  response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};
