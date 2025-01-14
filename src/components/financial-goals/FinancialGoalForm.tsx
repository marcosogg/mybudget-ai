import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  target_amount: z.string().min(1, "Target amount is required").transform(Number),
  target_date: z.string().optional(),
});

type FinancialGoalFormValues = z.infer<typeof formSchema>;

interface FinancialGoalFormProps {
  goalId?: string | null;
}

export const FinancialGoalForm = ({ goalId }: FinancialGoalFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FinancialGoalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      target_amount: "",
      target_date: "",
    },
  });

  const onSubmit = async (values: FinancialGoalFormValues) => {
    try {
      if (goalId) {
        const { error } = await supabase
          .from("financial_goals")
          .update({
            title: values.title,
            target_amount: values.target_amount,
            target_date: values.target_date || null,
          })
          .eq("id", goalId);

        if (error) throw error;
        toast({
          title: "Goal updated",
          description: "Your financial goal has been updated successfully.",
        });
      } else {
        const { error } = await supabase.from("financial_goals").insert({
          title: values.title,
          target_amount: values.target_amount,
          target_date: values.target_date || null,
          current_amount: 0,
        });

        if (error) throw error;
        toast({
          title: "Goal created",
          description: "Your new financial goal has been created successfully.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["financial-goals"] });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error saving your financial goal.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Emergency Fund" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="target_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Amount ($)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="5000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="target_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Date (Optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {goalId ? "Update Goal" : "Create Goal"}
        </Button>
      </form>
    </Form>
  );
};