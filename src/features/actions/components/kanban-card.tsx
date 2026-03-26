import { Separator } from "@/components/ui/separator";
import { Action } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  action: Action;
}

export function KanbanCard({ action }: Props) {
  return (
    <div className="bg-muted rounded-md p-2.5 mb-1.5 space-y-3">
      <div className="flex items-start justify-between gap-x-2">
        <p className="text-sm font-medium line-clamp-2">{action.title}</p>
      </div>

      <Separator />

      <div className="flex items-center gap-x-1.5">
        <div className="flex -space-x-2">
          {action.participants.slice(0, 6).map((participant) => (
            <Avatar className="size-6" key={participant.user.id}>
              <AvatarImage
                src={participant?.user?.image || ""}
                alt={participant.user.name}
              />
              <AvatarFallback>{participant.user.name[0]}</AvatarFallback>
            </Avatar>
          ))}
          {action.participants.length > 6 && (
            <Avatar className="size-6">
              <AvatarFallback>+{action.participants.length - 6}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
