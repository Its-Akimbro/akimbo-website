// brand/theme.css: red is for the audit CTA, and red-dark also for error
// messages and invalid fields. Every class string comes from src/, so red
// utilities may appear only in the files that own those uses.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "../../src");

/** The files allowed to use red utilities, and the colours each may use. */
const ALLOWED: Record<string, string[]> = {
  "components/AuditCta.astro": ["red", "red-dark"],
  "error-styles.ts": ["red-dark"],
};

/**
 * A Tailwind colour utility in red, with any variants: `hover:bg-red-dark`,
 * and Tailwind's own reds (`text-red-500`), which the brand never allows.
 */
const RED_UTILITY =
  /(?<![\w-])(?:[\w[\]&-]+:)*(?:text|bg|border(?:-[trblxyse])?|ring|ring-offset|outline|fill|stroke|decoration|divide|accent|caret|shadow|from|via|to|placeholder)-(red(?:-dark|-\d{2,3})?)(?![\w-])/g;

function sourceFiles(dir = SRC): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(astro|ts|tsx|js|css)$/.test(entry.name) ? [full] : [];
  });
}

describe("brand red", () => {
  it("is used only by the audit CTA and the error styles", () => {
    const misuse = sourceFiles().flatMap((file) => {
      const path = relative(SRC, file).split(sep).join("/");
      return readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, i) =>
          [...line.matchAll(RED_UTILITY)]
            .filter(([, colour]) => !ALLOWED[path]?.includes(colour))
            .map(([utility]) => `src/${path}:${i + 1} ${utility}`),
        );
    });

    expect(misuse).toEqual([]);
  });

  it("would catch red used anywhere else", () => {
    expect("text-red-dark".match(RED_UTILITY)).toEqual(["text-red-dark"]);
    expect("lg:hover:bg-red".match(RED_UTILITY)).toEqual(["lg:hover:bg-red"]);
    expect("text-red-500".match(RED_UTILITY)).toEqual(["text-red-500"]);
    expect("a red flag, brand-red.test.ts, text-reddish".match(RED_UTILITY)).toBeNull();
  });
});
