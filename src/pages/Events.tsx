import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Event = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  creator: {
    username: string;
  };
};

type SortOrder = "asc" | "desc";

export default function Events() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [dateFilter, setDateFilter] = useState<"all" | "upcoming" | "past">("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", sortOrder, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select(`
          id,
          title,
          start_time,
          end_time,
          creator:profiles(username)
        `)
        .order("start_time", { ascending: sortOrder === "asc" });

      const now = new Date().toISOString();

      if (dateFilter === "upcoming") {
        query = query.gte("start_time", now);
      } else if (dateFilter === "past") {
        query = query.lt("start_time", now);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to fetch events. Please try again.",
          variant: "destructive",
        });
        throw error;
      }

      // Transform the data to match the Event type
      return (data as any[]).map((event) => ({
        ...event,
        creator: {
          username: event.creator?.username || "Unknown User",
        },
      })) as Event[];
    },
  });

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button onClick={() => navigate("/events/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Select
          value={dateFilter}
          onValueChange={(value: "all" | "upcoming" | "past") =>
            setDateFilter(value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming Events</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortOrder}
          onValueChange={(value: SortOrder) => setSortOrder(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Oldest First</SelectItem>
            <SelectItem value="desc">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !events?.length ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No events found</p>
          <Button onClick={() => navigate("/events/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first event
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Creator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(event.start_time), "PPp")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(event.end_time), "PPp")}
                    </div>
                  </TableCell>
                  <TableCell>{event.creator.username}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}