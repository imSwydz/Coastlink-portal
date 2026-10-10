function notFound(req, res) {
  res.status(404).json({ error: "not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "request body is not valid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "request body is too large" });
  }
  console.error(err);
  return res.status(500).json({ error: "something went wrong" });
}

module.exports = { notFound, errorHandler };
