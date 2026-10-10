export const byId = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

type Props = {
  class?: string;
  text?: string;
  attrs?: Record<string, string>;
  on?: Partial<Record<keyof HTMLElementEventMap, EventListener>>;
};

/** Small safe element builder: text is always set with textContent. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [name, value] of Object.entries(props.attrs || {})) {
    node.setAttribute(name, value);
  }
  for (const [name, handler] of Object.entries(props.on || {})) {
    node.addEventListener(name, handler as EventListener);
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
}

/** Runs `task` now and then every `ms`, pausing while the tab is hidden. */
export function poll(task: () => void | Promise<void>, ms: number) {
  window.setInterval(() => {
    if (!document.hidden) void task();
  }, ms);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void task();
  });
}

/** Disables a button and swaps its label while a request is running. */
export function setBusy(button: HTMLButtonElement, busy: boolean, label: string) {
  if (busy) {
    button.dataset.originalLabel = button.textContent || label;
    button.disabled = true;
    button.textContent = `${label}…`;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalLabel || label;
  }
}
