import { cn } from "@/lib/utils";
import dayjs from "dayjs";

interface EventCardProps {
  start: Date;
  end: Date;
  title: string | null;
  id: string;
}

export const EventCard = ({ id, title, start, end }: EventCardProps) => {
  return (
    <div className="px-2">
      <div
        className={cn(
          "p-1.5 text-xs bg-white text-primary border rounded-md border-l-4 flex flex-col gap-y-1.5 cursor-pointer hover:opacity-75 transition",
        )}
      >
        <p>{title}</p>
        <div>
          {dayjs(start).format("HH:mm")} - {dayjs(end).format("HH:mm")}
        </div>
      </div>
    </div>
  );
};
