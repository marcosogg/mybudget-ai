import { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, XCircle } from "lucide-react";

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

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;
    onImport(selectedFile, selectedMonth + "-01");
  };

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  return (
    <>
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
    </>
  );
};