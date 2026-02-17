/**
 * Shared FAQ types - used by DB, API, and admin UI.
 */

export type FaqRow = {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  created_at: string;
};

export type FaqCreateInput = {
  question: string;
  answer: string;
  category?: string | null;
};

export type FaqUpdateInput = {
  question: string;
  answer: string;
  category?: string | null;
};
