import { Transaction } from "../types";

export const validateTransaction = (transaction: any): Transaction => {
  const result: Transaction = {
    date: transaction.Date || transaction.date || "",
    description: transaction.Description || transaction.description || "",
    amount: transaction.Amount || transaction.amount || "",
    category: transaction.Category || transaction.category || "Other",
    type: transaction.Type || transaction.type || "expense",
    isValid: true,
    original_description: transaction.Description || transaction.description || ""
  };

  // Validate date - handle different date formats
  if (!result.date || result.date.trim() === "") {
    result.isValid = false;
    result.invalidReason = "Missing date";
  } else {
    try {
      // Try to parse the date - Revolut uses DD/MM/YYYY format
      const dateParts = result.date.split('/');
      if (dateParts.length === 3) {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = dateParts;
        result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        // Try parsing as ISO date (YYYY-MM-DD)
        const isoDate = new Date(result.date);
        if (isNaN(isoDate.getTime())) {
          throw new Error("Invalid date format");
        }
        result.date = isoDate.toISOString().split('T')[0];
      }
    } catch (error) {
      result.isValid = false;
      result.invalidReason = "Invalid date format";
    }
  }

  // Validate amount
  if (!result.amount || result.amount.trim() === "") {
    result.isValid = false;
    result.invalidReason = "Missing amount";
  } else {
    const amount = parseFloat(result.amount.replace(/[^-0-9.]/g, ''));
    if (isNaN(amount)) {
      result.isValid = false;
      result.invalidReason = "Invalid amount format";
    }
  }

  // Validate description
  if (!result.description || result.description.trim().length === 0) {
    result.isValid = false;
    result.invalidReason = "Missing description";
  }

  // Store original type from CSV
  if (!result.type) {
    result.type = parseFloat(result.amount) >= 0 ? "income" : "expense";
  }

  return result;
};