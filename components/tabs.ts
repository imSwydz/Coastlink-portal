export function setupTabs(onTabChange: (tabId: string) => void) {
  const tabs = Array.from(document.querySelectorAll<HTMLElement>(".nav-tab"));
  const panels = Array.from(
    document.querySelectorAll<HTMLElement>(".tab-content"),
  );

  const activate = (tabId: string) => {
    const panel = document.getElementById(tabId);
    if (!panel) return;

    panels.forEach((candidate) => {
      candidate.classList.remove("active", "tab-enter");
      candidate.hidden = candidate !== panel;
    });
    tabs.forEach((tab) => {
      const selected = tab.dataset.tab === tabId;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });

    panel.hidden = false;
    panel.classList.add("active", "tab-enter");
    onTabChange(tabId);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      if (tabId) activate(tabId);
    });
  });

  return activate;
}
