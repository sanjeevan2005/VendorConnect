export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
