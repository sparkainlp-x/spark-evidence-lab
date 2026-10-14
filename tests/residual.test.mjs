import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { evaluateResidual, DIMENSION } = require("../site/residual.js");
const V = JSON.parse(readFileSync(new URL("./vectors.json", import.meta.url)));

test("dimension is 32", () => assert.equal(DIMENSION, 32));
test(`JS port matches Python reference on ${V.valid.length} vectors (bit-exact)`, () => {
  for (const c of V.valid) {
    const r = evaluateResidual(c.reference, c.observed, c.tolerance);
    assert.deepEqual(r.component_residuals, c.component_residuals);
    assert.equal(r.aggregate_residual, c.aggregate_residual);
    assert.equal(r.passed, c.passed);
  }
});
test("equal to tolerance passes; strictly greater fails", () => {
  const z = Array(32).fill(0), a = z.slice(); a[0] = 0.25;
  assert.equal(evaluateResidual(z, a, 0.25).passed, true);
  a[0] = 0.250001; assert.equal(evaluateResidual(z, a, 0.25).failed, true);
});
test("invalid inputs rejected", () => {
  for (const c of V.invalid) assert.throws(() => evaluateResidual(c.reference, c.observed, c.tolerance));
  const z = Array(32).fill(0), n = z.slice(); n[0] = NaN; const inf = z.slice(); inf[0] = Infinity;
  assert.throws(() => evaluateResidual(n, z, 0)); assert.throws(() => evaluateResidual(z, inf, 0));
  assert.throws(() => evaluateResidual(z, z, NaN)); assert.throws(() => evaluateResidual(z, z, true));
});
