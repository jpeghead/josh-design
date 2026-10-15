import { test } from "node:test";
import assert from "node:assert/strict";
import { ago } from "./github.ts";

test("ago() reads naturally at every scale", () => {
  const now = Date.now();
  assert.equal(ago(new Date(now - 30_000).toISOString()), "1m ago");
  assert.equal(ago(new Date(now - 5 * 60_000).toISOString()), "5m ago");
  assert.equal(ago(new Date(now - 3 * 3_600_000).toISOString()), "3h ago");
  assert.equal(ago(new Date(now - 2 * 86_400_000).toISOString()), "2d ago");
  assert.match(ago("2026-01-15T12:00:00Z"), /Jan 1[45]/);
});
