import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["test/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "worker",
          include: ["test/worker/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "site",
          include: ["test/site/**/*.test.ts"],
        },
      },
    ],
  },
});
