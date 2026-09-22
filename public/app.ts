import "./styles.scss";
import "../components/toast.css";
import "../components/tabs.css";
import "../components/notifications.css";
import { showToast } from "../components/toast";
import { setupTabs } from "../components/tabs";
import { createNotifications } from "../components/notifications";

type Facility = {
  id: number;
  name: string;
  type: string;
  suburb: string;
  capacity: number;
};
type Booking = { id: number; facility: string; date: string };
type ApiOptions = RequestInit & { headers?: Record<string, string> };

let facilities: Facility[] = [];
let userBookings: Booking[] = [];
let searchTimer: number | undefined;
let searchController: AbortController | null = null;
let searchAttempted = false;

const byId = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const searchButton = byId<HTMLButtonElement>("searchButton");
const resultsSection = byId<HTMLElement>("resultsSection");
const resultsLoading = byId<HTMLElement>("resultsLoading");
const resultsCount = byId<HTMLElement>("resultsCount");
const notifications = createNotifications();

async function apiRequest<T>(
  url: string,
  options: ApiOptions = {},
): Promise<T | null> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) window.location.href = "/home.html#sign-in";
    throw new Error(error.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : ((await response.json()) as T);
}

async function loadAuthState() {
  const result = await apiRequest<{
    authenticated: boolean;
    user?: { email: string };
  }>("/api/auth/me");
  if (result?.authenticated) {
    const bookings = await apiRequest<Booking[]>("/api/bookings");
    userBookings = bookings || [];
  }
  if (!result?.authenticated || !result.user) {
    window.location.href = "/home.html#sign-in";
    return;
  }
  const user = byId<HTMLElement>("portalUser");
  user.textContent = result.user.email;
  byId<HTMLElement>("portalAvatar").textContent = result.user.email
    .charAt(0)
    .toUpperCase();
}

function setLoading(
  button: HTMLButtonElement,
  loading: boolean,
  label: string,
) {
  if (loading) {
    button.dataset.originalLabel = button.textContent || label;
    button.disabled = true;
    button.textContent = `${label}…`;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalLabel || label;
  }
}

function renderResults(list: Facility[]) {
  const container = byId<HTMLElement>("resultsContainer");
  container.replaceChildren();
  resultsCount.textContent = `${list.length} result${list.length === 1 ? "" : "s"}`;
  if (list.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "No matching facilities found.";
    container.appendChild(emptyMessage);
  } else {
    list.forEach((item) => {
      const card = document.createElement("div");
      card.className = "nsw-card facility-card";
      const content = document.createElement("div");
      const details = document.createElement("div");
      const name = document.createElement("strong");
      const summary = document.createElement("div");
      const bookButton = document.createElement("button");
      name.textContent = item.name;
      summary.className = "item-summary";
      summary.textContent = `${item.suburb} • Capacity: ${item.capacity}`;
      bookButton.className = "nsw-button nsw-button--dark";
      bookButton.type = "button";
      bookButton.textContent = "Book";
      bookButton.addEventListener("click", () =>
        bookFacility(item.name, bookButton),
      );
      details.append(name, summary);
      content.className = "nsw-card__content";
      content.append(details, bookButton);
      card.append(content);
      container.appendChild(card);
    });
  }
  resultsSection.hidden = false;
}

async function searchFacilities(signal: AbortSignal) {
  const params = new URLSearchParams({
    q: byId<HTMLInputElement>("searchInput").value,
    suburb: byId<HTMLSelectElement>("suburbSelect").value,
    minCapacity: byId<HTMLSelectElement>("capacitySelect").value,
  });
  resultsLoading.hidden = false;
  searchButton.disabled = true;
  try {
    const loaded = await apiRequest<Facility[]>(`/api/facilities?${params}`, {
      signal,
    });
    facilities = loaded || [];
    renderResults(facilities);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    showToast({
      message: error instanceof Error ? error.message : "Search failed",
      type: "error",
    });
  } finally {
    if (!signal?.aborted) {
      resultsLoading.hidden = true;
      searchButton.disabled = false;
    }
  }
}

function startSearch() {
  window.clearTimeout(searchTimer);
  searchController?.abort();
  searchController = new AbortController();
  void searchFacilities(searchController.signal);
}

function scheduleSearch() {
  window.clearTimeout(searchTimer);
  searchController?.abort();
  searchTimer = window.setTimeout(() => {
    startSearch();
  }, 300);
}

async function loadInitialData() {
  try {
    const loadedFacilities = await apiRequest<Facility[]>("/api/facilities");
    facilities = loadedFacilities || [];
  } catch (error) {
    showToast({
      message: error instanceof Error ? error.message : "Backend offline",
      type: "error",
    });
  }
}

const switchTab = setupTabs((tabId) => {
  if (tabId === "tab-bookings") renderBookings();
});

async function bookFacility(name: string, button: HTMLButtonElement) {
  const dateInput = byId<HTMLInputElement>("dateInput");
  if (!validateDate()) {
    dateInput.focus();
    return;
  }
  setLoading(button, true, "Booking");
  try {
    const booking = await apiRequest<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({ facility: name, date: dateInput.value }),
    });
    if (booking) userBookings.push(booking);
    showToast({ message: `Booking confirmed for ${name}.`, type: "success" });
    notifications.add(`Booking confirmed: ${name} on ${dateInput.value}`);
    switchTab("tab-bookings");
  } catch (error) {
    setLoading(button, false, "Book");
    showToast({
      message: error instanceof Error ? error.message : "Booking failed",
      type: "error",
    });
  }
}

