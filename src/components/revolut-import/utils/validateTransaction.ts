import { Transaction } from "../types";

export const validateTransaction = (transaction: any): Transaction => {
  const result: Transaction = {
    date: transaction.Date || transaction.date || "",
    description: transaction.Description || transaction.description || "",
    amount: transaction.Amount || transaction.amount || "",
    category: transaction.Category || transaction.category || "Other",
    isValid: true,
  };

  // Validate date
  if (!result.date || isNaN(Date.parse(result.date))) {
    result.isValid = false;
    result.invalidReason = "Invalid date format";
  }

  // Validate amount
  const amount = parseFloat(result.amount);
  if (isNaN(amount)) {
    result.isValid = false;
    result.invalidReason = "Invalid amount format";
  }

  // Validate description
  if (!result.description || result.description.trim().length === 0) {
    result.isValid = false;
    result.invalidReason = "Missing description";
  }

  return result;
};