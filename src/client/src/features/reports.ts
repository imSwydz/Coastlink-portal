import { api } from "../api";
import { byId, el, setBusy } from "../dom";
import { relativeTime } from "../format";
import { showToast } from "../components/toast";
import { state, type Context } from "../state";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const errorIds: Record<string, string> = {
  reportFacility: "reportFacilityError",
  reportType: "reportTypeError",
  reportDetails: "reportDetailsError",
};

function validate(input: Field) {
  const min = state.config?.minDetailsLength ?? 5;
  let message = "";
  if (input.id === "reportFacility" && !input.value) message = "Choose a facility.";
  if (input.id === "reportType" && !input.value) message = "Choose an issue category.";
  if (input.id === "reportDetails" && input.value.trim().length < min) {
    message = `Enter at least ${min} characters.`;
  }
  const helper = byId<HTMLElement>(errorIds[input.id]);
  helper.hidden = !message;
  helper.textContent = message;
  input.setAttribute("aria-invalid", String(Boolean(message)));
  return !message;
}

function fillSelect(select: HTMLSelectElement, placeholder: string, values: string[]) {
  select.replaceChildren(
    el("option", { text: placeholder, attrs: { value: "" } }),
    ...values.map((value) => el("option", { text: value, attrs: { value } })),
  );
}

export function populateReportForm() {
  if (state.facilities.length) {
    fillSelect(byId("reportFacility"), "Choose a facility...", state.facilities.map((f) => f.name));
  }
  if (state.config) {
    fillSelect(byId("reportType"), "Choose a category...", state.config.reportCategories);
  }
  const max = state.config?.maxDetailsLength ?? 1000;
  byId<HTMLTextAreaElement>("reportDetails").maxLength = max;
  updateCounter();
}

function updateCounter() {
  const max = state.config?.maxDetailsLength ?? 1000;
  byId<HTMLElement>("reportCounter").textContent =
    `${byId<HTMLTextAreaElement>("reportDetails").value.length}/${max}`;
}

export function renderReports() {
  const container = byId<HTMLElement>("reportsList");
  container.replaceChildren();
  if (state.reports.length === 0) {
    container.append(el("p", { class: "empty-message", text: "You haven't reported any problems yet." }));
    return;
  }
  const steps = state.config?.reportStatuses ?? ["Received", "Triaged", "In progress", "Resolved"];
  state.reports.forEach((report) => {
    const reached = steps.indexOf(report.status);
    container.append(
      el(
        "div",
        { class: "nsw-card report-card" },
        el(
          "div",
          { class: "report-head" },
          el("strong", { text: `Ticket #${report.ticketId}` }),
          el("span", {
            class: `status status--${report.status.toLowerCase().replace(/\s+/g, "-")}`,
            text: report.status,
          }),
        ),
        el("div", { class: "item-summary", text: `${report.facility} • ${report.category} • ${relativeTime(report.createdAt)}` }),
        el("p", { class: "report-details", text: report.details }),
        el(
          "ol",
          { class: "progress", attrs: { "aria-label": `Progress: ${report.status}` } },
          ...steps.map((step, index) =>
            el("li", { class: index <= reached ? "done" : "", text: step }),
          ),
        ),
      ),
    );
  });
}

export function setupReports(ctx: Context) {
  const form = byId<HTMLFormElement>("reportForm");
  const fields = Array.from(
    form.querySelectorAll<Field>("select, textarea"),
  );

  fields.forEach((input) => {
    input.addEventListener("blur", () => validate(input));
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") validate(input);
    });
  });
  byId("reportDetails").addEventListener("input", updateCounter);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!fields.map(validate).every(Boolean)) {
      showToast({ message: "Please fix the highlighted fields.", type: "error" });
      return;
    }
    const button = byId<HTMLButtonElement>("reportSubmitButton");
    setBusy(button, true, "Submitting");
    try {
      const report = await api.createReport(
        byId<HTMLSelectElement>("reportFacility").value,
        byId<HTMLSelectElement>("reportType").value,
        byId<HTMLTextAreaElement>("reportDetails").value,
      );
      showToast({ message: `Maintenance report submitted. Ticket #${report?.ticketId}.`, type: "success" });
      form.reset();
      updateCounter();
      await Promise.all([ctx.refreshReports(), ctx.refreshNotifications()]);
      byId<HTMLElement>("reportsList").scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Report failed", type: "error" });
    } finally {
      setBusy(button, false, "Submit Report");
    }
  });
}
