import { defineConfig } from "vite";

// The front end lives in src/client. `npm run build` writes it to dist/,
// which the Express server then serves.
export default defineConfig({
  root: "src/client",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        portal: "src/client/index.html",
        home: "src/client/home.html",
      },
    },
  },
  server: {
    // `npm run dev`: the Vite dev server forwards API calls to Express.
    proxy: { "/api": "http://localhost:3000" },
  },
});
