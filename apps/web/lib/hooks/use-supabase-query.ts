import { useState, useEffect } from "react";
import { isSupabaseConfigured, supabase } from "../supabase";

interface UseSupabaseQueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to run a Supabase query with optional polling.
 *
 * @param queryFn A function that executes the Supabase query and returns data.
 * @param dependencies Array of dependencies that should trigger a re-run.
 * @param pollIntervalMs Interval in ms to poll the query. Set to 0 to disable.
 * @returns State object containing data, loading flag, and any error.
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: unknown[] = [],
  pollIntervalMs: number = 0
): UseSupabaseQueryState<T> {
  const [state, setState] = useState<UseSupabaseQueryState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        const result = await queryFn();
        if (isMounted) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (err) {
        console.error("Supabase query error:", err);
        if (isMounted) {
          setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err : new Error(String(err)) }));
        }
      }
    };

    fetchData();

    let intervalId: ReturnType<typeof setInterval>;
    if (pollIntervalMs > 0) {
      intervalId = setInterval(fetchData, pollIntervalMs);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, pollIntervalMs]);

  return state;
}
