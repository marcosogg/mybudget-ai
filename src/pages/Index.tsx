import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleImportTransactions = () => {
    // Will implement in next step
    console.log("Import transactions clicked");
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Personal Finance Dashboard</h1>
          <Button onClick={handleImportTransactions}>
            <Plus className="mr-2 h-4 w-4" />
            Import Transactions
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Current Month Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Current Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No transactions yet</p>
            </CardContent>
          </Card>

          {/* Budget Status */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Set up your monthly budget</p>
            </CardContent>
          </Card>

          {/* Goals Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Track your financial goals</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions Section - Will be implemented in next step */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Import your transactions to get started</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;