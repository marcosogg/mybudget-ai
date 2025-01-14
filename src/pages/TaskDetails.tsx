import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type TaskDetails = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
  creator: {
    username: string;
    id: string;
  };
  assignee: {
    username: string;
    id: string;
  } | null;
};

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          description,
          due_date,
          status,
          creator_id,
          assignee_id
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch creator profile
      const { data: creatorProfile, error: creatorError } = await supabase
        .from("profiles")
        .select("username, id")
        .eq("id", data.creator_id)
        .single();

      if (creatorError) throw creatorError;

      // Fetch assignee profile if exists
      let assigneeProfile = null;
      if (data.assignee_id) {
        const { data: assigneeData, error: assigneeError } = await supabase
          .from("profiles")
          .select("username, id")
          .eq("id", data.assignee_id)
          .single();

        if (assigneeError) throw assigneeError;
        assigneeProfile = assigneeData;
      }

      return {
        ...data,
        creator: creatorProfile,
        assignee: assigneeProfile,
      } as TaskDetails;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      toast({
        title: "Status updated",
        description: "Task status has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating task status:", error);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Task not found</h1>
        <Button onClick={() => navigate("/tasks")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "in progress":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "destructive";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => navigate("/tasks")}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Tasks
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <p className="text-muted-foreground">{task.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">Due Date</h3>
              <p className="text-muted-foreground">
                {format(new Date(task.due_date), "PPP")}
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Status</h3>
              <div className="flex items-center gap-4">
                <Badge variant={getStatusBadgeVariant(task.status)}>
                  {task.status}
                </Badge>
                <Select
                  value={task.status}
                  onValueChange={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Creator</h3>
              <p className="text-muted-foreground">{task.creator.username}</p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Assignee</h3>
              <p className="text-muted-foreground">
                {task.assignee ? task.assignee.username : "Unassigned"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetails;