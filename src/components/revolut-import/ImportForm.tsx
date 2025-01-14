import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportFormProps {
  onImport: (file: File, month: string) => void;
  isProcessing: boolean;
}

export const ImportForm = ({ onImport, isProcessing }: ImportFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);

    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setFileError("Please select a CSV file");
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select a CSV file",
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File size exceeds 10MB limit");
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select a file smaller than 10MB",
      });
      return;
    }

    setSelectedFile(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      setFileError("Please select a file");
      return;
    }
    onImport(selectedFile, selectedMonth + "-01");
  };

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Month</label>
        <Select 
          value={selectedMonth} 
          onValueChange={setSelectedMonth}
          disabled={isProcessing}
        >
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
            disabled={isProcessing}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
            disabled={isProcessing}
          >
            <Upload className="w-4 h-4 mr-2" />
            {selectedFile ? selectedFile.name : "Choose file"}
          </Button>
          {selectedFile && !isProcessing && (
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
        {fileError && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{fileError}</AlertDescription>
          </Alert>
        )}
      </div>

      <Button
        onClick={handleImport}
        disabled={!selectedFile || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Import Transactions"
        )}
      </Button>
    </div>
  );
};