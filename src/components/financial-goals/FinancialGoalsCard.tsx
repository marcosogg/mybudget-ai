import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Target, Pencil, Trash2 } from "lucide-react";
import { useFinancialGoals } from "@/hooks/use-dashboard-queries";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FinancialGoalForm } from "./FinancialGoalForm";

export const FinancialGoalsCard = () => {
  const { data: goals, isLoading } = useFinancialGoals();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Financial Goals
        </CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Financial Goal</DialogTitle>
            </DialogHeader>
            <FinancialGoalForm />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div>Loading goals...</div>
        ) : goals && goals.length > 0 ? (
          goals.map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{goal.title}</h3>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedGoal(goal.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Financial Goal</DialogTitle>
                      </DialogHeader>
                      <FinancialGoalForm goalId={selectedGoal} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  ${goal.current_amount?.toFixed(2) || "0.00"} / ${goal.target_amount.toFixed(2)}
                </span>
                <span>
                  {calculateProgress(goal.current_amount || 0, goal.target_amount).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={calculateProgress(goal.current_amount || 0, goal.target_amount)} 
                className="h-2"
              />
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground">
            No financial goals yet. Add one to start tracking!
          </div>
        )}
      </CardContent>
    </Card>
  );
};