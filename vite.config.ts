import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  ...(process.env["NETLIFY"] || process.env["NITRO_PRESET"] === "netlify"
    ? { nitro: { preset: "netlify" } }
    : {}),
});