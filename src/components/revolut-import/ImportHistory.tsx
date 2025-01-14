import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { importService } from "@/services/ImportService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ImportHistoryHeader } from "./components/ImportHistoryHeader";
import { ImportHistoryTable } from "./components/ImportHistoryTable";

const ImportHistory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed">("all");

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
      <ImportHistoryHeader 
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => setStatusFilter(value)}
      />
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredHistory && filteredHistory.length > 0 ? (
          <ImportHistoryTable
            imports={filteredHistory}
            onUndo={handleUndo}
            isUndoing={undoMutation.isPending}
          />
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