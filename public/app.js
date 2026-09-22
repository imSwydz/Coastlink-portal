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
    container.innerHTML =
      '<p style="color: #64748b;">No matching facilities found.</p>';
  } else {
    list.forEach((item) => {
      const div = document.createElement("div");
      div.className = "list-item";
      div.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <div style="font-size: 0.85rem; color: #64748b;">${item.suburb} &bull; Capacity: ${item.capacity}</div>
      </div>
      <button class="btn-dark" onclick="bookFacility('${item.name}')">Book</button>
    `;
      container.appendChild(div);
    });
  }
  section.style.display = "block";
}

async function bookFacility(name) {
  const date = document.getElementById("dateInput").value || "Upcoming";
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
    container.innerHTML =
      '<p style="color: #64748b;">No active bookings found.</p>';
    return;
  }

  userBookings.forEach((b) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
    <div>
      <strong>${b.facility}</strong>
      <div style="font-size: 0.85rem; color: #64748b;">Date: ${b.date}</div>
    </div>
    <button class="btn-danger" onclick="cancelBooking(${b.id})">Cancel</button>
  `;
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
