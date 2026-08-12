import { useEffect, useState } from "react";

/** Returns the current Date, re-rendering every `intervalMs` so the UI stays live. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  return now;
}
