import { useState } from "react";
import { Transaction } from "./types";
import { importService } from "@/services/ImportService";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { validateTransaction } from "./utils/validateTransaction";
import { ImportForm } from "./ImportForm";
import ImportHistory from "./ImportHistory";

const ImportCSV = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (file: File, selectedMonth: string) => {
    if (!file || !selectedMonth) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please select a file and month to import.",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit");
      }

      Papa.parse(file, {
        complete: async (results) => {
          try {
            if (results.errors.length > 0) {
              throw new Error(`CSV parsing error: ${results.errors[0].message}`);
            }

            const validatedTransactions = results.data
              .filter((row: any) => Object.keys(row).length > 1)
              .map((row: any) => validateTransaction(row));

            if (validatedTransactions.length === 0) {
              throw new Error("No valid transactions found in the file");
            }

            setTransactions(validatedTransactions);
            
            try {
              const result = await importService.saveTransactions(validatedTransactions, selectedMonth);
              
              if (result.success) {
                // Invalidate and refetch all relevant queries
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ['transactions'] }),
                  queryClient.invalidateQueries({ queryKey: ['budgets'] }),
                  queryClient.invalidateQueries({ queryKey: ['financial-goals'] }),
                  queryClient.invalidateQueries({ queryKey: ['import-history'] })
                ]);

                const validCount = validatedTransactions.filter(t => t.isValid).length;
                const invalidCount = validatedTransactions.length - validCount;
                
                toast({
                  title: "Import successful",
                  description: `${validCount} valid transactions imported${invalidCount > 0 ? `, ${invalidCount} invalid transactions skipped` : ''}`,
                });

                // Clear transactions after successful import
                setTransactions([]);

                if (invalidCount > 0) {
                  setError(`${invalidCount} transactions were invalid. Please review the highlighted rows.`);
                }
              } else {
                throw new Error(result.message || "Failed to save transactions");
              }
            } catch (error) {
              console.error("Import error:", error);
              throw new Error("Failed to save transactions. Please try again.");
            }
          } catch (error) {
            setError(error instanceof Error ? error.message : "An unexpected error occurred");
            toast({
              variant: "destructive",
              title: "Import failed",
              description: error instanceof Error ? error.message : "An unexpected error occurred",
            });
          }
        },
        error: (error) => {
          console.error("Parsing error:", error);
          setError(`Failed to parse CSV file: ${error.message}`);
          toast({
            variant: "destructive",
            title: "Error processing file",
            description: error.message,
          });
        },
        header: true,
        skipEmptyLines: true,
      });
    } catch (error) {
      console.error("Import error:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
      toast({
        variant: "destructive",
        title: "Error importing file",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Import Revolut Transactions</CardTitle>
          <CardDescription>
            Select a CSV file exported from Revolut to import your transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <ImportForm 
            transactions={transactions}
            importSession={null}
            isLoading={isProcessing}
            onImport={handleImport}
            onCancel={() => setTransactions([])}
          />
        </CardContent>
      </Card>

      <ImportHistory />
    </div>
  );
};

export default ImportCSV;