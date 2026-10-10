import { byId } from "../dom";
import { daysBetween, formatDate, whenText } from "../format";
import { state, today } from "../state";

/** The "at a glance" strip on the first tab. */
export function updateSummary() {
  const name = state.email.split("@")[0] || "there";
  byId<HTMLElement>("summaryWelcome").textContent =
    `Welcome back, ${name.charAt(0).toUpperCase()}${name.slice(1)}`;

  const upcoming = state.bookings.filter((b) => b.date >= today());
  byId<HTMLElement>("summaryBookings").textContent = String(upcoming.length);
  byId<HTMLElement>("summaryNext").textContent = upcoming.length
    ? `Next: ${upcoming[0].facility}, ${formatDate(upcoming[0].date)} (${whenText(daysBetween(today(), upcoming[0].date)).toLowerCase()})`
    : "Nothing booked yet";

  const open = state.reports.filter((r) => r.status !== "Resolved");
  byId<HTMLElement>("summaryReports").textContent = String(open.length);
  byId<HTMLElement>("summaryReportsNote").textContent = state.reports.length
    ? `${state.reports.length} submitted in total`
    : "No reports submitted";

  byId<HTMLElement>("summaryFacilities").textContent = String(state.facilities.length);
  byId<HTMLElement>("summaryStrip").hidden = false;
}
