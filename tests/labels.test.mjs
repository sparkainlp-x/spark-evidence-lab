import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
const expected = { smap: "BASELINE", v2: "BASELINE", qbench: "OPEN", residual: "REPRODUCED", oes512: "EXPLORATORY", thz: "OPEN", qec: "OPEN" };
test("each card has the expected status", () => {
  for (const [id, v] of Object.entries(expected)) assert.match(app, new RegExp(`id:"${id}"[^}]*verdict:"${v}"`));
});
test("labels are calm and neutral", () => {
  for (const l of ["Reproduced", "Baseline stronger", "Open question", "Exploratory", "What I learned", "Next step"]) assert.ok(app.includes(l), l);
  for (const bad of ["NEEDS REVIEW", "Still needed to verify", ">FAIL<", ">PASS<"]) { assert.ok(!app.includes(bad), bad); assert.ok(!html.includes(bad), bad); }
});
test("key numbers unchanged", () => {
  const data = readFileSync(new URL("../site/data.js", import.meta.url), "utf8");
  for (const n of ["0.378601", "0.47541", "0.434783", "0.514286", "v2: { SMAP: 0.213, MSL: 0.434 }", "lo:0.0053, hi:0.0324", "lo:0.0000, hi:0.0538"]) assert.ok(data.includes(n), n);
});
