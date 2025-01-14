import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Helper function to get the current month's date range
const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0],
  };
};

export const useCurrentMonthTransactions = () => {
  const { start, end } = getCurrentMonthRange();
  
  return useQuery({
    queryKey: ['transactions', 'current-month'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCurrentMonthBudgets = () => {
  const { start } = getCurrentMonthRange();
  
  return useQuery({
    queryKey: ['budgets', 'current-month'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', start);

      if (error) throw error;
      return data;
    },
  });
};

export const useFinancialGoals = () => {
  return useQuery({
    queryKey: ['financial-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};