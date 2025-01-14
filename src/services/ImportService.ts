import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/components/revolut-import/types";

export class ImportService {
  async saveTransactions(transactions: Transaction[], month: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: result, error } = await supabase.rpc('import_revolut_transactions', {
      p_transactions: transactions.map(t => ({
        amount: parseFloat(t.amount),
        category: t.category || 'Other',
        description: t.description,
        date: t.date,
        is_valid: t.isValid,
        invalid_reason: t.invalidReason,
        original_description: t.description
      })),
      p_month: month,
      p_user_id: user.id
    });

    if (error) {
      console.error("Error saving transactions:", error);
      throw new Error("Failed to save transactions");
    }

    return result;
  }

  async getImportHistory() {
    const { data, error } = await supabase
      .from('import_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching import history:", error);
      throw new Error("Failed to fetch import history");
    }

    return data;
  }

  async undoLastImport(importSessionId: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .match({ import_session_id: importSessionId });

    if (error) {
      console.error("Error undoing import:", error);
      throw new Error("Failed to undo import");
    }
  }
}

export const importService = new ImportService();