import { useState, useCallback } from "react";
import { API_BASE_URL } from "../constants";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for typed fetch requests to the backend API.
 */
export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      
      try {
        const apiKey = process.env.NEXT_PUBLIC_API_KEY;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(typeof options.headers === "object" && options.headers !== null
            ? Object.fromEntries(new Headers(options.headers).entries())
            : {}),
        };
        
        if (apiKey) {
          headers["X-API-Key"] = apiKey;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.detail || errorData?.error || `API error: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = (await response.json()) as T;
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState((s) => ({ ...s, loading: false, error }));
        throw error;
      }
    },
    []
  );

  return { ...state, request };
}
