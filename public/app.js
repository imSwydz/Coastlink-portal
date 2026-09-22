let facilities = [];
let userBookings = [];

async function apiRequest(url, options = {}) {
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
  return response.status === 204 ? null : response.json();
}

async function loadInitialData() {
  const status = document.getElementById("apiStatus");
  try {
    const [health, loadedFacilities, loadedBookings] = await Promise.all([
      apiRequest("/api/health"),
      apiRequest("/api/facilities"),
      apiRequest("/api/bookings"),
    ]);
    facilities = loadedFacilities;
    userBookings = loadedBookings;
    status.textContent =
      health.status === "ok" ? "Backend connected" : "Service issue";
  } catch (error) {
    status.textContent = "Backend offline";
    status.classList.add("offline");
    console.error(error);
  }
}

/* Navigation & Tabs */
function switchTab(tabId, url) {
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".nav-tab")
    .forEach((t) => t.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
  const targetNav = Array.from(document.querySelectorAll(".nav-tab")).find(
    (t) => t.dataset.tab === tabId,
  );
  if (targetNav) targetNav.classList.add("active");
  if (tabId === "tab-bookings") renderBookings();
}

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.onclick = () => switchTab(tab.dataset.tab, tab.dataset.url);
});

/* Facility Search */
function renderResults(list) {
  const section = document.getElementById("resultsSection");
  const container = document.getElementById("resultsContainer");
  container.innerHTML = "";

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

async function bookFacility(name) {
  const date = document.getElementById("dateInput").value;
  if (!date) {
    alert("Please choose a booking date.");
    return;
  }
  try {
    const booking = await apiRequest("/api/bookings", {
      method: "POST",
      body: JSON.stringify({ facility: name, date }),
    });
    userBookings.push(booking);
    alert(`Booking created for ${name} on ${date}.`);
    switchTab("tab-bookings", "coastlink.nsw.gov.au/my-bookings");
  } catch (error) {
    alert(error.message);
  }
}

document.getElementById("searchForm").onsubmit = (e) => {
  e.preventDefault();
  const term = document.getElementById("searchInput").value.toLowerCase();
  const suburb = document.getElementById("suburbSelect").value;
  const minCap = parseInt(document.getElementById("capacitySelect").value, 10);

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
};

document.getElementById("showAllBtn").onclick = () => renderResults(facilities);

function quickFilter(type) {
  document.getElementById("searchInput").value = type;
  renderResults(facilities.filter((item) => item.type === type));
}

/* Bookings Management */
function renderBookings() {
  const container = document.getElementById("bookingsList");
  container.innerHTML = "";

  if (userBookings.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.style.color = "#64748b";
    emptyMessage.textContent = "No active bookings found.";
    container.appendChild(emptyMessage);
    return;
  }

  userBookings.forEach((b) => {
    const div = document.createElement("div");
    div.className = "list-item";
    const details = document.createElement("div");
    const facility = document.createElement("strong");
    const date = document.createElement("div");
    const cancelButton = document.createElement("button");

    facility.textContent = b.facility;
    date.style.cssText = "font-size: 0.85rem; color: #64748b;";
    date.textContent = `Date: ${b.date}`;
    cancelButton.className = "btn-danger";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", () => cancelBooking(b.id));
    details.append(facility, date);
    div.append(details, cancelButton);
    container.appendChild(div);
  });
}

async function cancelBooking(id) {
  try {
    await apiRequest(`/api/bookings/${id}`, { method: "DELETE" });
    userBookings = userBookings.filter((b) => b.id !== id);
    renderBookings();
  } catch (error) {
    alert(error.message);
  }
}

/* Problem Report */
document.getElementById("reportForm").onsubmit = async (e) => {
  e.preventDefault();
  try {
    const report = await apiRequest("/api/reports", {
      method: "POST",
      body: JSON.stringify({
        facility: document.getElementById("reportFacility").value,
        category: document.getElementById("reportType").value,
        details: document.getElementById("reportDetails").value,
      }),
    });
    alert(
      `Maintenance report submitted successfully. Ticket ID: #${report.ticketId}`,
    );
    e.target.reset();
  } catch (error) {
    alert(error.message);
  }
};

/* FAQ Collapsible */
function toggleFaq(el) {
  const answer = el.querySelector(".faq-answer");
  const isVisible = answer.style.display === "block";
  answer.style.display = isVisible ? "none" : "block";
}

loadInitialData();
