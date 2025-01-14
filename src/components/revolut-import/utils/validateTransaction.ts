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
      const [datePart] = transaction["Completed Date"].split(" ");
      if (!datePart) {
        throw new Error("Invalid date format");
      }

      const [day, month, year] = datePart.split("/");
      
      // Validate date parts exist and are numbers
      if (!day || !month || !year || 
          isNaN(Number(day)) || isNaN(Number(month)) || isNaN(Number(year))) {
        throw new Error("Invalid date components");
      }

      // Validate ranges
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        throw new Error("Date values out of range");
      }

      // Convert to YYYY-MM-DD format
      const formattedDate = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      
      // Final validation using Date object
      const dateObj = new Date(formattedDate);
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date");
      }

      result.date = formattedDate;

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