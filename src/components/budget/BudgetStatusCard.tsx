import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentMonthTransactions, useCurrentMonthBudgets } from "@/hooks/use-dashboard-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { BudgetDialog } from "./BudgetDialog";

export const BudgetStatusCard = () => {
  const { data: transactions, isLoading: transactionsLoading } = useCurrentMonthTransactions();
  const { data: budgets, isLoading: budgetsLoading } = useCurrentMonthBudgets();

  const calculateCategorySpending = (category: string) => {
    if (!transactions) return 0;
    return transactions
      .filter(t => t.category === category && Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  };

  if (transactionsLoading || budgetsLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Budget Status</CardTitle>
          <BudgetDialog />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!budgets?.length) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Budget Status</CardTitle>
          <BudgetDialog />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p>No budgets set for this month</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Budget Status</CardTitle>
        <BudgetDialog />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgets.map((budget) => {
            const spent = calculateCategorySpending(budget.category);
            const remaining = Number(budget.amount) - spent;
            const percentage = Math.round((spent / Number(budget.amount)) * 100);

            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{budget.category}</span>
                  <span className="text-sm text-muted-foreground">
                    ${spent.toFixed(2)} / ${Number(budget.amount).toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${percentage >= 100 ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className={remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                    {remaining < 0 ? 'Over budget by' : 'Remaining'}: ${Math.abs(remaining).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};