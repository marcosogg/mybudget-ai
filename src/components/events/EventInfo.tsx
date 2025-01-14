import { format } from "date-fns";
import { Calendar, Clock, User } from "lucide-react";

type EventInfoProps = {
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  creatorUsername: string;
};

export function EventInfo({
  title,
  description,
  startTime,
  endTime,
  creatorUsername,
}: EventInfoProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span>Created by {creatorUsername}</span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>{format(new Date(startTime), "EEEE, MMMM d, yyyy")}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>
          {format(new Date(startTime), "h:mm a")} -{" "}
          {format(new Date(endTime), "h:mm a")}
        </span>
      </div>
    </div>
  );
}