import { useQuery } from "@tanstack/react-query";
import { Transaction } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

interface DetailedImportViewProps {
  importId: string;
}

export const DetailedImportView = ({ importId }: DetailedImportViewProps) => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['importTransactions', importId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('import_session_id', importId)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Map the database fields to our Transaction interface
      return (data || []).map((t): Transaction => ({
        date: t.date,
        description: t.description || '',
        amount: t.amount.toString(),
        category: t.category,
        isValid: t.is_valid,
        invalidReason: t.invalid_reason,
        type: t.type as 'income' | 'expense',
        original_description: t.original_description
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found for this import
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-y-auto max-h-[calc(100vh-200px)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow key={index}>
              <TableCell>
                {format(new Date(transaction.date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {transaction.description || transaction.original_description}
              </TableCell>
              <TableCell>
                <span className={transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                  {transaction.type === 'expense' ? '-' : '+'}${Math.abs(Number(transaction.amount)).toFixed(2)}
                </span>
              </TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  {transaction.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  {transaction.isValid ? 'Valid' : transaction.invalidReason}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};