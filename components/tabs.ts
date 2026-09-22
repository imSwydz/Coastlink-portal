export function setupTabs(onTabChange: (tabId: string) => void) {
  const tabs = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(".nsw-tabs__link"),
  );
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
      tab.setAttribute("role", "tab");
      tab.tabIndex = selected ? 0 : -1;
      tab.setAttribute("aria-controls", tab.hash.slice(1));
    });

    panel.hidden = false;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute(
      "aria-labelledby",
      tabs.find((tab) => tab.dataset.tab === tabId)?.id || "",
    );
    panel.classList.add("active", "tab-enter");
    onTabChange(tabId);
  };

  tabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      const tabId = tab.dataset.tab || tab.hash.slice(1);
      if (tabId) activate(tabId);
    });
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const nextIndex =
        event.key === "ArrowRight"
          ? (index + 1) % tabs.length
          : (index - 1 + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];
      nextTab.focus();
      activate(nextTab.dataset.tab || nextTab.hash.slice(1));
    });
  });

  const initialTab =
    tabs.find((tab) => tab.classList.contains("active")) || tabs[0];
  if (initialTab) activate(initialTab.dataset.tab || initialTab.hash.slice(1));

  return activate;
}
