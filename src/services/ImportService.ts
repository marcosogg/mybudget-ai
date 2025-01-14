import { supabase } from "@/integrations/supabase/client";
import { Transaction, ImportSession } from "@/components/revolut-import/types";

interface ImportResult {
  success: boolean;
  message: string;
  importSessionId?: string;
}

export class ImportService {
  async saveTransactions(transactions: Transaction[], month: string): Promise<ImportResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Start by creating an import session
    const { data: importSession, error: sessionError } = await supabase
      .from('import_sessions')
      .insert({
        user_id: user.id,
        month: month,
        transaction_count: transactions.length,
        valid_transaction_count: transactions.filter(t => t.isValid).length,
        status: 'completed'
      })
      .select()
      .single();

    if (sessionError || !importSession) {
      console.error("Error creating import session:", sessionError);
      return {
        success: false,
        message: "Failed to create import session"
      };
    }

    // Prepare transactions for database insertion
    const dbTransactions = transactions.map(t => ({
      user_id: user.id,
      amount: parseFloat(t.amount),
      category: t.category || 'Other',
      description: t.description,
      date: t.date,
      type: parseFloat(t.amount) >= 0 ? 'income' : 'expense',
      import_session_id: importSession.id,
      original_description: t.description,
      is_valid: t.isValid,
      invalid_reason: t.invalidReason
    }));

    // Insert all transactions
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert(dbTransactions);

    if (transactionError) {
      console.error("Error saving transactions:", transactionError);
      
      // Update import session status to failed
      await supabase
        .from('import_sessions')
        .update({ status: 'failed' })
        .eq('id', importSession.id);

      return {
        success: false,
        message: "Failed to save transactions"
      };
    }

    return {
      success: true,
      message: `Successfully imported ${transactions.length} transactions`,
      importSessionId: importSession.id
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

    return data || [];
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