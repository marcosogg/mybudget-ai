import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Attendee = {
  user: {
    username: string;
  };
  status: string;
};

type AttendeesListProps = {
  attendees: Attendee[];
};

export function AttendeesList({ attendees }: AttendeesListProps) {
  if (!attendees.length) {
    return (
      <div className="text-center py-4">
        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No attendees yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Attendee</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attendees.map((attendee, index) => (
          <TableRow key={index}>
            <TableCell>{attendee.user.username}</TableCell>
            <TableCell className="capitalize">{attendee.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}