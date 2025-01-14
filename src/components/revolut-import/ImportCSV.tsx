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

interface Transaction {
  date: string;
  description: string;
  amount: string;
  category?: string;
  isValid: boolean;
  invalidReason?: string;
}

const ImportCSV = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM format
  const [isProcessing, setIsProcessing] = useState(false);

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
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const abortController = new AbortController();

    try {
      Papa.parse(selectedFile, {
        complete: (results) => {
          console.log("Parsed results:", results);
          // TODO: Process and validate the data
          toast({
            title: "File processed successfully",
            description: `${results.data.length} rows found`,
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
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
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
  );
};

export default ImportCSV;