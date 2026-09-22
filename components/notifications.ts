export type NotificationItem = {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
};

export function createNotifications() {
  const button = document.getElementById(
    "notificationButton",
  ) as HTMLButtonElement;
  const dropdown = document.getElementById(
    "notificationDropdown",
  ) as HTMLElement;
  const list = document.getElementById("notificationList") as HTMLElement;
  const badge = document.getElementById("notificationBadge") as HTMLElement;
  let notifications: NotificationItem[] = [];
  let outsideClick: ((event: MouseEvent) => void) | null = null;

  function render() {
    list.replaceChildren();
    const ordered = [...notifications].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    if (ordered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "notification-empty";
      empty.textContent = "No notifications yet.";
      list.appendChild(empty);
    } else {
      ordered.forEach((item) => {
        const entry = document.createElement("div");
        entry.className = `notification-item${item.read ? " read" : ""}`;
        entry.textContent = item.message;
        list.appendChild(entry);
      });
    }
    const unread = notifications.filter((item) => !item.read).length;
    badge.textContent = String(unread);
    badge.hidden = unread === 0;
  }

  function close() {
    dropdown.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (outsideClick) document.removeEventListener("click", outsideClick);
    outsideClick = null;
  }

  function open() {
    notifications = notifications.map((item) => ({ ...item, read: true }));
    render();
    dropdown.hidden = false;
    button.setAttribute("aria-expanded", "true");
    outsideClick = (event) => {
      const target = event.target as Node;
      if (!dropdown.contains(target) && !button.contains(target)) close();
    };
    document.addEventListener("click", outsideClick);
  }

  button.addEventListener("click", () => (dropdown.hidden ? open() : close()));
  render();

  return {
    add(message: string) {
      notifications.push({
        id: Date.now(),
        message,
        createdAt: new Date().toISOString(),
        read: false,
      });
      render();
    },
  };
}
