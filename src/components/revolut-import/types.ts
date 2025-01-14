export interface Transaction {
  date: string;
  description: string;
  amount: string;
  category?: string;
  isValid: boolean;
  invalidReason?: string;
  type: string;
  original_description?: string;
}

export interface ImportSession {
  id: string;
  user_id: string;
  month: string;
  transaction_count: number;
  valid_transaction_count: number;
  status: 'completed' | 'failed';
  created_at?: string;
}

export const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health & Fitness",
  "Travel",
  "Other",
] as const;