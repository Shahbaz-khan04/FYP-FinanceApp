import { supabase } from '../db/supabase.js';
import { HttpError } from '../utils/httpError.js';

type RecommendationType =
  | 'reduce_overspending'
  | 'increase_budget'
  | 'increase_savings'
  | 'goal_prioritization';

type Recommendation = {
  id: string;
  type: RecommendationType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  reason: string;
  metrics: Record<string, number | string>;
};

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

const monthRange = (month: string) => {
  const [year, monthPart] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthPart - 1, 1));
  const end = new Date(Date.UTC(year, monthPart, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};

const shiftMonth = (month: string, delta: number) => {
  const [year, monthPart] = month.split('-').map(Number);
  const d = new Date(Date.UTC(year, monthPart - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const buildExpenseByCategory = (rows: any[]) => {
  const map = new Map<string, number>();
  for (const row of rows) {
    const categoryId = (row as any).category_id ?? 'uncategorized';
    map.set(categoryId, (map.get(categoryId) ?? 0) + Number((row as any).amount));
  }
  return map;
};

export const recommendationService = {
  async getRecommendations(userId: string, month?: string) {
    const db = requireDb();
    const selectedMonth = month ?? currentMonth();
    const lastMonths = [selectedMonth, shiftMonth(selectedMonth, -1), shiftMonth(selectedMonth, -2)];
    const allMonths = [...lastMonths, shiftMonth(selectedMonth, -3), shiftMonth(selectedMonth, -4), shiftMonth(selectedMonth, -5)];

    const startWindow = monthRange(allMonths[allMonths.length - 1]).start;
    const endWindow = monthRange(selectedMonth).end;

    const [{ data: txRows, error: txError }, { data: budgetRows, error: budgetError }, { data: goalRows, error: goalError }] =
      await Promise.all([
        db
          .from('transactions')
          .select('amount,type,category_id,date,categories(name)')
          .eq('user_id', userId)
          .gte('date', startWindow)
          .lte('date', endWindow),
        db
          .from('budgets')
          .select('month,planned_amount,category_id,categories(name)')
          .eq('user_id', userId)
          .in('month', lastMonths),
        db
          .from('goals')
          .select('id,title,target_amount,saved_amount,deadline,is_completed')
          .eq('user_id', userId)
          .order('deadline', { ascending: true }),
      ]);

    if (txError) throw new HttpError(500, 'RECOMMEND_TX_FAILED', 'Could not load transactions for recommendations');
    if (budgetError) throw new HttpError(500, 'RECOMMEND_BUDGET_FAILED', 'Could not load budgets for recommendations');
    if (goalError) throw new HttpError(500, 'RECOMMEND_GOAL_FAILED', 'Could not load goals for recommendations');

    const transactions = txRows ?? [];
    const budgets = budgetRows ?? [];
    const goals = goalRows ?? [];

    const recommendations: Recommendation[] = [];

    const monthExpenseByCategory = new Map<string, Map<string, { name: string; total: number }>>();
    const monthIncomeTotals = new Map<string, number>();
    for (const monthKey of allMonths) {
      monthExpenseByCategory.set(monthKey, new Map());
      monthIncomeTotals.set(monthKey, 0);
    }

    for (const row of transactions as any[]) {
      const monthKey = String(row.date).slice(0, 7);
      if (!monthExpenseByCategory.has(monthKey)) continue;
      const amount = Number(row.amount);
      if (row.type === 'income') {
        monthIncomeTotals.set(monthKey, (monthIncomeTotals.get(monthKey) ?? 0) + amount);
      } else {
        const categoryId = row.category_id ?? 'uncategorized';
        const categoryName = Array.isArray(row.categories) ? row.categories[0]?.name : row.categories?.name;
        const catMap = monthExpenseByCategory.get(monthKey)!;
        const existing = catMap.get(categoryId) ?? { name: categoryName ?? 'Uncategorized', total: 0 };
        existing.total += amount;
        catMap.set(categoryId, existing);
      }
    }

    const currentExpenseMap = monthExpenseByCategory.get(selectedMonth) ?? new Map();
    const prev3ExpenseRows = allMonths.slice(1, 4).flatMap((monthKey) => {
      const catMap = monthExpenseByCategory.get(monthKey) ?? new Map();
      return Array.from(catMap.entries()).map(([categoryId, value]) => ({ monthKey, categoryId, ...value }));
    });

    // 1) Overspent category reduce suggestion (and "x% higher than usual")
    for (const [categoryId, current] of currentExpenseMap.entries()) {
      const matches = prev3ExpenseRows.filter((row) => row.categoryId === categoryId);
      if (matches.length < 2) continue;
      const avg = matches.reduce((s, row) => s + row.total, 0) / matches.length;
      if (avg <= 0) continue;
      const ratio = current.total / avg;
      if (ratio >= 1.2) {
        const pct = (ratio - 1) * 100;
        recommendations.push({
          id: `reduce-${categoryId}`,
          type: 'reduce_overspending',
          priority: ratio >= 1.4 ? 'high' : 'medium',
          title: `${current.name} spending is ${pct.toFixed(0)}% higher than usual`,
          message: `Try reducing ${current.name} by ${(current.total - avg).toFixed(2)} next month.`,
          reason: `Current month ${current.total.toFixed(2)} vs 3-month average ${avg.toFixed(2)}.`,
          metrics: {
            category: current.name,
            currentSpend: Number(current.total.toFixed(2)),
            averageSpend: Number(avg.toFixed(2)),
            percentHigher: Number(pct.toFixed(1)),
          },
        });
      }
    }

    // 2) Consistently exceeded budgets for 3 months -> suggest budget increase
    const budgetByCategory = new Map<string, Array<{ month: string; planned: number; name: string }>>();
    for (const row of budgets as any[]) {
      const key = row.category_id ?? 'uncategorized';
      const name = Array.isArray(row.categories) ? row.categories[0]?.name : row.categories?.name;
      const list = budgetByCategory.get(key) ?? [];
      list.push({ month: row.month, planned: Number(row.planned_amount), name: name ?? 'Uncategorized' });
      budgetByCategory.set(key, list);
    }

    for (const [categoryId, rows] of budgetByCategory.entries()) {
      const rowsByMonth = new Map(rows.map((r) => [r.month, r]));
      if (!lastMonths.every((monthKey) => rowsByMonth.has(monthKey))) continue;
      let exceededAll = true;
      let totalPlanned = 0;
      let totalActual = 0;
      for (const monthKey of lastMonths) {
        const row = rowsByMonth.get(monthKey)!;
        const catSpend = monthExpenseByCategory.get(monthKey)?.get(categoryId)?.total ?? 0;
        totalPlanned += row.planned;
        totalActual += catSpend;
        if (catSpend <= row.planned) exceededAll = false;
      }
      if (!exceededAll) continue;
      const recommendedPlanned = totalActual / lastMonths.length;
      recommendations.push({
        id: `budget-${categoryId}`,
        type: 'increase_budget',
        priority: 'medium',
        title: `${rows[0].name} budget exceeded for 3 months`,
        message: `Consider increasing budget to around ${recommendedPlanned.toFixed(2)} for this category.`,
        reason: `3-month average actual ${recommendedPlanned.toFixed(2)} is above planned ${(totalPlanned / 3).toFixed(2)}.`,
        metrics: {
          category: rows[0].name,
          averageActual: Number(recommendedPlanned.toFixed(2)),
          averagePlanned: Number((totalPlanned / 3).toFixed(2)),
        },
      });
    }

    // 3) Suggest saving more if income increased
    const recentIncome = lastMonths.reduce((s, monthKey) => s + (monthIncomeTotals.get(monthKey) ?? 0), 0) / lastMonths.length;
    const prevIncomeMonths = [shiftMonth(selectedMonth, -3), shiftMonth(selectedMonth, -4), shiftMonth(selectedMonth, -5)];
    const previousIncome =
      prevIncomeMonths.reduce((s, monthKey) => s + (monthIncomeTotals.get(monthKey) ?? 0), 0) / prevIncomeMonths.length;
    if (previousIncome > 0 && recentIncome >= previousIncome * 1.1) {
      const delta = recentIncome - previousIncome;
      const suggestedExtra = recentIncome * 0.05;
      recommendations.push({
        id: 'save-more-income-rise',
        type: 'increase_savings',
        priority: 'medium',
        title: 'Income has increased recently',
        message: `You can save an extra ${suggestedExtra.toFixed(2)} monthly (5% of current average income).`,
        reason: `Recent 3-month avg income ${recentIncome.toFixed(2)} vs previous 3-month avg ${previousIncome.toFixed(2)}.`,
        metrics: {
          recentAverageIncome: Number(recentIncome.toFixed(2)),
          previousAverageIncome: Number(previousIncome.toFixed(2)),
          incomeIncrease: Number(delta.toFixed(2)),
          suggestedExtraSaving: Number(suggestedExtra.toFixed(2)),
        },
      });
    }

    // 4) Goal prioritization
    const openGoals = (goals as any[])
      .filter((goal) => !goal.is_completed && Number(goal.saved_amount) < Number(goal.target_amount))
      .map((goal) => {
        const target = Number(goal.target_amount);
        const saved = Number(goal.saved_amount);
        const remaining = Math.max(target - saved, 0);
        const progressPercent = target > 0 ? (saved / target) * 100 : 0;
        return {
          id: goal.id as string,
          title: goal.title as string,
          deadline: goal.deadline as string,
          remaining,
          progressPercent,
        };
      });

    if (openGoals.length > 0) {
      openGoals.sort((a, b) => a.deadline.localeCompare(b.deadline) || a.remaining - b.remaining);
      const top = openGoals[0];
      recommendations.push({
        id: `goal-priority-${top.id}`,
        type: 'goal_prioritization',
        priority: 'low',
        title: `Prioritize goal: ${top.title}`,
        message: `Focus this month on ${top.title}; remaining amount is ${top.remaining.toFixed(2)} with deadline ${top.deadline}.`,
        reason: `This goal has the nearest deadline among active goals.`,
        metrics: {
          goal: top.title,
          remainingAmount: Number(top.remaining.toFixed(2)),
          progressPercent: Number(top.progressPercent.toFixed(1)),
          deadline: top.deadline,
        },
      });
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return {
      month: selectedMonth,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  },
};
