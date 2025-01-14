import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Clock,
  Loader2,
  User,
  Users,
  XSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type EventDetails = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  creator: {
    username: string;
  };
};

type Attendee = {
  user: {
    username: string;
  };
  status: string;
};

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch event details
  const {
    data: event,
    isLoading: isLoadingEvent,
    error: eventError,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select(
          `
          id,
          title,
          description,
          start_time,
          end_time,
          creator:profiles!events_creator_id_fkey(username)
        `
        )
        .eq("id", id)
        .single();

      if (eventError) {
        console.error("Error fetching event:", eventError);
        throw eventError;
      }

      return {
        ...eventData,
        creator: {
          username: eventData.creator?.username || "Unknown User",
        },
      } as EventDetails;
    },
  });

  // Fetch attendees
  const {
    data: attendees,
    isLoading: isLoadingAttendees,
    error: attendeesError,
  } = useQuery({
    queryKey: ["event-attendees", id],
    queryFn: async () => {
      const { data: attendeesData, error: attendeesError } = await supabase
        .from("event_attendees")
        .select(
          `
          status,
          user:profiles!event_attendees_user_id_fkey(username)
        `
        )
        .eq("event_id", id);

      if (attendeesError) {
        console.error("Error fetching attendees:", attendeesError);
        throw attendeesError;
      }

      return (attendeesData || []).map((attendee) => ({
        user: {
          username: attendee.user?.username || "Unknown User",
        },
        status: attendee.status,
      })) as Attendee[];
    },
  });

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("event_attendees")
        .upsert(
          {
            event_id: id,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            status,
          },
          { onConflict: "event_id,user_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-attendees", id] });
      toast({
        title: "Success",
        description: "Your RSVP has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating RSVP:", error);
      toast({
        title: "Error",
        description: "Failed to update your RSVP. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoadingEvent || isLoadingAttendees) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (eventError || attendeesError || !event) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">
            Failed to load event details. Please try again.
          </p>
          <Button onClick={() => navigate("/events")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Button
        variant="outline"
        onClick={() => navigate("/events")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>{event.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Created by {event.creator.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(event.start_time), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(event.start_time), "h:mm a")} -{" "}
                  {format(new Date(event.end_time), "h:mm a")}
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Attendees</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => rsvpMutation.mutate("accepted")}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => rsvpMutation.mutate("declined")}
                  >
                    <XSquare className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              </div>

              {attendees && attendees.length > 0 ? (
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
                        <TableCell className="capitalize">
                          {attendee.status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No attendees yet</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
