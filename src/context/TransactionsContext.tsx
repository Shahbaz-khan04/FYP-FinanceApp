import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type TransactionType = 'expense' | 'income';

export type LedgerTransaction = {
  id: string;
  merchant: string;
  category: string;
  date: string;
  time: string;
  currency: string;
  amount: number;
  note: string;
  type: TransactionType;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  tags: string[];
  recurring: boolean;
};

export type NewTransactionInput = {
  merchant: string;
  category: string;
  date: string;
  currency: string;
  amount: number;
  type: TransactionType;
  tags: string[];
  recurring: boolean;
};

const palette = {
  gold: '#FFDCA8',
  mint: '#CFF1D9',
  aqua: '#BFF1D9',
  chip: '#E3E5DF',
};

const categoryVisuals: Record<string, { icon: keyof typeof Ionicons.glyphMap; tint: string; note: string }> = {
  'Dining & Living': { icon: 'restaurant', tint: palette.gold, note: 'Dining Ledger' },
  Gastronomy: { icon: 'restaurant', tint: palette.gold, note: 'Business Lunch' },
  Lifestyle: { icon: 'bag-handle', tint: palette.mint, note: 'Curated Apparel' },
  Income: { icon: 'arrow-down', tint: '#DFF7E8', note: 'Recorded Income' },
  Utilities: { icon: 'flash', tint: palette.chip, note: 'Residential Main' },
  Transit: { icon: 'car', tint: palette.aqua, note: 'Premium Refuel' },
  Software: { icon: 'desktop', tint: '#E8ECE7', note: 'Design Tools' },
  Travel: { icon: 'airplane', tint: '#DBE8F0', note: 'Travel Spend' },
  Shopping: { icon: 'bag-handle', tint: palette.mint, note: 'Retail Purchase' },
};

const initialTransactions: LedgerTransaction[] = [
  {
    id: 'tx-001',
    merchant: 'The Gilded Fork',
    category: 'Gastronomy',
    date: 'Today',
    time: '12:45 PM',
    currency: 'USD',
    amount: 184.2,
    note: 'Business Lunch',
    type: 'expense',
    icon: 'restaurant',
    tint: palette.gold,
    tags: ['Client dinner', 'BusinessTrip'],
    recurring: true,
  },
  {
    id: 'tx-002',
    merchant: 'Harrods Knightsbridge',
    category: 'Lifestyle',
    date: 'Today',
    time: '10:15 AM',
    currency: 'GBP',
    amount: 2450,
    note: 'Curated Apparel',
    type: 'expense',
    icon: 'bag-handle',
    tint: palette.mint,
    tags: ['Luxury', 'Personal'],
    recurring: false,
  },
  {
    id: 'tx-003',
    merchant: 'Client Retainer',
    category: 'Income',
    date: 'Today',
    time: '09:20 AM',
    currency: 'USD',
    amount: 5200,
    note: 'Nova Labs Project',
    type: 'income',
    icon: 'arrow-down',
    tint: '#DFF7E8',
    tags: ['Income', 'NovaLabs'],
    recurring: true,
  },
  {
    id: 'tx-004',
    merchant: 'Edison Electric',
    category: 'Utilities',
    date: 'Yesterday',
    time: '04:30 PM',
    currency: 'USD',
    amount: 342.15,
    note: 'Residential Main',
    type: 'expense',
    icon: 'flash',
    tint: palette.chip,
    tags: ['Utilities', 'Home'],
    recurring: true,
  },
  {
    id: 'tx-005',
    merchant: 'Shell Signature',
    category: 'Transit',
    date: 'Yesterday',
    time: '09:00 AM',
    currency: 'USD',
    amount: 120,
    note: 'Premium Refuel',
    type: 'expense',
    icon: 'car',
    tint: palette.aqua,
    tags: ['Transit', 'Vehicle'],
    recurring: false,
  },
  {
    id: 'tx-006',
    merchant: 'Figma Professional',
    category: 'Software',
    date: 'Apr 22',
    time: '02:18 PM',
    currency: 'USD',
    amount: 72,
    note: 'Design Tools',
    type: 'expense',
    icon: 'desktop',
    tint: '#E8ECE7',
    tags: ['Software', 'Work'],
    recurring: true,
  },
  {
    id: 'tx-007',
    merchant: 'Consulting Session',
    category: 'Income',
    date: 'Apr 21',
    time: '11:00 AM',
    currency: 'EUR',
    amount: 950,
    note: 'Strategy Workshop',
    type: 'income',
    icon: 'briefcase',
    tint: '#DFF7E8',
    tags: ['Income', 'Consulting'],
    recurring: false,
  },
];

type TransactionsContextValue = {
  transactions: LedgerTransaction[];
  addTransaction: (input: NewTransactionInput) => LedgerTransaction;
  getTransactionById: (id: string) => LedgerTransaction | undefined;
};

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState(initialTransactions);

  const value = useMemo<TransactionsContextValue>(() => {
    function addTransaction(input: NewTransactionInput) {
      const visual = categoryVisuals[input.category] ?? categoryVisuals.Shopping;
      const now = new Date();
      const created: LedgerTransaction = {
        id: `tx-${now.getTime()}`,
        merchant: input.merchant,
        category: input.type === 'income' ? 'Income' : input.category,
        date: 'Today',
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        currency: input.currency,
        amount: input.amount,
        note: visual.note,
        type: input.type,
        icon: input.type === 'income' ? 'arrow-down' : visual.icon,
        tint: input.type === 'income' ? '#DFF7E8' : visual.tint,
        tags: input.tags,
        recurring: input.recurring,
      };

      setTransactions((current) => [created, ...current]);
      return created;
    }

    function getTransactionById(id: string) {
      return transactions.find((transaction) => transaction.id === id);
    }

    return { transactions, addTransaction, getTransactionById };
  }, [transactions]);

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const context = useContext(TransactionsContext);

  if (!context) {
    throw new Error('useTransactions must be used within TransactionsProvider');
  }

  return context;
}
