import { useState } from "react";
import { Transaction } from "./types";
import { importService } from "@/services/ImportService";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Papa from "papaparse";
import { validateTransaction } from "./utils/validateTransaction";
import { TransactionTable } from "./TransactionTable";
import { ImportForm } from "./ImportForm";

const ImportCSV = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleImport = async (file: File, selectedMonth: string) => {
    setIsProcessing(true);

    try {
      Papa.parse(file, {
        complete: async (results) => {
          const validatedTransactions = results.data
            .filter((row: any) => Object.keys(row).length > 1)
            .map((row: any) => validateTransaction(row));

          setTransactions(validatedTransactions);
          
          try {
            const result = await importService.saveTransactions(validatedTransactions, selectedMonth);
            
            if (result.success) {
              const validCount = validatedTransactions.filter(t => t.isValid).length;
              toast({
                title: "Import successful",
                description: `${validCount} valid transactions imported out of ${validatedTransactions.length} total`,
              });
            } else {
              toast({
                variant: "destructive",
                title: "Import failed",
                description: result.message,
              });
            }
          } catch (error) {
            console.error("Import error:", error);
            toast({
              variant: "destructive",
              title: "Import failed",
              description: "Failed to save transactions. Please try again.",
            });
          }
        },
        error: (error) => {
          console.error("Parsing error:", error);
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
      toast({
        variant: "destructive",
        title: "Error importing file",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCategoryChange = (transactionIndex: number, newCategory: string) => {
    setTransactions(prev => 
      prev.map((transaction, index) => 
        index === transactionIndex 
          ? { ...transaction, category: newCategory }
          : transaction
      )
    );
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
          <ImportForm onImport={handleImport} isProcessing={isProcessing} />
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Preview</CardTitle>
            <CardDescription>
              Review your transactions before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionTable 
              transactions={transactions}
              onCategoryChange={handleCategoryChange}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportCSV;