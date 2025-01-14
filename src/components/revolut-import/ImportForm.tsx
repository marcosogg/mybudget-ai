import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionTable } from "./TransactionTable";
import { ImportSession, Transaction } from "./types";

interface ImportFormProps {
  transactions: Transaction[];
  importSession: ImportSession | null;
  isLoading: boolean;
  onImport: () => void;
  onCancel: () => void;
}

export const ImportForm = ({ 
  transactions, 
  importSession, 
  isLoading, 
  onImport, 
  onCancel 
}: ImportFormProps) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validTransactions = transactions.filter(t => t.is_valid);
  const invalidTransactions = transactions.filter(t => !t.is_valid);

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setError(null);

      if (invalidTransactions.length > 0) {
        const proceed = window.confirm(
          `There are ${invalidTransactions.length} invalid transactions. Do you want to proceed with importing only the valid transactions?`
        );
        if (!proceed) {
          setIsImporting(false);
          return;
        }
      }

      const { error: importError } = await supabase
        .from("transactions")
        .insert(validTransactions.map(t => ({
          amount: t.amount,
          category: t.category,
          description: t.description,
          date: t.date,
          type: t.type,
          original_description: t.original_description,
          import_session_id: importSession?.id
        })));

      if (importError) throw importError;

      toast({
        title: "Import Successful",
        description: `Successfully imported ${validTransactions.length} transactions.`,
      });

      onImport();
    } catch (err) {
      console.error("Import error:", err);
      setError(err instanceof Error ? err.message : "Failed to import transactions");
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "There was an error importing your transactions. Please try again.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-3/4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48" />
          <div className="flex justify-end space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-muted-foreground mb-4">
          <p>Total Transactions: {transactions.length}</p>
          <p>Valid Transactions: {validTransactions.length}</p>
          {invalidTransactions.length > 0 && (
            <p className="text-destructive">Invalid Transactions: {invalidTransactions.length}</p>
          )}
        </div>

        <TransactionTable transactions={transactions} />

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || validTransactions.length === 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Transactions'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};