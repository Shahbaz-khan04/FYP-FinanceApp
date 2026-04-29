export interface Transaction {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface BudgetItem {
  id: string;
  category: string;
  limit: number;
  spent: number;
  color: string;
}

export const financeSummary = {
  balance: 12480.75,
  income: 8450,
  expenses: 3960,
  savingsRate: 36,
};

export const quickInsights = [
  { id: '1', label: 'Recurring Bills', value: '$1,180', hint: 'Due in 7 days' },
  { id: '2', label: 'Top Category', value: 'Operations', hint: '28% of spending' },
  { id: '3', label: 'Cash Runway', value: '5.3 months', hint: 'Current burn rate' },
];

export const transactions: Transaction[] = [
  {
    id: '1',
    title: 'Client Retainer - Nova Labs',
    category: 'Income',
    date: 'Apr 20, 2026',
    amount: 3200,
    type: 'income',
  },
  {
    id: '2',
    title: 'Office Rent',
    category: 'Fixed Cost',
    date: 'Apr 19, 2026',
    amount: 840,
    type: 'expense',
  },
  {
    id: '3',
    title: 'Design Software Subscription',
    category: 'Tools',
    date: 'Apr 17, 2026',
    amount: 74,
    type: 'expense',
  },
  {
    id: '4',
    title: 'Consulting Session',
    category: 'Income',
    date: 'Apr 15, 2026',
    amount: 950,
    type: 'income',
  },
  {
    id: '5',
    title: 'Team Dinner',
    category: 'Lifestyle',
    date: 'Apr 13, 2026',
    amount: 126,
    type: 'expense',
  },
];

export const budgets: BudgetItem[] = [
  { id: '1', category: 'Operations', limit: 1800, spent: 1290, color: '#1B4332' },
  { id: '2', category: 'Marketing', limit: 1100, spent: 760, color: '#506354' },
  { id: '3', category: 'Lifestyle', limit: 650, spent: 430, color: '#8BA795' },
  { id: '4', category: 'Learning', limit: 400, spent: 358, color: '#362202' },
];

export const monthlyTrend = [
  { month: 'Jan', value: 2400 },
  { month: 'Feb', value: 2750 },
  { month: 'Mar', value: 2610 },
  { month: 'Apr', value: 3120 },
  { month: 'May', value: 2980 },
  { month: 'Jun', value: 3340 },
];

export const spendingSplit = [
  { id: '1', label: 'Operations', percentage: 42, color: '#1B4332' },
  { id: '2', label: 'Personal', percentage: 23, color: '#506354' },
  { id: '3', label: 'Tools', percentage: 19, color: '#89AFC9' },
  { id: '4', label: 'Learning', percentage: 16, color: '#362202' },
];

export const helpTopics = [
  {
    id: '1',
    title: 'How budgets work in demo mode',
    description: 'Budget values are simulated to represent dynamic monthly tracking behavior.',
  },
  {
    id: '2',
    title: 'Why transactions are sample data',
    description: 'This FYP milestone focuses on frontend validation and interaction design only.',
  },
  {
    id: '3',
    title: 'What comes next',
    description: 'Future phases can connect OCR, predictive insights, and secure account modules.',
  },
];
