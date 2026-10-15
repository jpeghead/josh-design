import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveCitation, orderSources, type Source } from "./citation.ts";

const list: Source[] = orderSources([
  { label: "build log", href: "/log" },
  { label: "spin", href: "/work/spin" },
  { label: "about", href: "/about" },
  { label: "builds", href: "/lab" },
]);

test("citations resolve to pages, or to nothing", () => {
  assert.equal(resolveCitation("Spin case study", list)?.href, "/work/spin");
  assert.equal(resolveCitation("About", list)?.href, "/about");
  assert.equal(resolveCitation("the Build log page", list)?.href, "/log");
  assert.equal(resolveCitation("2019", list), null);
});
