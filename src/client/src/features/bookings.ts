import { api } from "../api";
import { byId, el, setBusy } from "../dom";
import { addDays, daysBetween, formatDate, whenText } from "../format";
import { showToast } from "../components/toast";
import { state, today, type Context } from "../state";
import type { Booking } from "../types";

export function renderBookings(ctx: Context) {
  const container = byId<HTMLElement>("bookingsList");
  container.replaceChildren();

  if (state.bookings.length === 0) {
    container.append(
      el(
        "div",
        { class: "empty-message empty-state" },
        el("p", { text: "You have no bookings yet." }),
        el("button", {
          class: "nsw-button nsw-button--dark",
          text: "Find a facility",
          attrs: { type: "button" },
          on: { click: () => ctx.switchTab("tab-book") },
        }),
      ),
    );
    return;
  }

  const upcoming = state.bookings.filter((b) => b.date >= today());
  const past = state.bookings.filter((b) => b.date < today()).reverse();

  const section = (title: string, items: Booking[], isPast: boolean) => {
    if (items.length === 0) return;
    container.append(el("h3", { class: "tasks-heading", text: `${title} (${items.length})` }));
    items.forEach((booking) => container.append(card(booking, isPast, ctx)));
  };
  section("Upcoming", upcoming, false);
  section("Past", past, true);
}

function card(booking: Booking, isPast: boolean, ctx: Context) {
  const daysAway = daysBetween(today(), booking.date);
  const refundDays = state.config?.fullRefundDays ?? 7;
  const actions = el("div", { class: "booking-actions" });

  const showCancel = () => {
    actions.replaceChildren(
      el("button", {
        class: "nsw-button nsw-button--danger",
        text: "Cancel booking",
        attrs: { type: "button" },
        on: { click: showConfirm },
      }),
    );
  };
  const showConfirm = () => {
    const confirm = el("button", {
      class: "nsw-button nsw-button--danger",
      text: "Yes, cancel",
      attrs: { type: "button" },
    });
    confirm.addEventListener("click", async () => {
      setBusy(confirm, true, "Cancelling");
      try {
        await api.cancelBooking(booking.id);
        showToast({ message: "Booking cancelled.", type: "info" });
        await Promise.all([ctx.refreshBookings(), ctx.refreshNotifications()]);
        ctx.search();
      } catch (error) {
        setBusy(confirm, false, "Yes, cancel");
        showToast({ message: error instanceof Error ? error.message : "Cancellation failed", type: "error" });
      }
    });
    actions.replaceChildren(
      confirm,
      el("button", {
        class: "nsw-button nsw-button--light-outline",
        text: "Keep booking",
        attrs: { type: "button" },
        on: { click: showCancel },
      }),
    );
    confirm.focus();
  };

  if (isPast) {
    actions.append(el("span", { class: "tag", text: "Completed" }));
  } else {
    showCancel();
  }

  const refundNote = isPast
    ? null
    : el("div", {
        class: "item-summary",
        text:
          daysAway >= refundDays
            ? `Full refund if cancelled by ${formatDate(addDays(booking.date, -refundDays))}`
            : `Inside the ${refundDays}-day cancellation window`,
      });

  return el(
    "div",
    { class: `nsw-card facility-card booking-card${isPast ? " is-past" : ""}` },
    el(
      "div",
      { class: "nsw-card__content" },
      el(
        "div",
        { class: "facility-info" },
        el("strong", { text: booking.facility }),
        el("div", { class: "item-summary", text: `${formatDate(booking.date)} • ${whenText(daysAway)}` }),
        refundNote,
      ),
      actions,
    ),
  );
}
