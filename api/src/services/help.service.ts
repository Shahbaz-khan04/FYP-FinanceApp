import { randomUUID } from 'node:crypto';
import { supabase } from '../db/supabase.js';
import type { Faq, HelpQuestion } from '../types/help.js';
import { HttpError } from '../utils/httpError.js';

const requireDb = () => {
  if (!supabase) {
    throw new HttpError(500, 'DB_NOT_CONFIGURED', 'Supabase is not configured');
  }
  return supabase;
};

export const helpService = {
  async listFaqs(search?: string) {
    const db = requireDb();
    let query = db.from('faqs').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (search?.trim()) {
      const q = search.trim();
      query = query.or(`question.ilike.%${q}%,answer.ilike.%${q}%`);
    }

    const { data, error } = await query.returns<Faq[]>();
    if (error) {
      throw new HttpError(500, 'FAQ_READ_FAILED', 'Could not fetch FAQs');
    }

    return (data ?? []).map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      tags: faq.tags ?? [],
      createdAt: faq.created_at,
      updatedAt: faq.updated_at,
    }));
  },

  async getFaqById(faqId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('faqs')
      .select('*')
      .eq('id', faqId)
      .eq('is_active', true)
      .maybeSingle<Faq>();
    if (error) {
      throw new HttpError(500, 'FAQ_READ_FAILED', 'Could not fetch FAQ');
    }
    if (!data) {
      throw new HttpError(404, 'FAQ_NOT_FOUND', 'FAQ not found');
    }

    return {
      id: data.id,
      question: data.question,
      answer: data.answer,
      tags: data.tags ?? [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async submitQuestion(userId: string, payload: { subject: string; message: string }) {
    const db = requireDb();
    const now = new Date().toISOString();
    const { data, error } = await db
      .from('help_questions')
      .insert({
        id: randomUUID(),
        user_id: userId,
        subject: payload.subject,
        message: payload.message,
        status: 'open',
        response: null,
        responded_at: null,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single<HelpQuestion>();

    if (error || !data) {
      throw new HttpError(500, 'HELP_QUESTION_CREATE_FAILED', 'Could not submit help question');
    }

    return this.mapQuestion(data);
  },

  async listMyQuestions(userId: string) {
    const db = requireDb();
    const { data, error } = await db
      .from('help_questions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<HelpQuestion[]>();

    if (error) {
      throw new HttpError(500, 'HELP_QUESTION_READ_FAILED', 'Could not fetch your questions');
    }

    return (data ?? []).map((row) => this.mapQuestion(row));
  },

  mapQuestion(row: HelpQuestion) {
    return {
      id: row.id,
      userId: row.user_id,
      subject: row.subject,
      message: row.message,
      status: row.status,
      response: row.response,
      respondedAt: row.responded_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};
