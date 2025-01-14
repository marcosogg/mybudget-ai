import { History, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ImportHistoryHeaderProps {
  statusFilter: "all" | "completed" | "failed";
  onStatusFilterChange: (value: "all" | "completed" | "failed") => void;
}

export const ImportHistoryHeader = ({
  statusFilter,
  onStatusFilterChange,
}: ImportHistoryHeaderProps) => {
  return (
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <CardTitle>Import History</CardTitle>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <CardDescription>
        View and manage your previous transaction imports
      </CardDescription>
    </CardHeader>
  );
};