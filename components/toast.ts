export type ToastType = "success" | "error" | "info";

type ToastOptions = {
  message: string;
  type?: ToastType;
};

const icons: Record<ToastType, string> = {
  success: "✓",
  error: "!",
  info: "i",
};

function ensureContainer() {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }
  return container;
}

export function showToast({ message, type = "info" }: ToastOptions) {
  const container = ensureContainer();
  const toast = document.createElement("div");
  const close = document.createElement("button");
  const icon = document.createElement("span");

  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");
  icon.className = "toast-icon";
  icon.textContent = icons[type];
  const text = document.createElement("span");
  text.className = "toast-message";
  text.textContent = message;
  close.className = "toast-close";
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss notification");
  close.textContent = "×";

  const dismiss = () => toast.remove();
  close.addEventListener("click", dismiss);
  toast.append(icon, text, close);
  container.appendChild(toast);
  window.setTimeout(dismiss, 4000);
}
