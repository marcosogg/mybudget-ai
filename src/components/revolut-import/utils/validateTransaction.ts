import { Transaction } from "../types";
import { parse, isValid } from "date-fns";

export const validateTransaction = (transaction: any): Transaction => {
  const result: Transaction = {
    date: "",
    description: transaction.Description || "",
    amount: transaction.Amount?.toString() || "",
    category: transaction.Category || "Other",
    type: transaction.Type || "expense",
    isValid: true,
    original_description: transaction.Description || ""
  };

  // Validate and format date using date-fns
  if (!transaction["Completed Date"]) {
    result.isValid = false;
    result.invalidReason = "Missing completed date";
  } else {
    try {
      const parsedDate = parse(
        transaction["Completed Date"],
        'dd/MM/yyyy HH:mm',
        new Date()
      );

      if (!isValid(parsedDate)) {
        throw new Error("Invalid date format");
      }

      // Convert to YYYY-MM-DD format for database storage
      result.date = parsedDate.toISOString().split('T')[0];

    } catch (error) {
      result.isValid = false;
      result.invalidReason = "Invalid date format";
      console.error("Date parsing error:", error);
    }
  }

  // Validate amount
  if (!transaction.Amount || transaction.Amount.toString().trim() === "") {
    result.isValid = false;
    result.invalidReason = "Missing amount";
  } else {
    try {
      const amount = parseFloat(transaction.Amount.toString().replace(/[^-0-9.]/g, ''));
      if (isNaN(amount)) {
        throw new Error("Invalid amount format");
      }
      result.amount = amount.toString();
    } catch (error) {
      result.isValid = false;
      result.invalidReason = "Invalid amount format";
    }
  }

  // Validate description
  if (!transaction.Description || transaction.Description.trim().length === 0) {
    result.isValid = false;
    result.invalidReason = "Missing description";
  }

  // Map Revolut transaction types
  const typeMap: { [key: string]: string } = {
    'CARD_PAYMENT': 'expense',
    'TOPUP': 'income',
    'TRANSFER': transaction.Amount && parseFloat(transaction.Amount) > 0 ? 'income' : 'expense'
  };
  result.type = typeMap[transaction.Type] || 'expense';

  // Set category based on description or type
  if (!result.category) {
    result.category = 'Other';
  }

  return result;
};