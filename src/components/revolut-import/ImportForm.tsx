import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Transaction } from "./types";

interface ImportFormProps {
  transactions?: Transaction[];
  importSession?: any | null;
  isLoading?: boolean;
  onImport: (file: File, selectedMonth: string) => Promise<void>;
  onClose?: () => void;
  onCancel?: () => void;
}

export const ImportForm = ({ 
  transactions = [], 
  importSession = null, 
  isLoading = false,
  onImport, 
  onClose,
  onCancel 
}: ImportFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().split("T")[0].substring(0, 7)
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !selectedMonth) {
      toast({
        title: "Error",
        description: "Please select a file and month",
        variant: "destructive",
      });
      return;
    }

    try {
      await onImport(selectedFile, selectedMonth);
      // Invalidate relevant queries after successful import
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      
      toast({
        title: "Success",
        description: "Transactions imported successfully",
      });
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import transactions",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">CSV File</Label>
        <Input
          id="file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="month">Month</Label>
        <Input
          id="month"
          type="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-end gap-2">
        {(onClose || onCancel) && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel || onClose} 
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!selectedFile || !selectedMonth || isLoading}>
          {isLoading ? "Importing..." : "Import"}
        </Button>
      </div>
    </form>
  );
};