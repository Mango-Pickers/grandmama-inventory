import { useEffect, useState } from "react";

/** Live wall clock pinned to Africa/Lagos (WAT). Renders a placeholder on the
 * server pass and after hydration to avoid SSR/client mismatches. */
export function LiveClock({ className = "" }: { className?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Africa/Lagos",
      }).format(new Date());

    setTime(format());
    const id = window.setInterval(() => setTime(format()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={`font-label-md text-label-md text-on-surface font-semibold tabular-nums ${className}`}>
      {time ?? "--:--:--"}
    </span>
  );
}
