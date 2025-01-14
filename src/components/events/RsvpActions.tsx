import { CheckSquare, XSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type RsvpActionsProps = {
  onAccept: () => void;
  onDecline: () => void;
};

export function RsvpActions({ onAccept, onDecline }: RsvpActionsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onAccept}>
        <CheckSquare className="mr-2 h-4 w-4" />
        Accept
      </Button>
      <Button variant="outline" onClick={onDecline}>
        <XSquare className="mr-2 h-4 w-4" />
        Decline
      </Button>
    </div>
  );
}