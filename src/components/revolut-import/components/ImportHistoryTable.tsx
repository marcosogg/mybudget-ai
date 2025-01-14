import { format } from "date-fns";
import { CheckCircle, XCircle, Eye, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImportSession } from "../types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DetailedImportView } from "../DetailedImportView";

interface ImportHistoryTableProps {
  imports: ImportSession[];
  onUndo: (importId: string) => void;
  isUndoing: boolean;
}

export const ImportHistoryTable = ({
  imports,
  onUndo,
  isUndoing,
}: ImportHistoryTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Date</TableHead>
            <TableHead className="whitespace-nowrap">Month</TableHead>
            <TableHead className="whitespace-nowrap">Status</TableHead>
            <TableHead className="whitespace-nowrap">Transactions</TableHead>
            <TableHead className="whitespace-nowrap">Valid</TableHead>
            <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {imports.map((session: ImportSession) => (
            <TableRow key={session.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(session.created_at || ''), 'MMM d, yyyy HH:mm')}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {format(new Date(session.month), 'MMMM yyyy')}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <span className="flex items-center gap-1">
                  {session.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  {session.status}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">{session.transaction_count}</TableCell>
              <TableCell className="whitespace-nowrap">{session.valid_transaction_count}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Details
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-[800px]">
                      <SheetHeader>
                        <SheetTitle>Import Details</SheetTitle>
                        <SheetDescription>
                          Viewing transactions for import from {format(new Date(session.created_at || ''), 'MMMM d, yyyy')}
                        </SheetDescription>
                      </SheetHeader>
                      <DetailedImportView importId={session.id} />
                    </SheetContent>
                  </Sheet>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUndo(session.id)}
                    disabled={isUndoing}
                    className="whitespace-nowrap"
                  >
                    <Undo2 className="mr-1 h-4 w-4" />
                    {isUndoing ? 'Undoing...' : 'Undo'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};