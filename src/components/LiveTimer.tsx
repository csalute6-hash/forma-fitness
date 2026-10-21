import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { time, type Active } from "../domain/model";
export function LiveTimer({
  startedAt,
  rest,
}: {
  startedAt: string;
  rest: Active["rest"];
}) {
  const [now, N] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => N(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = rest
    ? Math.max(0, Math.ceil((Date.parse(rest.endsAt) - now) / 1000))
    : null;
  return (
    <div className="timer-display">
      <span>
        <Clock size={17} />
        {time(Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000)))}
      </span>
      {seconds !== null && (
        <strong>
          {seconds === 0
            ? "Rest complete"
            : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} rest`}
        </strong>
      )}
    </div>
  );
}
