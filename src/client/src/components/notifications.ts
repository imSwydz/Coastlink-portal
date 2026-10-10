import type { AppNotification } from "../types";
import { relativeTime } from "../format";
import { el } from "../dom";

type Deps = {
  load: () => Promise<AppNotification[] | null>;
  markRead: () => Promise<void | null>;
};

export function createNotifications({ load, markRead }: Deps) {
  const button = document.getElementById("notificationButton") as HTMLButtonElement;
  const dropdown = document.getElementById("notificationDropdown") as HTMLElement;
  const list = document.getElementById("notificationList") as HTMLElement;
  const badge = document.getElementById("notificationBadge") as HTMLElement;
  let items: AppNotification[] = [];
  let outsideClick: ((event: MouseEvent) => void) | null = null;

  function render() {
    list.replaceChildren();
    if (items.length === 0) {
      list.append(el("p", { class: "notification-empty", text: "No notifications yet." }));
    } else {
      items.forEach((item) =>
        list.append(
          el(
            "div",
            { class: `notification-item${item.read ? " read" : ""}` },
            el("div", { text: item.message }),
            el("small", { class: "notification-time", text: relativeTime(item.createdAt) }),
          ),
        ),
      );
    }
    const unread = items.filter((item) => !item.read).length;
    badge.textContent = String(unread);
    badge.hidden = unread === 0;
  }

  function close() {
    dropdown.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (outsideClick) document.removeEventListener("click", outsideClick);
    outsideClick = null;
  }

  async function open() {
    render();
    dropdown.hidden = false;
    button.setAttribute("aria-expanded", "true");
    outsideClick = (event) => {
      const target = event.target as Node;
      if (!dropdown.contains(target) && !button.contains(target)) close();
    };
    document.addEventListener("click", outsideClick);
    if (items.some((item) => !item.read)) {
      try {
        await markRead();
        // Keep the unread styling visible while open, clear the badge.
        badge.hidden = true;
        items = items.map((item) => ({ ...item, read: true }));
      } catch {
        /* the badge simply stays until the next refresh */
      }
    }
  }

  button.addEventListener("click", () => (dropdown.hidden ? void open() : close()));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dropdown.hidden) {
      close();
      button.focus();
    }
  });
  render();

  return {
    async refresh() {
      try {
        items = (await load()) || [];
        render();
      } catch {
        /* keep showing the last known list */
      }
    },
  };
}
