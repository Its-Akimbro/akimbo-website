// The branded page a Portal User sees while the house or the portal guest is
// down (spec #16, user story 29). It must look like the Marketing Site and
// meet WCAG 2.2 AA (user stories 30 and 31).
import { parse, type HTMLElement } from "node-html-parser";
import { describe, expect, it } from "vitest";
import { createHarness } from "./harness";

async function outagePage(): Promise<{ response: Response; html: string; page: HTMLElement }> {
  const edge = createHarness(() => {
    throw new TypeError("Network connection lost.");
  });
  const response = await edge.fetch("https://portal.akimbo.technology/");
  const html = await response.text();
  return { response, html, page: parse(html) };
}

const text = (element: HTMLElement | null) => element?.textContent.replace(/\s+/g, " ").trim();

describe("the outage page", () => {
  it("says the Client Portal is temporarily unavailable", async () => {
    const { page } = await outagePage();

    expect(text(page.querySelector("title"))).toBe(
      "Client Portal temporarily unavailable | Akimbo Technology",
    );
    expect(page.querySelectorAll("h1").map(text)).toEqual([
      "Client Portal temporarily unavailable",
    ]);
  });

  it("gives hello@, the phone number and business hours", async () => {
    const { page } = await outagePage();
    const main = page.querySelector("main")!;

    const email = main.querySelector('a[href="mailto:hello@akimbo.technology"]');
    expect(text(email)).toBe("hello@akimbo.technology");
    expect(main.querySelector('a[href^="tel:"]')).not.toBeNull();
    expect(text(main)).toContain("Monday–Friday, 8am–5pm Eastern");
  });

  it("is kept out of search results", async () => {
    const { page } = await outagePage();

    expect(page.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
  });

  it("loads nothing from any origin, so it shows even when nothing else is reachable", async () => {
    const { response, page } = await outagePage();

    const loaded = [
      ...page.querySelectorAll("[src]").map((el) => el.getAttribute("src")!),
      ...page.querySelectorAll("link[href]").map((el) => el.getAttribute("href")!),
    ];
    expect(loaded.filter((url) => !url.startsWith("data:"))).toEqual([]);
    expect(page.querySelectorAll("script")).toHaveLength(0);
    // The CSP also stops anything the page might grow later from loading.
    expect(response.headers.get("content-security-policy")).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    );
  });

  it("wears the Marketing Site's header band, lockup and fonts", async () => {
    const { page } = await outagePage();

    const header = page.querySelector("header")!;
    expect(header.classList.contains("bg-navy")).toBe(true);
    const lockup = header.querySelector("img")!;
    expect(lockup.getAttribute("alt")).toBe("Akimbo Technology");
    expect(lockup.getAttribute("src")).toMatch(/^data:image\/png;base64,/);
    expect(header.querySelector("a")?.getAttribute("href")).toBe("https://akimbo.technology/");

    const css = page.querySelector("style")!.textContent;
    expect(css).toContain("--color-navy:#0d213c");
    expect(css).toMatch(/font-family:\s*"?Montserrat"?/);
    expect(css).toMatch(/font-family:\s*"?Inter"?/);
    expect(css).toContain("url(data:font/woff2;base64,");
    expect(css).not.toMatch(/url\(["']?\.\//);
  });
});

describe("the outage page's accessibility (WCAG 2.2 AA)", () => {
  it("declares its language and lets the page zoom", async () => {
    const { page } = await outagePage();

    expect(page.querySelector("html")?.getAttribute("lang")).toBe("en");
    const viewport = page.querySelector('meta[name="viewport"]')?.getAttribute("content");
    expect(viewport).toBe("width=device-width, initial-scale=1");
  });

  it("has header, main and footer landmarks", async () => {
    const { page } = await outagePage();

    for (const landmark of ["header", "main", "footer"]) {
      expect(page.querySelectorAll(landmark)).toHaveLength(1);
    }
  });

  it("gives every image alt text and every link a name", async () => {
    const { page } = await outagePage();

    for (const img of page.querySelectorAll("img")) {
      expect(img.getAttribute("alt")).toBeTruthy();
    }
    for (const link of page.querySelectorAll("a")) {
      const name = text(link) || link.querySelector("img")?.getAttribute("alt");
      expect(name, link.toString()).toBeTruthy();
    }
  });

  it("keeps every text colour at 4.5:1 or better on its background", async () => {
    const { page } = await outagePage();
    const palette = paletteFrom(page.querySelector("style")!.textContent);

    const failures: string[] = [];
    for (const element of page.querySelectorAll("body, body *")) {
      const fg = colourOf(element, "text", palette);
      const bg = colourOf(element, "bg", palette);
      const ratio = contrast(fg, bg);
      if (ratio < 4.5) failures.push(`${element.tagName} ${fg} on ${bg}: ${ratio.toFixed(2)}`);
    }

    expect(failures).toEqual([]);
  });
});

// The text and background colour an element gets from its own or its nearest
// ancestor's Tailwind `text-<colour>` / `bg-<colour>` class, resolved through
// the theme's `--color-*` variables in the page's own CSS. Unstyled text is
// the theme's body default: navy on white.
const DEFAULTS = { text: "navy", bg: "white" } as const;

function paletteFrom(css: string): Record<string, string> {
  const palette: Record<string, string> = { white: "#ffffff", black: "#000000" };
  for (const [, name, value] of css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)) {
    palette[name] = value.toLowerCase();
  }
  return palette;
}

function colourOf(
  element: HTMLElement,
  kind: "text" | "bg",
  palette: Record<string, string>,
): string {
  for (let el: HTMLElement | null = element; el; el = el.parentNode) {
    for (const cls of el.classList?.values() ?? []) {
      const name = cls.match(new RegExp(`^${kind}-([a-z]+(?:-[a-z]+)?)$`))?.[1];
      if (name && palette[name]) return palette[name];
    }
  }
  return palette[DEFAULTS[kind]];
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
