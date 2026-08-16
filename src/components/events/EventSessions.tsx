import type { EventSession } from "@/types/database";
import { Clock, MapPin, User } from "lucide-react";

interface EventSessionsProps {
  sessions: EventSession[];
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function EventSessions({ sessions }: EventSessionsProps) {
  if (!sessions || sessions.length === 0) return null;

  return (
    <div className="space-y-md">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="border border-hairline rounded-sm p-base bg-surface-soft/40 hover:bg-surface-soft transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-xs mb-xs">
            <h3 className="text-title-md font-semibold text-ink">{session.title}</h3>
            <span className="flex items-center gap-xxs text-caption-sm text-muted font-medium bg-canvas border border-hairline px-sm py-xxs rounded-full w-fit">
              <Clock size={12} strokeWidth={1.5} />
              {formatTime(session.start_time)} - {formatTime(session.end_time)}
            </span>
          </div>

          {session.description && (
            <p className="text-body-sm text-body mb-sm">{session.description}</p>
          )}

          <div className="flex flex-wrap gap-md text-caption-sm text-muted">
            {session.speaker && (
              <span className="flex items-center gap-xxs">
                <User size={13} strokeWidth={1.5} />
                {session.speaker}
              </span>
            )}
            {session.location && (
              <span className="flex items-center gap-xxs">
                <MapPin size={13} strokeWidth={1.5} />
                {session.location}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
