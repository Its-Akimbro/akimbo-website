// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static output only: the Marketing Worker serves dist/ as Workers static
// assets (ADR 0001, ADR 0005). No adapter, so no server code is emitted.
export default defineConfig({
  site: "https://akimbo.technology",
  output: "static",
  integrations: [sitemap()],
});
