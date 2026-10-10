/**
 * Why a facility cannot be booked on a date, or null when it is free.
 * Shared by the search results and the booking endpoint so both always agree.
 */
function getUnavailableReason(database, facility, date) {
  const closed = database.closures.some(
    (closure) =>
      closure.facilityId === facility.id &&
      date >= closure.startDate &&
      date <= closure.endDate,
  );
  if (closed) return "Closed";
  const booked = database.bookings.some(
    (booking) => booking.facility === facility.name && booking.date === date,
  );
  return booked ? "Booked" : null;
}

module.exports = { getUnavailableReason };
