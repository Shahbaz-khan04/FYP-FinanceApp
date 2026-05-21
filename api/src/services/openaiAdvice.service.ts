import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

type AdviceInput = {
  month: string;
  preferredCurrency: string;
  rulesBasedRecommendations: Array<{
    id: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    reason: string;
    metrics: Record<string, number | string>;
  }>;
};

type AdviceOutput = {
  summary: string;
  recommendations: Array<{
    title: string;
    message: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
};

const systemPrompt = `You are a financial coach for a mobile budgeting app.
Return ONLY valid JSON.
Keep advice practical, concrete, short, and non-judgmental.
Do not mention being an AI.
JSON shape:
{
  "summary": "string",
  "recommendations": [
    {
      "title": "string",
      "message": "string",
      "action": "string",
      "priority": "high|medium|low"
    }
  ]
}`;

const safeParse = (value: string): AdviceOutput => {
  try {
    const parsed = JSON.parse(value) as AdviceOutput;
    if (!parsed || typeof parsed.summary !== 'string' || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid format');
    }
    const recommendations: AdviceOutput['recommendations'] = parsed.recommendations
      .filter((r) => r && typeof r.title === 'string' && typeof r.message === 'string' && typeof r.action === 'string')
      .map((r) => ({
        title: r.title.trim(),
        message: r.message.trim(),
        action: r.action.trim(),
        priority: (r.priority === 'high' || r.priority === 'medium' ? r.priority : 'low') as
          | 'high'
          | 'medium'
          | 'low',
      }))
      .slice(0, 6);
    return {
      summary: parsed.summary.trim(),
      recommendations,
    };
  } catch {
    throw new HttpError(502, 'LLM_PARSE_FAILED', 'LLM response could not be parsed');
  }
};

export const openaiAdviceService = {
  async generatePersonalizedAdvice(input: AdviceInput) {
    if (!env.OPENAI_API_KEY) {
      throw new HttpError(500, 'LLM_NOT_CONFIGURED', 'OPENAI_API_KEY is not configured');
    }

    const userPrompt = JSON.stringify(
      {
        month: input.month,
        preferredCurrency: input.preferredCurrency,
        recommendations: input.rulesBasedRecommendations,
      },
      null,
      2,
    );

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new HttpError(502, 'LLM_REQUEST_FAILED', `OpenAI request failed (${response.status})`);
    }

    const data = (await response.json()) as any;
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new HttpError(502, 'LLM_EMPTY_RESPONSE', 'LLM returned an empty response');
    }

    return safeParse(content);
  },
};
