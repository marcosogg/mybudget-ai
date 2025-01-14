import { useQuery } from "@tanstack/react-query";
import { importService } from "@/services/ImportService";
import { useToast } from "@/components/ui/use-toast";
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
import { History, Undo2, XCircle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ImportStatus = 'completed' | 'failed';

interface ImportSession {
  id: string;
  created_at: string;
  month: string;
  transaction_count: number;
  valid_transaction_count: number;
  status: ImportStatus;
  user_id: string;
}

const ImportHistory = () => {
  const { toast } = useToast();

  const { data: importHistory, isLoading, error } = useQuery({
    queryKey: ['importHistory'],
    queryFn: async () => {
      const data = await importService.getImportHistory();
      return data.map(session => ({
        ...session,
        status: session.status as ImportStatus
      }));
    },
  });

  const handleUndo = async (importId: string) => {
    try {
      await importService.undoImport(importId);
      toast({
        title: "Import undone",
        description: "The import has been successfully reversed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to undo import. Please try again.",
      });
    }
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Import History
          </CardTitle>
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
          ) : importHistory && importHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Valid</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importHistory.map((session: ImportSession) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {format(new Date(session.created_at), 'MMM d, yyyy HH:mm')}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUndo(session.id)}
                      >
                        <Undo2 className="mr-1 h-4 w-4" />
                        Undo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No import history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportHistory;