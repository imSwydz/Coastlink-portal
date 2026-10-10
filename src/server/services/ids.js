function nextId(list, key = "id", floor = 0) {
  return list.reduce((max, item) => Math.max(max, item[key]), floor) + 1;
}

module.exports = { nextId };
