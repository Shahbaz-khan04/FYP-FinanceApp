import { apiClient } from './apiClient';
import type { FaqItem, HelpQuestionItem } from '../types/help';

export const helpApi = {
  async listFaqs(search?: string) {
    const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const response = await apiClient<{ data: FaqItem[]; error: null }>(`/help/faqs${query}`, {
      method: 'GET',
    });
    return response.data;
  },

  async getFaqById(faqId: string) {
    const response = await apiClient<{ data: FaqItem; error: null }>(`/help/faqs/${faqId}`, {
      method: 'GET',
    });
    return response.data;
  },

  async submitQuestion(token: string, payload: { subject: string; message: string }) {
    const response = await apiClient<{ data: HelpQuestionItem; error: null }>('/help/questions', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  async listMyQuestions(token: string) {
    const response = await apiClient<{ data: HelpQuestionItem[]; error: null }>('/help/questions/me', {
      method: 'GET',
      token,
    });
    return response.data;
  },
};
