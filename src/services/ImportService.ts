import { supabase } from "@/integrations/supabase/client";
import { Transaction, ImportSession } from "@/components/revolut-import/types";

interface ImportResult {
  success: boolean;
  message: string;
  importSessionId?: string;
}

interface ImportRPCResponse {
  success: boolean;
  import_session_id: string;
  total_count: number;
  valid_count: number;
}

export class ImportService {
  async saveTransactions(transactions: Transaction[], month: string): Promise<ImportResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Ensure month is in YYYY-MM format
    if (!month.match(/^\d{4}-\d{2}$/)) {
      throw new Error("Month must be in YYYY-MM format");
    }

    // Filter out invalid transactions
    const validTransactions = transactions.filter(t => t.isValid);
    
    if (validTransactions.length === 0) {
      throw new Error("No valid transactions to import");
    }

    // Convert transactions to plain objects that match the Json type
    const plainTransactions = validTransactions.map(t => {
      if (!t.date || t.date.trim() === "") {
        throw new Error("Invalid date: date cannot be empty");
      }

      return {
        amount: parseFloat(t.amount.replace(/[^-0-9.]/g, '')),
        category: t.category || 'Other',
        description: t.description,
        date: t.date, // Date is already validated and formatted in validateTransaction
        type: t.type || 'expense', // Use the original type from the CSV
        is_valid: t.isValid,
        invalid_reason: t.invalidReason,
        original_description: t.original_description
      };
    });

    // Call the database function with the month string (YYYY-MM format)
    const { data, error } = await supabase
      .rpc('import_revolut_transactions', {
        p_transactions: plainTransactions,
        p_month: month,
        p_user_id: user.id
      });

    if (error) {
      console.error("Error importing transactions:", error);
      return {
        success: false,
        message: error.message || "Failed to import transactions"
      };
    }

    // First cast to unknown, then to our specific type
    const response = data as unknown as ImportRPCResponse;

    return {
      success: true,
      message: `Successfully imported ${transactions.length} transactions`,
      importSessionId: response.import_session_id
    };
  }

  async getImportHistory(): Promise<ImportSession[]> {
    const { data, error } = await supabase
      .from('import_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching import history:", error);
      throw new Error("Failed to fetch import history");
    }

    // Ensure the status is properly typed
    return (data || []).map(session => ({
      ...session,
      status: session.status as 'completed' | 'failed'
    }));
  }

  async undoImport(importSessionId: string): Promise<void> {
    // First delete all transactions associated with this import
    const { error: transactionError } = await supabase
      .from('transactions')
      .delete()
      .match({ import_session_id: importSessionId });

    if (transactionError) {
      console.error("Error deleting transactions:", transactionError);
      throw new Error("Failed to delete transactions");
    }

    // Then delete the import session
    const { error: sessionError } = await supabase
      .from('import_sessions')
      .delete()
      .match({ id: importSessionId });

    if (sessionError) {
      console.error("Error deleting import session:", sessionError);
      throw new Error("Failed to delete import session");
    }
  }
}

export const importService = new ImportService();