function renderBookings() {
  const container = byId<HTMLElement>("bookingsList");
  container.replaceChildren();
  if (userBookings.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "No active bookings found.";
    container.appendChild(emptyMessage);
    return;
  }
  userBookings.forEach((booking) => {
    const card = document.createElement("div");
    card.className = "nsw-card facility-card";
    const content = document.createElement("div");
    const details = document.createElement("div");
    const facility = document.createElement("strong");
    const date = document.createElement("div");
    const cancelButton = document.createElement("button");
    facility.textContent = booking.facility;
    date.className = "item-summary";
    date.textContent = `Date: ${booking.date}`;
    cancelButton.className = "nsw-button nsw-button--danger";
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", () =>
      cancelBooking(booking.id, cancelButton),
    );
    details.append(facility, date);
    content.className = "nsw-card__content";
    content.append(details, cancelButton);
    card.append(content);
    container.appendChild(card);
  });
}

async function cancelBooking(id: number, button: HTMLButtonElement) {
  setLoading(button, true, "Cancel");
  try {
    await apiRequest<void>(`/api/bookings/${id}`, { method: "DELETE" });
    userBookings = userBookings.filter((booking) => booking.id !== id);
    renderBookings();
    showToast({ message: "Booking cancelled.", type: "info" });
  } catch (error) {
    setLoading(button, false, "Cancel");
    showToast({
      message: error instanceof Error ? error.message : "Cancellation failed",
      type: "error",
    });
  }
}

function setFieldError(id: string, message: string) {
  const helper = byId<HTMLElement>(id);
  helper.hidden = !message;
  helper.replaceChildren();
  if (message) helper.textContent = message;
}

function validateDate() {
  const input = byId<HTMLInputElement>("dateInput");
  const valid = Boolean(input.value);
  setFieldError("dateError", valid ? "" : "Enter a valid date.");
  input.setAttribute("aria-invalid", String(!valid));
  return valid;
}

function validateReportField(
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
) {
  let message = "";
  if (input.id === "reportFacility" && !input.value)
    message = "Choose a facility.";
  if (input.id === "reportType" && !input.value)
    message = "Choose an issue category.";
  if (input.id === "reportDetails" && input.value.trim().length < 5)
    message = "Enter at least 5 characters.";
  const errorId =
    input.id === "reportDetails"
      ? "reportDetailsError"
      : input.id === "reportFacility"
        ? "reportFacilityError"
        : "reportTypeError";
  setFieldError(errorId, message);
  input.setAttribute("aria-invalid", String(Boolean(message)));
  return !message;
}

byId<HTMLInputElement>("searchInput").addEventListener("input", scheduleSearch);
byId<HTMLSelectElement>("suburbSelect").addEventListener(
  "change",
  scheduleSearch,
);
byId<HTMLSelectElement>("capacitySelect").addEventListener(
  "change",
  scheduleSearch,
);
byId<HTMLFormElement>("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  searchAttempted = true;
  startSearch();
});
byId<HTMLButtonElement>("logoutButton").addEventListener("click", async () => {
  await apiRequest<void>("/api/auth/logout", { method: "POST" });
  userBookings = [];
  window.location.href = "/home.html";
});
byId<HTMLButtonElement>("showAllBtn").addEventListener("click", () => {
  byId<HTMLInputElement>("searchInput").value = "";
  byId<HTMLSelectElement>("suburbSelect").value = "";
  byId<HTMLSelectElement>("capacitySelect").value = "0";
  startSearch();
});
document
  .querySelectorAll<HTMLButtonElement>("[data-quick-filter]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      byId<HTMLInputElement>("searchInput").value =
        button.dataset.quickFilter || "";
      scheduleSearch();
    });
  });
document
  .querySelectorAll<HTMLButtonElement>("[data-switch-tab]")
  .forEach((button) => {
    button.addEventListener("click", () =>
      switchTab(button.dataset.switchTab || "tab-book"),
    );
  });

const dateInput = byId<HTMLInputElement>("dateInput");
dateInput.addEventListener("input", () => {
  if (searchAttempted) validateDate();
});

document
  .querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >("#reportForm input, #reportForm select, #reportForm textarea")
  .forEach((input) => {
    input.addEventListener("blur", () => validateReportField(input));
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true")
        validateReportField(input);
    });
  });

byId<HTMLFormElement>("reportForm").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    const fields = Array.from(
      document.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("#reportForm select, #reportForm textarea"),
    );
    if (!fields.every(validateReportField)) {
      showToast({
        message: "Please fix the highlighted fields.",
        type: "error",
      });
      return;
    }
    const button = byId<HTMLButtonElement>("reportSubmitButton");
    setLoading(button, true, "Submitting");
    try {
      const report = await apiRequest<{ ticketId: number }>("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          facility: byId<HTMLSelectElement>("reportFacility").value,
          category: byId<HTMLSelectElement>("reportType").value,
          details: byId<HTMLTextAreaElement>("reportDetails").value,
        }),
      });
      showToast({
        message: `Maintenance report submitted. Ticket #${report?.ticketId}.`,
        type: "success",
      });
      notifications.add(`Report ticket created: #${report?.ticketId}`);
      (event.currentTarget as HTMLFormElement).reset();
    } catch (error) {
      setLoading(button, false, "Submit Report");
      showToast({
        message: error instanceof Error ? error.message : "Report failed",
        type: "error",
      });
    }
  },
);

document.querySelectorAll<HTMLButtonElement>(".faq-item").forEach((item) => {
  item.addEventListener("click", () => item.classList.toggle("open"));
});

loadInitialData();
loadAuthState().catch(() => (window.location.href = "/home.html#sign-in"));
startSearch();
