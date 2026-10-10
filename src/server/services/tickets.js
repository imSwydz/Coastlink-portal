const { notify } = require("./notifications");

const statuses = ["Received", "Triaged", "In progress", "Resolved"];

/**
 * Demo helper: moves tickets forward based on their age so the resident can
 * watch the status change. Returns true when something changed.
 * Turn it off with COASTLINK_TICKET_SIMULATION=off.
 */
function advanceTickets(database, config, now = new Date()) {
  if (!config.reports.simulateProgress) return false;
  const thresholds = config.reports.progressAfterSeconds;
  let changed = false;

  for (const report of database.reports) {
    const ageSeconds = (now - new Date(report.createdAt)) / 1000;
    let index = 0;
    thresholds.forEach((seconds, step) => {
      if (ageSeconds >= seconds) index = step + 1;
    });
    const target = statuses[Math.min(index, statuses.length - 1)];
    if (statuses.indexOf(target) > statuses.indexOf(report.status)) {
      report.status = target;
      report.updatedAt = now.toISOString();
      notify(
        database,
        report.owner,
        `Ticket #${report.ticketId} is now ${target.toLowerCase()}.`,
        now,
      );
      changed = true;
    }
  }
  return changed;
}

module.exports = { statuses, advanceTickets };
