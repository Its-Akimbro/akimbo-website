// @ts-check
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Static output only: the Marketing Worker serves dist/ as Workers static
// assets (ADR 0001, ADR 0005). No adapter, so no server code is emitted.
export default defineConfig({
  site: "https://akimbo.technology",
  output: "static",
  integrations: [
    // The contact confirmation page is only reached by sending the form.
    sitemap({ filter: (page) => !page.endsWith("/contact/thanks/") }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // The brand theme, fonts and logos live in ../brand, shared with the
    // Client Portal, so the dev server must be allowed to read them.
    server: {
      fs: { allow: [".", fileURLToPath(new URL("../brand", import.meta.url))] },
    },
  },
});
