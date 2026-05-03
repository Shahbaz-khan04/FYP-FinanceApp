import { randomUUID } from 'node:crypto';
import { supabase } from '../db/supabase.js';
import type { Goal } from '../types/goal.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

const toGoalView = (goal: Goal) => {
  const target = Number(goal.target_amount);
  const saved = Number(goal.saved_amount);
  const progressPercent = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  const remainingAmount = Math.max(target - saved, 0);

  return {
    id: goal.id,
    title: goal.title,
    targetAmount: target,
    savedAmount: saved,
    remainingAmount,
    deadline: goal.deadline,
    isCompleted: goal.is_completed || saved >= target,
    progressPercent,
    createdAt: goal.created_at,
    updatedAt: goal.updated_at,
  };
};

export const goalService = {
  async listGoals(userId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('is_completed', { ascending: true })
      .order('deadline', { ascending: true })
      .returns<Goal[]>();

    if (error) {
      throw new HttpError(500, 'GOAL_READ_FAILED', 'Could not load goals');
    }

    return (data ?? []).map(toGoalView);
  },

  async createGoal(
    userId: string,
    payload: { title: string; targetAmount: number; savedAmount: number; deadline: string },
  ) {
    const db = requireDb();
    const now = new Date().toISOString();
    const isCompleted = payload.savedAmount >= payload.targetAmount;

    const { data, error } = await db
      .from('goals')
      .insert({
        id: randomUUID(),
        user_id: userId,
        title: payload.title,
        target_amount: payload.targetAmount,
        saved_amount: payload.savedAmount,
        deadline: payload.deadline,
        is_completed: isCompleted,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single<Goal>();

    if (error || !data) {
      throw new HttpError(500, 'GOAL_CREATE_FAILED', 'Could not create goal');
    }

    return toGoalView(data);
  },

  async updateGoal(
    userId: string,
    goalId: string,
    payload: {
      title?: string;
      targetAmount?: number;
      savedAmount?: number;
      deadline?: string;
      isCompleted?: boolean;
    },
  ) {
    const db = requireDb();
    const existing = await this.getGoalById(userId, goalId);
    if (!existing) {
      throw new HttpError(404, 'GOAL_NOT_FOUND', 'Goal not found');
    }

    const targetAmount = payload.targetAmount ?? Number(existing.target_amount);
    const savedAmount = payload.savedAmount ?? Number(existing.saved_amount);
    const isCompleted = payload.isCompleted ?? savedAmount >= targetAmount;

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      is_completed: isCompleted,
    };
    if (payload.title !== undefined) patch.title = payload.title;
    if (payload.targetAmount !== undefined) patch.target_amount = payload.targetAmount;
    if (payload.savedAmount !== undefined) patch.saved_amount = payload.savedAmount;
    if (payload.deadline !== undefined) patch.deadline = payload.deadline;

    const { data, error } = await db
      .from('goals')
      .update(patch)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select('*')
      .single<Goal>();

    if (error || !data) {
      throw new HttpError(500, 'GOAL_UPDATE_FAILED', 'Could not update goal');
    }

    return toGoalView(data);
  },

  async deleteGoal(userId: string, goalId: string) {
    const db = requireDb();
    const { error } = await db.from('goals').delete().eq('id', goalId).eq('user_id', userId);
    if (error) {
      throw new HttpError(500, 'GOAL_DELETE_FAILED', 'Could not delete goal');
    }
  },

  async getProgressSummary(userId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('goals')
      .select('target_amount,saved_amount,is_completed')
      .eq('user_id', userId);

    if (error) {
      throw new HttpError(500, 'GOAL_PROGRESS_FAILED', 'Could not load goal progress');
    }

    const goals = data ?? [];
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g: any) => g.is_completed || Number(g.saved_amount) >= Number(g.target_amount)).length;
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    return { totalGoals, completedGoals, completionRate };
  },

  async getGoalById(userId: string, goalId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .maybeSingle<Goal>();

    if (error) {
      throw new HttpError(500, 'GOAL_READ_FAILED', 'Could not load goal');
    }
    return data;
  },
};

