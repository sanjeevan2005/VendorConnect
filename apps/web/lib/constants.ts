/**
 * Application-wide constants. No magic numbers in components.
 */

/** Backend API base URL. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

/** Polling interval for vendor and call event updates (ms). */
export const POLL_INTERVAL_MS = 5_000;

/** Number of vendors to show before "Show All". */
export const VENDOR_LIST_INITIAL_LIMIT = 12;

/** Date format options for consistent date display. */
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

/** Fit score thresholds for color coding. */
export const FIT_SCORE = {
  HIGH: 85,
  MEDIUM: 70,
} as const;

/** Vendor statuses that indicate an active/live call. */
export const LIVE_CALL_STATUSES: ReadonlySet<string> = new Set(["calling"]);

/** Vendor statuses that indicate a completed outcome with a quote. */
export const QUOTED_STATUSES: ReadonlySet<string> = new Set(["quoted"]);
