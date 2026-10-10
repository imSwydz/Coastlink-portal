import "./styles/main.scss";
import "./components/toast.css";
import "./components/tabs.css";
import "./components/notifications.css";
import { api } from "./api";
import { byId, poll } from "./dom";
import { setupTabs } from "./components/tabs";
import { createNotifications } from "./components/notifications";
import { state, type Context } from "./state";
import { setupSearch } from "./features/search";
import { renderBookings } from "./features/bookings";
import { populateReportForm, renderReports, setupReports } from "./features/reports";
import { loadAnnouncements } from "./features/announcements";
import { updateSummary } from "./features/summary";
import { setupFaq } from "./features/faq";

const notifications = createNotifications({
  load: api.notifications,
  markRead: api.markNotificationsRead,
});

let activate: (tabId: string) => void = () => undefined;
const search = setupSearch({
  refreshBookings: () => ctx.refreshBookings(),
  refreshReports: () => ctx.refreshReports(),
  refreshNotifications: () => ctx.refreshNotifications(),
  switchTab: (tabId) => activate(tabId),
  search: () => undefined,
});

const ctx: Context = {
  async refreshBookings() {
    try {
      state.bookings = (await api.bookings()) || [];
      renderBookings(ctx);
      updateSummary();
    } catch {
      /* the next refresh will try again */
    }
  },
  async refreshReports() {
    try {
      state.reports = (await api.reports()) || [];
      renderReports();
      updateSummary();
    } catch {
      /* the next refresh will try again */
    }
  },
  refreshNotifications: () => notifications.refresh(),
  switchTab: (tabId) => activate(tabId),
  search: () => search.search(),
};

activate = setupTabs((tabId) => {
  if (tabId === "tab-bookings") void ctx.refreshBookings();
  if (tabId === "tab-report") void ctx.refreshReports();
});

setupReports(ctx);
setupFaq();

document.querySelectorAll<HTMLElement>("[data-switch-tab]").forEach((button) =>
  button.addEventListener("click", () => activate(button.dataset.switchTab || "tab-book")),
);

byId<HTMLButtonElement>("logoutButton").addEventListener("click", async () => {
  await api.logout();
  window.location.href = "/home.html";
});

async function boot() {
  const auth = await api.me();
  if (!auth?.authenticated || !auth.user) {
    window.location.href = "/home.html#sign-in";
    return;
  }
  state.email = auth.user.email;
  byId("portalUser").textContent = auth.user.email;
  byId("portalAvatar").textContent = auth.user.email.charAt(0).toUpperCase();

  try {
    state.config = await api.config();
    state.facilities = (await api.facilities(new URLSearchParams())) || [];
  } catch {
    /* search below shows the error toast */
  }
  search.configureDate();
  search.populateFilters();
  populateReportForm();

  await Promise.all([
    ctx.refreshBookings(),
    ctx.refreshReports(),
    ctx.refreshNotifications(),
    loadAnnouncements(),
  ]);
  updateSummary();
  search.search();

  poll(() => ctx.refreshNotifications(), 15_000);
  poll(() => {
    if (state.reports.some((report) => report.status !== "Resolved")) {
      return ctx.refreshReports();
    }
  }, 10_000);
}

void boot();
