// Checks that every repo/commit/path/DOI referenced by the site resolves (HTTP HEAD/GET, follows redirects).
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("../site/app.js", import.meta.url), "utf8") + readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
const urls = new Set([...src.matchAll(/https:\/\/[^\s"'`<>)]+/g)].map(m => m[0]).filter(u => !u.includes("${")));
const gh = "https://github.com/sparkainlp-x/";
for (const m of src.matchAll(/repo:"([^"]+)", sha:"([0-9a-f]{40})"[^}]*?path:"([^"]+)", doi:(?:"([^"]+)"|null)/g)) {
  urls.add(`${gh}${m[1]}/commit/${m[2]}`); urls.add(`${gh}${m[1]}/blob/${m[2]}/${m[3]}`); if (m[4]) urls.add(`https://doi.org/${m[4]}`);
}
let bad = 0;
for (const u of urls) {
  let ok = false, st = 0;
  for (let i = 0; i < 3 && !ok; i++) { try { const r = await fetch(u, { redirect: "follow" }); st = r.status; ok = r.status < 400 || r.status === 429 || r.status === 403 && u.includes("doi.org"); } catch (e) { st = e.message; } }
  console.log(ok ? "ok " : "BAD", st, u); if (!ok) bad++;
}
console.log(`${urls.size} links, ${bad} bad`); process.exit(bad ? 1 : 0);
