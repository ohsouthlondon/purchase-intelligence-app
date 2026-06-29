import { describe, expect, it } from "vitest";

import { isActiveRoute, NAV_ITEMS } from "@/lib/navigation";

describe("NAV_ITEMS", () => {
  it("exposes the five top-level destinations", () => {
    expect(NAV_ITEMS).toHaveLength(5);
  });

  it("has unique hrefs", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("includes the root inbox route", () => {
    expect(NAV_ITEMS.map((item) => item.href)).toContain("/");
  });

  it("gives every item a non-empty label and an icon", () => {
    for (const item of NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon).toBeDefined();
    }
  });
});

describe("isActiveRoute", () => {
  it("matches the root only on an exact path", () => {
    expect(isActiveRoute("/", "/")).toBe(true);
    expect(isActiveRoute("/", "/dashboard")).toBe(false);
  });

  it("matches a section and its nested paths", () => {
    expect(isActiveRoute("/capture", "/capture")).toBe(true);
    expect(isActiveRoute("/capture", "/capture/manual")).toBe(true);
  });

  it("does not match a different route with a shared prefix", () => {
    expect(isActiveRoute("/capture", "/captured")).toBe(false);
  });
});
