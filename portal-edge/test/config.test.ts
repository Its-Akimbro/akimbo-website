// wrangler.jsonc is the only record of where the Worker runs, so it is read
// as data: the route decides which hostname gets the outage page.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const config = ts.parseConfigFileTextToJson(
  "wrangler.jsonc",
  readFileSync(join(import.meta.dirname, "..", "wrangler.jsonc"), "utf8"),
).config;

describe("wrangler.jsonc", () => {
  it("routes the portal host only, never the admin host", () => {
    expect(config.routes).toEqual([
      { pattern: "portal.akimbo.technology/*", zone_name: "akimbo.technology" },
    ]);
    expect(config.vars).toEqual({ PORTAL_HOST: "portal.akimbo.technology" });
  });

  it("is its own Worker, apart from the Marketing Worker", () => {
    expect(config.name).toBe("akimbo-portal-edge");
  });

  it("binds nothing and declares no secrets", () => {
    const bindingKeys = Object.keys(config).filter((key) =>
      ["assets", "kv_namespaces", "d1_databases", "r2_buckets", "services", "durable_objects", "secrets"].includes(key),
    );
    expect(bindingKeys).toEqual([]);
  });
});
