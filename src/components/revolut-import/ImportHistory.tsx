import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { importService } from "@/services/ImportService";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { History, Undo2, XCircle, CheckCircle, Eye, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportSession } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DetailedImportView } from "./DetailedImportView";
import { useState } from "react";

const ImportHistory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed">("all");
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);

  const { data: importHistory, isLoading, error } = useQuery({
    queryKey: ['importHistory'],
    queryFn: () => importService.getImportHistory(),
  });

  const undoMutation = useMutation({
    mutationFn: (importId: string) => importService.undoImport(importId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['importHistory'] });
      toast({
        title: "Import undone",
        description: "The import has been successfully reversed.",
      });
    },
    onError: (error) => {
      console.error("Error undoing import:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to undo import. Please try again.",
      });
    },
  });

  const handleUndo = async (importId: string) => {
    undoMutation.mutate(importId);
  };

  const filteredHistory = importHistory?.filter((session) => {
    if (statusFilter === "all") return true;
    return session.status === statusFilter;
  });

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center text-destructive">
            <XCircle className="mr-2" />
            <span>Failed to load import history</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>Import History</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={(value: "all" | "completed" | "failed") => setStatusFilter(value)}>
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
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredHistory && filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Valid</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((session: ImportSession) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {format(new Date(session.created_at || ''), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(session.month), 'MMMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {session.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {session.status}
                      </span>
                    </TableCell>
                    <TableCell>{session.transaction_count}</TableCell>
                    <TableCell>{session.valid_transaction_count}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedImportId(session.id)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              Details
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="right" className="w-full sm:w-[540px]">
                            <SheetHeader>
                              <SheetTitle>Import Details</SheetTitle>
                              <SheetDescription>
                                Viewing transactions for import from {format(new Date(session.created_at || ''), 'MMMM d, yyyy')}
                              </SheetDescription>
                            </SheetHeader>
                            {selectedImportId && (
                              <DetailedImportView importId={selectedImportId} />
                            )}
                          </SheetContent>
                        </Sheet>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUndo(session.id)}
                          disabled={undoMutation.isPending}
                        >
                          <Undo2 className="mr-1 h-4 w-4" />
                          {undoMutation.isPending ? 'Undoing...' : 'Undo'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No import history available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportHistory;