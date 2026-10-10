import { byId } from "../dom";

export function setupFaq() {
  const items = Array.from(document.querySelectorAll<HTMLButtonElement>(".faq-item"));
  const empty = byId<HTMLElement>("faqEmpty");

  items.forEach((item) => {
    item.setAttribute("aria-expanded", "false");
    item.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      item.setAttribute("aria-expanded", String(open));
    });
  });

  byId<HTMLInputElement>("faqSearch").addEventListener("input", (event) => {
    const term = (event.target as HTMLInputElement).value.trim().toLowerCase();
    let visible = 0;
    items.forEach((item) => {
      const match = !term || (item.textContent || "").toLowerCase().includes(term);
      item.hidden = !match;
      if (match) visible += 1;
    });
    empty.hidden = visible > 0;
  });
}
