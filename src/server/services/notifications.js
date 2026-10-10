const { nextId } = require("./ids");

const MAX_PER_OWNER = 100;

function notify(database, owner, message, now = new Date()) {
  const entry = {
    id: nextId(database.notifications),
    owner,
    message,
    createdAt: now.toISOString(),
    read: false,
  };
  database.notifications.push(entry);

  const own = database.notifications.filter((item) => item.owner === owner);
  if (own.length > MAX_PER_OWNER) {
    const drop = new Set(own.slice(0, own.length - MAX_PER_OWNER));
    database.notifications = database.notifications.filter(
      (item) => !drop.has(item),
    );
  }
  return entry;
}

module.exports = { notify };
