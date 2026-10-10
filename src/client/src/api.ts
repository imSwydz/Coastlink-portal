import type {
  Announcement,
  AppConfig,
  AppNotification,
  AuthState,
  Booking,
  Facility,
  Report,
} from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T | null> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) window.location.href = "/home.html#sign-in";
    throw new ApiError(
      body.error || `Request failed (${response.status})`,
      response.status,
    );
  }
  return response.status === 204 ? null : ((await response.json()) as T);
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** One typed function per endpoint, so pages never build URLs by hand. */
export const api = {
  me: () => request<AuthState>("/api/auth/me"),
  logout: () => request<void>("/api/auth/logout", json("POST")),
  config: () => request<AppConfig>("/api/config"),
  announcements: () => request<Announcement[]>("/api/announcements"),
  facilities: (params: URLSearchParams, signal?: AbortSignal) =>
    request<Facility[]>(`/api/facilities?${params}`, { signal }),
  bookings: () => request<Booking[]>("/api/bookings"),
  createBooking: (facility: string, date: string) =>
    request<Booking>("/api/bookings", json("POST", { facility, date })),
  cancelBooking: (id: number) =>
    request<void>(`/api/bookings/${id}`, json("DELETE")),
  reports: () => request<Report[]>("/api/reports"),
  createReport: (facility: string, category: string, details: string) =>
    request<{ ticketId: number }>(
      "/api/reports",
      json("POST", { facility, category, details }),
    ),
  notifications: () => request<AppNotification[]>("/api/notifications"),
  markNotificationsRead: () =>
    request<void>("/api/notifications/read", json("POST")),
};
