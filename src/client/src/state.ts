import type { AppConfig, Booking, Facility, Report } from "./types";

/** Shared page state. Features read it and ask `ctx` to refresh it. */
export const state = {
  config: null as AppConfig | null,
  email: "",
  bookings: [] as Booking[],
  reports: [] as Report[],
  facilities: [] as Facility[],
};

export type Context = {
  refreshBookings: () => Promise<void>;
  refreshReports: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  switchTab: (tabId: string) => void;
  search: () => void;
};

export const today = () =>
  state.config?.today ?? new Date().toISOString().slice(0, 10);
