import "./styles.css";

type Facility = {
  id: number;
  name: string;
  type: string;
  suburb: string;
  capacity: number;
};

type Booking = {
  id: number;
  facility: string;
  date: string;
};

type ApiOptions = RequestInit & {
  headers?: Record<string, string>;
};

let facilities: Facility[] = [];
let userBookings: Booking[] = [];

const byId = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

async function apiRequest<T>(
  url: string,
  options: ApiOptions = {},
): Promise<T | null> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : ((await response.json()) as T);
}

async function loadInitialData() {
  const status = byId<HTMLSpanElement>("apiStatus");
  try {
    const [health, loadedFacilities, loadedBookings] = await Promise.all([
      apiRequest<{ status: string }>("/api/health"),
      apiRequest<Facility[]>("/api/facilities"),
      apiRequest<Booking[]>("/api/bookings"),
    ]);
    facilities = loadedFacilities || [];
    userBookings = loadedBookings || [];
    status.textContent =
      health?.status === "ok" ? "Backend connected" : "Service issue";
  } catch (error) {
    status.textContent = "Backend offline";
    status.classList.add("offline");
    console.error(error);
  }
}

function switchTab(tabId: string) {
  document
    .querySelectorAll<HTMLElement>(".tab-content")
    .forEach((content) => content.classList.remove("active"));
  document
    .querySelectorAll<HTMLElement>(".nav-tab")
    .forEach((tab) => tab.classList.remove("active"));

  byId<HTMLElement>(tabId).classList.add("active");
  const targetNav = Array.from(
    document.querySelectorAll<HTMLElement>(".nav-tab"),
  ).find((tab) => tab.dataset.tab === tabId);
  targetNav?.classList.add("active");
  if (tabId === "tab-bookings") renderBookings();
}

document.querySelectorAll<HTMLElement>(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab || "tab-book"));
});

function renderResults(list: Facility[]) {
  const section = byId<HTMLElement>("resultsSection");
  const container = byId<HTMLElement>("resultsContainer");
  container.replaceChildren();

  if (list.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.style.color = "#64748b";
    emptyMessage.textContent = "No matching facilities found.";
    container.appendChild(emptyMessage);
  } else {
    list.forEach((item) => {
      const div = document.createElement("div");
      div.className = "list-item";
      const details = document.createElement("div");
      const name = document.createElement("strong");
      const summary = document.createElement("div");
      const bookButton = document.createElement("button");

      name.textContent = item.name;
      summary.style.cssText = "font-size: 0.85rem; color: #64748b;";
      summary.textContent = `${item.suburb} • Capacity: ${item.capacity}`;
      bookButton.className = "btn-dark";
      bookButton.textContent = "Book";
      bookButton.addEventListener("click", () => bookFacility(item.name));
      details.append(name, summary);
      div.append(details, bookButton);
      container.appendChild(div);
    });
  }
  section.style.display = "block";
}

async function bookFacility(name: string) {
  const date = byId<HTMLInputElement>("dateInput").value;
  if (!date) {
    alert("Please choose a booking date.");
    return;
  }
  try {
    const booking = await apiRequest<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({ facility: name, date }),
    });
    if (booking) userBookings.push(booking);
    alert(`Booking created for ${name} on ${date}.`);
    switchTab("tab-bookings");
  } catch (error) {
    alert(error instanceof Error ? error.message : "Request failed");
  }
}

byId<HTMLFormElement>("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const term = byId<HTMLInputElement>("searchInput").value.toLowerCase();
  const suburb = byId<HTMLSelectElement>("suburbSelect").value;
  const minCap = parseInt(byId<HTMLSelectElement>("capacitySelect").value, 10);

  const filtered = facilities.filter((item) => {
    const matchesTerm =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term);
    const matchesSuburb = !suburb || item.suburb === suburb;
    const matchesCap = !minCap || item.capacity >= minCap;
    return matchesTerm && matchesSuburb && matchesCap;
  });

  renderResults(filtered);
});

byId<HTMLButtonElement>("showAllBtn").addEventListener("click", () =>
  renderResults(facilities),
);

function quickFilter(type: string) {
  byId<HTMLInputElement>("searchInput").value = type;
  renderResults(facilities.filter((item) => item.type === type));
}

function renderBookings() {
  const container = byId<HTMLElement>("bookingsList");
  container.replaceChildren();

  if (userBookings.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.style.color = "#64748b";
    emptyMessage.textContent = "No active bookings found.";
    container.appendChild(emptyMessage);
    return;
  }

  userBookings.forEach((booking) => {
    const div = document.createElement("div");
    div.className = "list-item";
    const details = document.createElement("div");
    const facility = document.createElement("strong");
    const date = document.createElement("div");
    const cancelButton = document.createElement("button");

    facility.textContent = booking.facility;
    date.style.cssText = "font-size: 0.85rem; color: #64748b;";
    date.textContent = `Date: ${booking.date}`;
    cancelButton.className = "btn-danger";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", () => cancelBooking(booking.id));
    details.append(facility, date);
    div.append(details, cancelButton);
    container.appendChild(div);
  });
}

async function cancelBooking(id: number) {
  try {
    await apiRequest<void>(`/api/bookings/${id}`, { method: "DELETE" });
    userBookings = userBookings.filter((booking) => booking.id !== id);
    renderBookings();
  } catch (error) {
    alert(error instanceof Error ? error.message : "Request failed");
  }
}

byId<HTMLFormElement>("reportForm").addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    try {
      const report = await apiRequest<{ ticketId: number }>("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          facility: byId<HTMLSelectElement>("reportFacility").value,
          category: byId<HTMLSelectElement>("reportType").value,
          details: byId<HTMLTextAreaElement>("reportDetails").value,
        }),
      });
      alert(
        `Maintenance report submitted successfully. Ticket ID: #${report?.ticketId}`,
      );
      (event.currentTarget as HTMLFormElement).reset();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Request failed");
    }
  },
);

function toggleFaq(element: HTMLElement) {
  const answer = element.querySelector<HTMLElement>(".faq-answer");
  if (!answer) return;
  answer.style.display = answer.style.display === "block" ? "none" : "block";
}

Object.assign(window, { quickFilter, switchTab, toggleFaq });
loadInitialData();
