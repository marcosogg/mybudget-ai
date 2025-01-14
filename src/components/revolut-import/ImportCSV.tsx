import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, XCircle } from "lucide-react";
import Papa from "papaparse";
import { Transaction } from "./types";
import { validateTransaction } from "./utils/validateTransaction";
import { TransactionTable } from "./TransactionTable";
import { importService } from "@/services/ImportService";

const ImportCSV = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const abortController = useRef<AbortController | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select a CSV file",
      });
      return;
    }

    setSelectedFile(file);
    setTransactions([]);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    abortController.current = new AbortController();

    try {
      Papa.parse(selectedFile, {
        complete: async (results) => {
          const validatedTransactions = results.data
            .filter((row: any) => Object.keys(row).length > 1)
            .map((row: any) => validateTransaction(row));

          setTransactions(validatedTransactions);
          
          try {
            await importService.saveTransactions(validatedTransactions, selectedMonth + "-01");
            
            const validCount = validatedTransactions.filter(t => t.isValid).length;
            toast({
              title: "Import successful",
              description: `${validCount} valid transactions imported out of ${validatedTransactions.length} total`,
            });

            // Clear form after successful import
            clearSelection();
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
      abortController.current = null;
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

  const clearSelection = () => {
    setSelectedFile(null);
    setTransactions([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

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
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month} value={month}>
                    {new Date(month + "-01").toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CSV File</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {selectedFile ? selectedFile.name : "Choose file"}
              </Button>
              {selectedFile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSelection}
                  className="shrink-0"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <Button
            onClick={handleImport}
            disabled={!selectedFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Import Transactions"}
          </Button>
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