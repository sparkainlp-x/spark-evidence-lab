// "Build" = copy the static site to dist/ and verify every referenced local asset exists.
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
rmSync("dist", { recursive: true, force: true }); cpSync("site", "dist", { recursive: true });
const html = readFileSync("dist/index.html", "utf8");
for (const [, f] of html.matchAll(/(?:src|href)="([^":#]+)"/g)) if (!existsSync("dist/" + f)) { console.error("missing", f); process.exit(1); }
console.log("dist/ ready");
