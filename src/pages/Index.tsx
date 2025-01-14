import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import ImportCSV from "@/components/revolut-import/ImportCSV";
import { useCurrentMonthTransactions, useFinancialGoals } from "@/hooks/use-dashboard-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetStatusCard } from "@/components/budget/BudgetStatusCard";
import { FinancialGoalsCard } from "@/components/financial-goals/FinancialGoalsCard";

const Index = () => {
  const navigate = useNavigate();
  const { data: transactions, isLoading: transactionsLoading } = useCurrentMonthTransactions();
  const { data: goals, isLoading: goalsLoading } = useFinancialGoals();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const renderCardContent = (isLoading: boolean, content: React.ReactNode) => {
    if (isLoading) {
      return <Skeleton className="h-24 w-full" />;
    }
    return content;
  };

  const totalIncome = transactions
    ? transactions
        .filter(t => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0)
    : 0;

  const totalExpenses = transactions
    ? Math.abs(
        transactions
          .filter(t => Number(t.amount) < 0)
          .reduce((sum, t) => sum + Number(t.amount), 0)
      )
    : 0;

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Personal Finance Dashboard</h1>
        </div>

        {/* Import Section */}
        <ImportCSV />

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Current Month Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Current Month</CardTitle>
            </CardHeader>
            <CardContent>
              {renderCardContent(
                transactionsLoading,
                transactions?.length ? (
                  <div className="space-y-2">
                    <p>Total Transactions: {transactions.length.toString()}</p>
                    <p>Total Income: ${totalIncome.toFixed(2)}</p>
                    <p>Total Expenses: ${totalExpenses.toFixed(2)}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No transactions yet</p>
                )
              )}
            </CardContent>
          </Card>

          {/* Budget Status */}
          <BudgetStatusCard />

          {/* Financial Goals */}
          <FinancialGoalsCard />
        </div>

        {/* Recent Transactions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {renderCardContent(
              transactionsLoading,
              transactions?.length ? (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center">
                      <span>{transaction.description}</span>
                      <span className={Number(transaction.amount) >= 0 ? "text-green-600" : "text-red-600"}>
                        ${Math.abs(Number(transaction.amount)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Import your transactions to get started</p>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;