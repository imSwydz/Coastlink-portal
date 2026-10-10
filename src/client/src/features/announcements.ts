import { api } from "../api";
import { byId, el } from "../dom";
import { formatDate } from "../format";

/** Closure notices come from the server instead of being typed into the HTML. */
export async function loadAnnouncements() {
  const container = byId<HTMLElement>("announcements");
  try {
    const items = (await api.announcements()) || [];
    container.replaceChildren(
      ...items.map((item) =>
        el(
          "div",
          { class: "nsw-in-page-alert nsw-in-page-alert--warning", attrs: { role: "note" } },
          el("span", { class: "nsw-in-page-alert__icon nsw-material-icons", text: "warning", attrs: { "aria-hidden": "true" } }),
          el(
            "div",
            { class: "nsw-in-page-alert__content" },
            el("strong", { text: "Temporary closure " }),
            `${item.facility} is closed ${formatDate(item.startDate)} to ${formatDate(item.endDate)}. ${item.message}`,
          ),
        ),
      ),
    );
    container.hidden = items.length === 0;
  } catch {
    container.hidden = true;
  }
}
