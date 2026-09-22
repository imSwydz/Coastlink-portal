import "./styles.scss";
import "../components/toast.css";
import { showToast } from "../components/toast";

type ApiOptions = RequestInit & { headers?: Record<string, string> };

async function apiRequest<T>(
  url: string,
  options: ApiOptions = {},
): Promise<T | null> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : ((await response.json()) as T);
}

async function loadHomeState() {
  const result = await apiRequest<{
    authenticated: boolean;
    user?: { email: string };
  }>("/api/auth/me");
  const user = document.getElementById("homeUser") as HTMLElement;
  const identity = document.getElementById("homeIdentity") as HTMLElement;
  const avatar = document.getElementById("homeAvatar") as HTMLElement;
  const signIn = document.querySelector(".home-signin-link") as HTMLElement;
  if (result?.authenticated && result.user) {
    user.textContent = result.user.email;
    identity.hidden = false;
    avatar.textContent = result.user.email.charAt(0).toUpperCase();
    signIn.textContent = "Open portal";
    signIn.setAttribute("href", "/index.html");
  }
}

document
  .getElementById("homeLoginForm")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = document.getElementById("homeLoginError") as HTMLElement;
    error.hidden = true;
    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: (document.getElementById("homeEmail") as HTMLInputElement)
            .value,
          password: (
            document.getElementById("homePassword") as HTMLInputElement
          ).value,
        }),
      });
      window.location.href = "/index.html";
    } catch (loginError) {
      error.textContent =
        loginError instanceof Error ? loginError.message : "Sign in failed";
      error.hidden = false;
      showToast({
        message: "Sign in failed. Check your details.",
        type: "error",
      });
    }
  });

loadHomeState().catch(() => undefined);
