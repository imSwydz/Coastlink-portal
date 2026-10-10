const { createApp } = require("./app");
const { loadConfig } = require("./config");

const config = loadConfig();
const server = createApp({ config }).listen(config.port, () => {
  console.log(`CoastLink Portal listening on http://localhost:${config.port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
