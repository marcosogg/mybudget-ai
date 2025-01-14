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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, XCircle } from "lucide-react";
import Papa from "papaparse";

interface Transaction {
  date: string;
  description: string;
  amount: string;
  category?: string;
  isValid: boolean;
  invalidReason?: string;
}

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health & Fitness",
  "Travel",
  "Other",
] as const;

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

  const validateTransaction = (transaction: any): Transaction => {
    const result: Transaction = {
      date: transaction.Date || transaction.date || "",
      description: transaction.Description || transaction.description || "",
      amount: transaction.Amount || transaction.amount || "",
      category: transaction.Category || transaction.category || "Other",
      isValid: true,
    };

    // Validate date
    if (!result.date || isNaN(Date.parse(result.date))) {
      result.isValid = false;
      result.invalidReason = "Invalid date format";
    }

    // Validate amount
    const amount = parseFloat(result.amount);
    if (isNaN(amount)) {
      result.isValid = false;
      result.invalidReason = "Invalid amount format";
    }

    // Validate description
    if (!result.description || result.description.trim().length === 0) {
      result.isValid = false;
      result.invalidReason = "Missing description";
    }

    return result;
  };

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
        complete: (results) => {
          const validatedTransactions = results.data
            .filter((row: any) => Object.keys(row).length > 1)
            .map((row: any) => validateTransaction(row));

          setTransactions(validatedTransactions);
          
          const validCount = validatedTransactions.filter(t => t.isValid).length;
          toast({
            title: "File processed successfully",
            description: `${validCount} valid transactions found out of ${validatedTransactions.length} total`,
          });
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
            <div className="rounded-md border">
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
                    <TableRow
                      key={index}
                      className={transaction.isValid ? "" : "opacity-60"}
                    >
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                      <TableCell>
                        <Select
                          value={transaction.category}
                          onValueChange={(value) => handleCategoryChange(index, value)}
                          disabled={!transaction.isValid}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {transaction.isValid ? (
                          <span className="text-green-600">Valid</span>
                        ) : (
                          <span className="text-red-600">
                            {transaction.invalidReason}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportCSV;