import { Transaction } from "../types";

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

  // Validate and format date (use Completed Date from Revolut CSV)
  if (!transaction["Completed Date"]) {
    result.isValid = false;
    result.invalidReason = "Missing completed date";
  } else {
    try {
      // Parse DD/MM/YYYY HH:mm format
      const [datePart, timePart] = transaction["Completed Date"].split(" ");
      const [day, month, year] = datePart.split("/");
      
      // Validate date parts
      if (!day || !month || !year || 
          isNaN(Number(day)) || isNaN(Number(month)) || isNaN(Number(year))) {
        throw new Error("Invalid date format");
      }

      // Convert to YYYY-MM-DD format (what PostgreSQL expects)
      result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      // Validate the date is real
      const dateObj = new Date(result.date);
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date");
      }
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