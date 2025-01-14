export interface Transaction {
  date: string;
  description: string;
  amount: string;
  category?: string;
  isValid: boolean;
  invalidReason?: string;
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