import { defineConfig } from "vite";

export default defineConfig({
  root: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        portal: "public/index.html",
        home: "public/home.html",
      },
    },
  },
});
