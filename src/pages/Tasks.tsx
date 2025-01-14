import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type TaskWithProfile = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string | null;
  assignee: {
    username: string | null;
    id: string;
  } | null;
};

type SortField = "due_date" | "status";
type SortOrder = "asc" | "desc";

const Tasks = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Fetch tasks with profiles
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", statusFilter, assigneeFilter, sortField, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(
          `
          id,
          title,
          description,
          due_date,
          status,
          assignee:profiles!inner(
            id,
            username
          )
        `
        )
        .order(sortField, { ascending: sortOrder === "asc" });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (assigneeFilter) {
        query = query.eq("assignee_id", assigneeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match TaskWithProfile type
      return (data as any[]).map(task => ({
        ...task,
        assignee: task.assignee ? {
          id: task.assignee.id,
          username: task.assignee.username
        } : null
      })) as TaskWithProfile[];
    },
  });

  // Fetch profiles for the assignee filter
  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, username");
      if (error) throw error;
      return data;
    },
  });

  const handleCreateTask = () => {
    navigate("/tasks/create");
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={handleCreateTask}>
          <Plus className="mr-2" />
          Create Task
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Select
          value={statusFilter || ""}
          onValueChange={(value) => setStatusFilter(value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={assigneeFilter || ""}
          onValueChange={(value) => setAssigneeFilter(value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All assignees</SelectItem>
            {profiles?.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.username || "Unnamed User"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("due_date")}
                >
                  Due Date {sortField === "due_date" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("status")}
                >
                  Status {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Assignee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks?.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    {task.due_date
                      ? format(new Date(task.due_date), "MMM d, yyyy")
                      : "No due date"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-sm ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task.status || "pending"}
                    </span>
                  </TableCell>
                  <TableCell>{task.assignee?.username || "Unassigned"}</TableCell>
                </TableRow>
              ))}
              {(!tasks || tasks.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No tasks found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Tasks;