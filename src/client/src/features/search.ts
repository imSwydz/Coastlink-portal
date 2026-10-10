import { api, ApiError } from "../api";
import { byId, el, setBusy } from "../dom";
import { formatDate } from "../format";
import { showToast } from "../components/toast";
import { state, type Context } from "../state";
import type { Facility } from "../types";

const searchInput = () => byId<HTMLInputElement>("searchInput");
const suburbSelect = () => byId<HTMLSelectElement>("suburbSelect");
const typeSelect = () => byId<HTMLSelectElement>("typeSelect");
const capacitySelect = () => byId<HTMLSelectElement>("capacitySelect");
const dateInput = () => byId<HTMLInputElement>("dateInput");

export function setupSearch(ctx: Context) {
  const searchButton = byId<HTMLButtonElement>("searchButton");
  const resultsSection = byId<HTMLElement>("resultsSection");
  const resultsLoading = byId<HTMLElement>("resultsLoading");
  const resultsCount = byId<HTMLElement>("resultsCount");
  const availabilityHint = byId<HTMLElement>("availabilityHint");
  const container = byId<HTMLElement>("resultsContainer");
  let timer: number | undefined;
  let controller: AbortController | null = null;
  let attempted = false;

  /** Fills the suburb/type dropdowns from the data instead of fixed HTML. */
  function populateFilters() {
    if (state.facilities.length === 0) return; // keep the built-in options
    const fill = (select: HTMLSelectElement, values: string[], any: string) => {
      const current = select.value;
      select.replaceChildren(
        el("option", { text: any, attrs: { value: "" } }),
        ...values.map((value) => el("option", { text: value, attrs: { value } })),
      );
      select.value = values.includes(current) ? current : "";
    };
    const unique = (key: "suburb" | "type") =>
      [...new Set(state.facilities.map((item) => item[key]))].sort();
    fill(suburbSelect(), unique("suburb"), "Any suburb");
    fill(typeSelect(), unique("type"), "Any type");
  }

  function configureDate() {
    const config = state.config;
    if (!config) return;
    dateInput().min = config.minBookingDate;
    dateInput().max = config.maxBookingDate;
    byId<HTMLElement>("dateHint").textContent =
      `Bookable ${formatDate(config.minBookingDate)} to ${formatDate(config.maxBookingDate)}`;
  }

  function dateError(): string {
    const value = dateInput().value;
    if (!value) return "Enter a valid date.";
    const config = state.config;
    if (config && (value < config.minBookingDate || value > config.maxBookingDate)) {
      return `Choose a date between ${formatDate(config.minBookingDate)} and ${formatDate(config.maxBookingDate)}.`;
    }
    return "";
  }

  function validateDate() {
    const message = dateError();
    const helper = byId<HTMLElement>("dateError");
    helper.hidden = !message;
    helper.textContent = message;
    dateInput().setAttribute("aria-invalid", String(Boolean(message)));
    return !message;
  }

  function renderResults(list: Facility[], date: string) {
    container.replaceChildren();
    resultsCount.textContent = `${list.length} result${list.length === 1 ? "" : "s"}`;
    availabilityHint.textContent = date
      ? `Availability shown for ${formatDate(date)}.`
      : "Pick a date to see which facilities are free.";

    if (list.length === 0) {
      container.append(
        el("p", { class: "empty-message", text: "No matching facilities found. Try removing a filter." }),
      );
    }
    list.forEach((item) => {
      const unavailable = date !== "" && item.available === false;
      const bookButton = el("button", {
        class: "nsw-button nsw-button--dark",
        text: unavailable ? "Unavailable" : "Book",
        attrs: { type: "button" },
      });
      bookButton.disabled = unavailable;
      bookButton.addEventListener("click", () => void book(item, bookButton));

      const tags = el(
        "div",
        { class: "facility-tags" },
        el("span", { class: "tag tag--type", text: item.type }),
        ...(item.amenities || []).slice(0, 3).map((a) => el("span", { class: "tag", text: a })),
      );
      const status =
        date !== ""
          ? el("span", {
              class: `availability ${unavailable ? "availability--no" : "availability--yes"}`,
              text: unavailable ? item.unavailableReason || "Unavailable" : "Available",
            })
          : null;

      container.append(
        el(
          "div",
          { class: `nsw-card facility-card${unavailable ? " is-unavailable" : ""}` },
          el(
            "div",
            { class: "nsw-card__content" },
            el(
              "div",
              { class: "facility-info" },
              el("strong", { text: item.name }),
              el("div", { class: "item-summary", text: `${item.suburb} • Capacity: ${item.capacity}` }),
              tags,
              status,
            ),
            bookButton,
          ),
        ),
      );
    });
    resultsSection.hidden = false;
  }

  function skeletons() {
    if (container.children.length > 0) return;
    for (let i = 0; i < 4; i += 1) {
      container.append(el("div", { class: "nsw-card facility-card skeleton", attrs: { "aria-hidden": "true" } }));
    }
    resultsSection.hidden = false;
  }

  async function runSearch(signal: AbortSignal) {
    const date = dateInput().value && !dateError() ? dateInput().value : "";
    const params = new URLSearchParams({
      q: searchInput().value,
      suburb: suburbSelect().value,
      type: typeSelect().value,
      minCapacity: capacitySelect().value,
    });
    if (date) params.set("date", date);
    resultsLoading.hidden = false;
    skeletons();
    searchButton.disabled = true;
    try {
      renderResults((await api.facilities(params, signal)) || [], date);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      container.replaceChildren();
      showToast({ message: error instanceof Error ? error.message : "Search failed", type: "error" });
    } finally {
      if (!signal.aborted) {
        resultsLoading.hidden = true;
        searchButton.disabled = false;
      }
    }
  }

  function startSearch() {
    window.clearTimeout(timer);
    controller?.abort();
    controller = new AbortController();
    void runSearch(controller.signal);
  }

  function scheduleSearch() {
    window.clearTimeout(timer);
    controller?.abort();
    timer = window.setTimeout(startSearch, 300);
  }

  async function book(item: Facility, button: HTMLButtonElement) {
    attempted = true;
    if (!validateDate()) {
      dateInput().focus();
      return;
    }
    setBusy(button, true, "Booking");
    try {
      await api.createBooking(item.name, dateInput().value);
      showToast({ message: `Booking confirmed for ${item.name}.`, type: "success" });
      await Promise.all([ctx.refreshBookings(), ctx.refreshNotifications()]);
      ctx.switchTab("tab-bookings");
      startSearch();
    } catch (error) {
      setBusy(button, false, "Book");
      showToast({ message: error instanceof Error ? error.message : "Booking failed", type: "error" });
      if (error instanceof ApiError && error.status === 409) startSearch();
    }
  }

  byId<HTMLFormElement>("searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    attempted = true;
    validateDate();
    startSearch();
  });
  [searchInput(), suburbSelect(), typeSelect(), capacitySelect()].forEach((field) =>
    field.addEventListener(field instanceof HTMLInputElement ? "input" : "change", scheduleSearch),
  );
  dateInput().addEventListener("change", () => {
    if (attempted || dateInput().value) validateDate();
    scheduleSearch();
  });
  byId<HTMLButtonElement>("showAllBtn").addEventListener("click", () => {
    searchInput().value = "";
    suburbSelect().value = "";
    typeSelect().value = "";
    capacitySelect().value = "0";
    startSearch();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-quick-type]").forEach((button) =>
    button.addEventListener("click", () => {
      typeSelect().value = button.dataset.quickType || "";
      startSearch();
      byId<HTMLElement>("resultsSection").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }),
  );

  return { populateFilters, configureDate, search: startSearch };
}
