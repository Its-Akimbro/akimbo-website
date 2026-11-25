import { describe, expect, it } from "vitest";
import { CITY_REGION, FOUNDER_NAME, FOUNDER_PHOTO } from "../../src/placeholders";
import { AUDIT } from "../../src/pricing";
import { dollarAmounts, isSitePath, links, page, region, sitePath, text } from "./dist";
import { unpublishedAmounts } from "./prices";

const home = () => page("/");

describe("home page", () => {
  it("has a \"Book a network audit\" button showing the audit price from the pricing module", () => {
    const ctas = links(home(), "main").filter(
      (link) => link.text.startsWith("Book a network audit") && isSitePath(link.url, "/contact"),
    );

    const priced = ctas.filter((link) => /^Book a network audit · \$[\d,]+$/.test(link.text));

    expect(priced).not.toEqual([]);
    expect(priced.flatMap((link) => dollarAmounts(link.text))).toEqual(priced.map(() => AUDIT.price));
  });

  it("says in its main heading that Akimbo manages networks and servers for local small businesses", () => {
    const h1 = home().html.querySelectorAll("h1");

    expect(h1).toHaveLength(1);
    expect(text(h1[0])).toMatch(/networks and servers for small businesses in/i);
    expect(text(h1[0])).toContain(CITY_REGION);
  });

  it("shows a tile per service, the Network Audit first, each linking on", () => {
    const tiles = region(home(), "Services").querySelectorAll("li");
    const tileLink = (tile: (typeof tiles)[number]) =>
      links({ path: "/", html: tile }).map((link) => sitePath(link.url));

    expect(tiles.map((tile) => text(tile.querySelector("h3")!))).toEqual([
      "Network audit",
      "Managed networking",
      "Servers and virtualisation",
      "Network projects",
    ]);
    expect(tiles.map(tileLink)).toEqual([
      ["/services/network-audit/"],
      ["/services/managed-networking/"],
      ["/services/servers-virtualisation/"],
      ["/services/network-projects/"],
    ]);
  });

  it("marks the Network Audit tile as the place to start, with its fixed price", () => {
    const audit = region(home(), "Services").querySelector("li")!;

    expect(text(audit)).toMatch(/start here/i);
    expect(dollarAmounts(text(audit))).toEqual([AUDIT.price]);
  });

  it("explains how working with Akimbo goes: Audit, then Fix, then Run", () => {
    const steps = region(home(), "How it works").querySelectorAll("ol > li");

    expect(steps.map((step) => text(step.querySelector("h3")!))).toEqual(["Audit", "Fix", "Run"]);
  });

  it("gives three reasons to choose Akimbo: specialists, documented in the Client Portal, local and remote", () => {
    const points = region(home(), "Why Akimbo").querySelectorAll("li").map(text);

    expect(points).toHaveLength(3);
    expect(points[0]).toMatch(/infrastructure specialists/i);
    expect(points[1]).toMatch(/documented/i);
    expect(points[1]).toMatch(/Client Portal/);
    expect(points[2]).toMatch(/local and remote/i);
  });

  it("has a founder trust strip with the founder's name and photo, linking to About", () => {
    const strip = region(home(), "Who you'll work with");
    const photos = strip
      .querySelectorAll("[alt], [aria-label]")
      .filter((el) => (el.getAttribute("alt") ?? el.getAttribute("aria-label")) === FOUNDER_PHOTO);

    expect(text(strip)).toContain(FOUNDER_NAME);
    expect(photos).toHaveLength(1);
    expect(links({ path: "/", html: strip }).some((link) => isSitePath(link.url, "/about"))).toBe(true);
  });

  it("shows no dollar amount the pricing module doesn't publish", () => {
    expect(unpublishedAmounts(text(home().html))).toEqual([]);
  });
});
