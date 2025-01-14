import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface BudgetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const BudgetForm = ({ onSuccess, onCancel }: BudgetFormProps) => {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString().split('T')[0];

      const { error } = await supabase
        .from('budgets')
        .insert({
          category,
          amount: parseFloat(amount),
          month: firstDayOfMonth,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Budget created successfully",
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      
      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setCategory("");
      setAmount("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create budget",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., Groceries"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Monthly Budget Amount</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.01"
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Budget"}
        </Button>
      </div>
    </form>
  );
};