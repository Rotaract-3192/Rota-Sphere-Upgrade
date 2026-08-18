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
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="border border-gray-200 rounded-2xl p-4 sm:p-5 bg-gray-50/50 hover:bg-gray-100/50 transition-colors space-y-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">{session.title}</h3>
            <span className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold bg-white border border-gray-200 px-3 py-1 rounded-full w-fit">
              <Clock size={12} className="text-[#0758fc]" />
              {formatTime(session.start_time)} - {formatTime(session.end_time)}
            </span>
          </div>

          {session.description && (
            <p className="text-xs text-gray-600 leading-relaxed">{session.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
            {session.speaker && (
              <span className="flex items-center gap-1.5 font-medium">
                <User size={13} className="text-gray-400" />
                {session.speaker}
              </span>
            )}
            {session.location && (
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin size={13} className="text-gray-400" />
                {session.location}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
