export type ApiFailure = {
  ok: false;
  status: number;
  code: string;
  message: string;
  details: { field?: string; message: string }[];
};

export type ApiResult<T> = { ok: true; data: T } | ApiFailure;

type Options = { method?: string; body?: unknown; headers?: Record<string, string> };

/** Calls the versioned API from the browser. Every failure comes back in one shape. */
export async function apiRequest<T = unknown>(path: string, options: Options = {}): Promise<ApiResult<T>> {
  const { method = "GET", body, headers } = options;
  try {
    const response = await fetch(`/api/v1${path}`, {
      method,
      headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return { ok: true, data: undefined as T };

    const json = await response.json();
    if (response.ok) return { ok: true, data: json.data as T };
    return {
      ok: false,
      status: response.status,
      code: json.error?.code ?? "UNKNOWN_ERROR",
      message: json.error?.message ?? "The request failed.",
      details: json.error?.details ?? [],
    };
  } catch {
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message: "Could not reach the server. Check your connection and try again.",
      details: [],
    };
  }
}
