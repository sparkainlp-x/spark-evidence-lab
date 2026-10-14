"use strict";
const L = window.LAB, GH = "https://github.com/sparkainlp-x/", $ = (s, r = document) => r.querySelector(s);
const C = { gold:"#c9a84c", cyan:"#38d6e8", red:"#b7c3da", green:"#4cd28a", amber:"#f0b44a", mut:"#9fb0cf", line:"#22345a", txt:"#e6ecf7" };
const VL = { REPRODUCED:"Reproduced", BASELINE:"Baseline stronger", OPEN:"Open question", EXPLORATORY:"Exploratory" };
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;" }[c]));
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// ---------- SVG helpers ----------
function bars(items, { max = 1, ref = null, refLabel = "", fmt = v => v.toFixed(3) } = {}) {
  const W = 720, rowH = 34, H = items.length * rowH + 30, x0 = 120, xw = W - x0 - 190, X = v => x0 + Math.max(0, v) / max * xw;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (let g = 0; g <= 4; g++) { const v = max * g / 4; s += `<line x1="${X(v)}" x2="${X(v)}" y1="0" y2="${H - 22}" stroke="${C.line}"/><text x="${X(v)}" y="${H - 6}" fill="${C.mut}" font-size="11" text-anchor="middle">${fmt(v)}</text>`; }
  items.forEach((it, i) => { const y = i * rowH + 6;
    s += `<text x="${x0 - 10}" y="${y + 17}" fill="${it.hi ? C.gold : C.txt}" font-size="13" text-anchor="end" font-weight="${it.hi ? 700 : 400}">${esc(it.label)}</text>`;
    s += `<rect x="${x0}" y="${y + 4}" width="${X(it.v) - x0}" height="18" rx="4" fill="${it.color || (it.hi ? C.gold : C.cyan)}" opacity="${it.hi ? 1 : .55}"/>`;
    if (it.lo != null) s += `<line x1="${X(it.lo)}" x2="${X(it.hi2 ?? it.up)}" y1="${y + 13}" y2="${y + 13}" stroke="${C.txt}" stroke-width="2"/><line x1="${X(it.lo)}" x2="${X(it.lo)}" y1="${y + 7}" y2="${y + 19}" stroke="${C.txt}"/><line x1="${X(it.up)}" x2="${X(it.up)}" y1="${y + 7}" y2="${y + 19}" stroke="${C.txt}"/>`;
    s += `<text x="${Math.max(X(it.v), it.up != null ? X(it.up) : 0) + 6}" y="${y + 18}" fill="${C.mut}" font-size="12">${esc(it.text ?? fmt(it.v))}</text>`; });
  if (ref != null) s += `<line x1="${X(ref)}" x2="${X(ref)}" y1="0" y2="${H - 22}" stroke="${C.red}" stroke-dasharray="4 3"/><text x="${X(ref) + 4}" y="12" fill="${C.red}" font-size="11">${esc(refLabel)}</text>`;
  return s + "</svg>";
}
function lines(series, { h = 220, yMin, yMax, marks = [], hlines = [], xLabel = "" } = {}) {
  const W = 720, H = h, p = 34, n = series[0].y.length;
  const all = series.flatMap(s => s.y).concat(hlines.map(l => l.y));
  const lo = yMin ?? Math.min(...all), hi = yMax ?? Math.max(...all), Y = v => H - 22 - (v - lo) / ((hi - lo) || 1) * (H - 40), X = i => p + i / (n - 1) * (W - p - 8);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img"><line x1="${p}" x2="${W}" y1="${H - 22}" y2="${H - 22}" stroke="${C.line}"/>`;
  marks.forEach(m => s += `<line x1="${X(m.x)}" x2="${X(m.x)}" y1="8" y2="${H - 22}" stroke="${m.color}" stroke-dasharray="3 3"/><text x="${X(m.x) + 3}" y="${m.y ?? 16}" fill="${m.color}" font-size="11">${esc(m.label)}</text>`);
  hlines.forEach(l => s += `<line x1="${p}" x2="${W}" y1="${Y(l.y)}" y2="${Y(l.y)}" stroke="${l.color}" stroke-dasharray="6 3"/><text x="${p + 4}" y="${Y(l.y) - 4}" fill="${l.color}" font-size="11">${esc(l.label)}</text>`);
  series.forEach(se => { s += `<polyline fill="none" stroke="${se.color}" stroke-width="1.6" points="${se.y.map((v, i) => X(i).toFixed(1) + "," + Y(v).toFixed(1)).join(" ")}"/>`; });
  s += `<text x="${W - 4}" y="${H - 6}" fill="${C.mut}" font-size="11" text-anchor="end">${esc(xLabel)}</text>`;
  return s + `<text x="${p - 4}" y="${Y(hi) + 4}" fill="${C.mut}" font-size="10" text-anchor="end">${+hi.toPrecision(3)}</text><text x="${p - 4}" y="${Y(lo)}" fill="${C.mut}" font-size="10" text-anchor="end">${+lo.toPrecision(3)}</text></svg>`;
}
const legend = items => `<div class="ctl">${items.map(([c, t]) => `<span><b style="color:${c}">━</b> ${esc(t)}</span>`).join("")}</div>`;

// ---------- experiments ----------
const EXP = [
 { id:"smap", learned:'On this data the plain max|x| over the window did at least as well as OES32; the extra weighting showed no measurable gain.', verdict:"BASELINE", tags:["real public data","NASA SMAP/MSL"], title:"Blind NASA SMAP/MSL test: OES32 v1 vs simple baselines",
   claim:"OES32 detects real spacecraft telemetry anomalies better than simple baselines (preregistered success criterion).",
   cond:"Hundman et al. 2018 SMAP (54 channels, 68 events) and MSL (27 channels, 36 events); protocol locked and pushed before test scoring; train-only thresholds at a 1% false-positive target; pooled event-level F1 with 95% bootstrap CIs.",
   diff:"SMAP: OES32 0.379 vs max|x| 0.475. MSL: OES32 0.435 vs max|x| 0.500 and CUSUM 0.514. Differences vs the better baselines are not significant; OES32 was significantly better only than EWMA on SMAP.",
   need:"An external timestamp for the protocol lock (it is self-timestamped ~10 minutes before the results merged) and an independent rerun.",
   repo:"oes-resilience", sha:"e3e03d5cc6b54e9d9818fd83d7a1e041f6800224", path:"reports/smap_msl_results/smap_msl_summary.csv", doi:"10.5281/zenodo.23128059",
   rerun:`git clone https://github.com/sparkainlp-x/oes-resilience && cd oes-resilience\ngit checkout e3e03d5\npip install -e .\npython scripts/fetch_smap_msl.py   # downloads public data, verifies SHA-256\npytest tests/test_smap_msl.py`, render: renderSmap },
 { id:"v2", learned:'A wider validation search did not transfer to the real test split; tuning on synthetic injections was not enough.', verdict:"BASELINE", tags:["real public data","locked protocol"], title:"OES-32-v2: a second attempt, also failed",
   claim:"A validation-selected v2 detector improves event F1 over frozen v1 by at least +0.05 on both SMAP and MSL.",
   cond:"4,223 validation-only trials on synthetic injections, frozen config, test split run exactly once (protocol 8b474b6, test lock 5477ffb, run 7b46a3b).",
   diff:"v2 − v1 event F1: −0.166 on SMAP (0.213 vs 0.379), −0.001 on MSL (0.434 vs 0.435). Required: +0.05 on each. Runtime 2.27× v1 against a 2× limit.",
   need:"Nothing to rescue here: the criterion was predeclared and missed. Kept as a documented negative result.",
   repo:"oes-resilience", sha:"79edb72c861fa487ec63e14f9d10d0a55525d513", path:"oes32-v2/reports/OES32_V2_REPORT.md", doi:"10.5281/zenodo.23071166",
   rerun:`git clone https://github.com/sparkainlp-x/oes-resilience && cd oes-resilience\ngit checkout 79edb72\ncat oes32-v2/reports/OES32_V2_REPORT.md   # protocol, trial log, frozen config, results`, render: renderV2 },
 { id:"qbench", learned:'The gain is concentrated in one circuit family, so how the data is blocked decides whether it looks significant.', verdict:"OPEN", tags:["SIMULATOR ONLY","synthetic noise"], title:"qbench: does heavier transpiler optimisation help? It depends how you block.",
   claim:"Qiskit transpiler optimisation level 3 gives higher Hellinger fidelity than level 1 under a synthetic noise model.",
   cond:"Qiskit Aer simulator only; GHZ, Bernstein-Vazirani and QFT at widths 3-5; 4 seed batches; 2,000 shots; 108 runs; plan SHA-256 self-recorded before the first run; paired block bootstrap.",
   diff:"+0.0187 [+0.0053, +0.0324] with the preregistered 12 blocks. Grouping by circuit family alone: [+0.0000, +0.0538], not significant. Nearly all of the gain is from QFT (+0.0538).",
   need:"An externally timestamped plan (Zenodo/OSF), real-hardware runs with calibration snapshots, and more families so a family-level interval is meaningful.",
   repo:"oes-resilience", sha:"0e1165610e2ddb6445fec507b95d8b7a7f8b2979", branch:"qbench-evidence-layer (PR #5, unmerged)", path:"examples/qbench_sample/qbench_report.md", doi:null,
   rerun:`git clone https://github.com/sparkainlp-x/oes-resilience && cd oes-resilience\ngit checkout 0e11656   # branch qbench-evidence-layer\npip install -e '.[quantum]'\npytest -q tests -k qbench\n# outputs: examples/qbench_sample/`, render: renderQbench },
 { id:"residual", learned:'The residual is simple enough to port exactly; on a slow drift, max-abs reacts later than EWMA or CUSUM.', verdict:"REPRODUCED", tags:["live in your browser","synthetic stream"], title:"OES-32 residual, ported to JavaScript and replayed live",
   claim:"The in-browser JS port computes exactly the normative OES-32 residual: R = max|y−x| over 32 values, FAIL iff R > tolerance (strict).",
   cond:"Contract vectors generated by the Python reference (oes32-residual 136f258) and checked bit-exact by node:test in CI, plus invalid-input rejection.",
   diff:"45 of 45 valid vectors identical (component residuals, aggregate and status); all invalid inputs rejected. The replay below is a synthetic illustration, not a benchmark.",
   need:"The replay's EWMA/CUSUM settings are illustrative and uncalibrated; the slow-drift weakness is shown, not measured.",
   repo:"oes32-residual", sha:"136f2584c8e81d31edbe418652eed1616cd498cd", path:"residual_definition.md", doi:"10.5281/zenodo.22985520",
   rerun:`git clone https://github.com/sparkainlp-x/spark-evidence-lab && cd spark-evidence-lab\ngit clone https://github.com/sparkainlp-x/oes32-residual /tmp/oes32-residual\npython3 tools/gen_vectors.py /tmp/oes32-residual > tests/vectors.json\nnode --test tests/`, render: renderResidual },
 { id:"oes512", learned:'The summaries react to shared structure, and the notch keeps mains hum from looking like coherence. That is behaviour, not evidence.', verdict:"EXPLORATORY", tags:["SYNTHETIC","not hardware"], title:"OES-512: 512-channel synthetic stream, filtered and summarised",
   claim:"The coherence / instability / drift summaries respond to injected structure in a synthetic 512-channel stream.",
   cond:"Synthetic 250 Hz stream generated in your browser; 50 Hz notch + 0.5-45 Hz band-pass (biquads, a JS approximation of the repo's SciPy SOS filters); metric definitions mirror main.py: coherence = mean |Pearson r| over every 16th channel, instability = std of channel variances, drift = norm of mean-profile shift from the first window.",
   diff:"No baseline comparison exists yet. The metrics are plain statistics of synthetic data, not measurements of any system.",
   need:"A predeclared detection task with ground truth and a baseline (for example max|x| per block) before any claim.",
   repo:"oes512-telemetry-engine", sha:"95d99a16c61ef700a58f668e35e61ad051e4d8cc", path:"main.py", doi:"10.5281/zenodo.23307953",
   rerun:`git clone https://github.com/sparkainlp-x/oes512-telemetry-engine && cd oes512-telemetry-engine\npip install -r requirements.txt -r requirements-dev.txt\npytest -q && python main.py`, render: renderOes512 },
 { id:"thz", learned:'Writing the equations as code made the depth and intensity limits concrete; the simulator agrees with the closed form.', verdict:"OPEN", tags:["SYNTHETIC","protocol-locked"], title:"Digital to Wave Part II: THz channel validity check",
   claim:"The THz human-wave-interface equations of the Part II preprint describe an engineering-plausible channel.",
   cond:"Equation inventory by PDF page, dimension checks with assumptions that favour the paper, and a seeded synthetic channel benchmark (master seed 20261013, run from lock commit 6ff37d6). 12,000 frames per cell.",
   diff:"One equation (p. 29) fails the dimension check. Required surface intensity is 10^10.8 × the ICNIRP long-exposure skin limit. Even the oracle receiver collapses between 30 and 100 µm depth (9,749 → 892 → 0 of 12,000). Simulator vs closed form: 73 of 75 cells inside the 95% interval.",
   need:"Review by the source author or a THz/biophysics specialist; the source author has not reviewed it. Not a safety assessment.",
   repo:"digital-to-wave-2-thz-validity", sha:"c8721fa8974d92db66f696e6006460b84e0f70c2", path:"README.md", doi:null,
   rerun:`git clone https://github.com/sparkainlp-x/digital-to-wave-2-thz-validity && cd digital-to-wave-2-thz-validity\npip install -e '.[test]'\nsha256sum -c MODULES.sha256\ntools/reproduce_all.sh   # ~20 s, regenerates artifacts/`, render: renderThz },
 { id:"qec", learned:'The toy behaves as textbook theory expects, and low-noise points need many more shots to say anything precise.', verdict:"OPEN", tags:["CLASSICAL TOY SIMULATION","Stim + PyMatching"], title:"Surface-code memory toy: failures vs code distance",
   claim:"In this idealised circuit-noise model, the simulated per-round failure estimate of the rotated surface code falls as distance grows.",
   cond:"Stim 1.16.0 + PyMatching 2.4.0 on a classical CPU; d = 3, 5, 7; R = 4d rounds; 20,000 shots per condition; seed 1823; held-out profile with two extra seeds.",
   diff:"Holds at every tested noise point; the d3→5 ratio shrinks from 9.2 to 1.17 as noise rises. No crossing reached, so no threshold is estimated. At the center point d=3 fails more often than the unencoded row.",
   need:"This is a toy. It is not comparable with experiments and says nothing about hardware or real QEC.",
   repo:"qec-scaling-bench", sha:"0125bdb475cbbc7886f075ef2dd8055d97d5f7ad", path:"results/scaling_sweep_seed_1823.json", doi:"10.5281/zenodo.23241631",
   rerun:`git clone https://github.com/sparkainlp-x/qec-scaling-bench && cd qec-scaling-bench\npip install -e '.[test]'\npython3 qec_scaling_bench.py --output /tmp/fresh.json\npython3 tools/compare_reports.py results/scaling_sweep_seed_1823.json /tmp/fresh.json`, render: renderQec }
];

function renderSmap(el) {
  let ds = "SMAP";
  const draw = () => { const d = L.smap[ds];
    $(".viz", el).innerHTML = bars(Object.entries(d).sort((a, b) => b[1][0] - a[1][0]).map(([m, [v, lo, up]]) => ({ label: m === "oes32" ? "OES32 (mine)" : m, v, lo, up, hi: m === "oes32", text: `${v.toFixed(3)} [${lo.toFixed(3)}, ${up.toFixed(3)}]` })), { max: .8 }) + `<div class="ctl">Pooled event-level F1, 95% CI · ${ds} · train-only thresholds, 1% FP target</div>`;
    el.querySelectorAll("button.t").forEach(b => b.classList.toggle("on", b.dataset.k === ds)); };
  $(".ctls", el).innerHTML = `<div class="ctl">${["SMAP", "MSL"].map(k => `<button class="t" data-k="${k}">${k}</button>`).join("")}</div>`;
  el.querySelectorAll("button.t").forEach(b => b.onclick = () => { ds = b.dataset.k; draw(); }); draw();
}
function renderV2(el) {
  const it = []; for (const ds of ["SMAP", "MSL"]) { const v1 = L.smap[ds].oes32[0]; it.push({ label: ds + " v1", v: v1, color: C.cyan }, { label: ds + " v2", v: L.smap.v2[ds], hi: true, text: `${L.smap.v2[ds].toFixed(3)} (needed ≥ ${(v1 + .05).toFixed(3)})` }); }
  $(".viz", el).innerHTML = bars(it, { max: .6 }) + `<div class="ctl">Test event F1 · gold = v2, cyan = frozen v1</div>`;
}
function renderQbench(el) {
  const keys = Object.keys(L.qbench.schemes); let k = keys[0];
  const draw = () => { const s = L.qbench.schemes[k], sig = s.lo > 0;
    $(".viz", el).innerHTML = bars([{ label: "o3 − o1", v: s.mean, lo: s.lo, up: s.hi, hi: true, text: `${s.mean >= 0 ? "+" : ""}${s.mean.toFixed(4)} [${s.lo.toFixed(4)}, ${s.hi.toFixed(4)}]` }], { max: .06, ref: 0, refLabel: "0", fmt: v => v.toFixed(3) })
      + `<div class="ctl"><b style="color:${sig ? C.green : C.amber}">${esc(s.verdict)}</b> · ${s.n} blocks</div>`
      + bars(Object.entries(L.qbench.perFamily).map(([f, v]) => ({ label: f.toUpperCase(), v, text: "+" + v.toFixed(4) })), { max: .06, fmt: v => v.toFixed(3) }) + `<div class="ctl">Mean paired difference per circuit family (Hellinger fidelity)</div>`;
    el.querySelectorAll("button.t").forEach(b => b.classList.toggle("on", b.dataset.k === k)); };
  $(".ctls", el).innerHTML = `<div class="ctl">Block scheme: ${keys.map(x => `<button class="t" data-k="${esc(x)}">${esc(x)}</button>`).join("")}</div>`;
  el.querySelectorAll("button.t").forEach(b => b.onclick = () => { k = b.dataset.k; draw(); }); draw();
}
function slider(id, label, min, max, step, val) { return `<label>${label} <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"> <output>${val}</output></label>`; }
function bindSliders(el, draw) { el.querySelectorAll("input[type=range]").forEach(i => i.oninput = () => { i.nextElementSibling.textContent = i.value; draw(); }); draw(); }
function renderResidual(el) {
  $(".ctls", el).innerHTML = `<div class="ctl">${slider("r-seed", "seed", 1, 99, 1, 7)}${slider("r-noise", "noise σ", .05, .5, .01, .2)}${slider("r-drift", "drift / step", 0, .01, .0005, .003)}${slider("r-tol", "tolerance τ", .3, 1.5, .05, .9)}</div>`;
  const draw = () => {
    const seed = +$("#r-seed", el).value, sd = +$("#r-noise", el).value, dr = +$("#r-drift", el).value, tol = +$("#r-tol", el).value;
    const r = rng(seed), N = 400, onset = 150, ref = Array(32).fill(0), R = [], E = [], S = [];
    let e = 0, cp = 0, cn = 0; const lam = .1, sm = sd / Math.sqrt(32), eL = 3 * sm * Math.sqrt(lam / (2 - lam)), k = .5 * sm, h = 5 * sm;
    const first = { oes: -1, ewma: -1, cusum: -1 }, fa = { oes: 0, ewma: 0, cusum: 0 };
    for (let t = 0; t < N; t++) {
      const d = t >= onset ? dr * (t - onset) : 0, obs = ref.map(() => gauss(r) * sd + d);
      const res = OES32.evaluateResidual(ref, obs, tol), m = obs.reduce((a, b) => a + b) / 32;
      e = lam * m + (1 - lam) * e; cp = Math.max(0, cp + m - k); cn = Math.max(0, cn - m - k);
      R.push(res.aggregate_residual); E.push(Math.abs(e) / eL); S.push(Math.max(cp, cn) / h);
      const al = { oes: res.failed, ewma: Math.abs(e) > eL, cusum: Math.max(cp, cn) > h };
      for (const key in al) if (al[key]) { if (t < onset) fa[key]++; else if (first[key] < 0) first[key] = t; }
      if (Math.max(cp, cn) > h) { cp = 0; cn = 0; }
    }
    const lag = key => first[key] < 0 ? "not detected" : `detected after ${first[key] - onset} steps`;
    $(".viz", el).innerHTML = lines([{ y: R, color: C.gold }], { h: 200, yMin: 0, marks: [{ x: onset, label: "drift starts", color: C.red }], hlines: [{ y: tol, label: "τ (FAIL iff R > τ)", color: C.cyan }], xLabel: "step (synthetic)" })
      + legend([[C.gold, "OES-32 residual R = max|y−x| (JS port)"]])
      + lines([{ y: E, color: C.cyan }, { y: S, color: C.green }], { h: 160, yMin: 0, marks: [{ x: onset, label: "", color: C.red }], hlines: [{ y: 1, label: "alarm level", color: C.mut }], xLabel: "normalised statistic" })
      + legend([[C.cyan, "EWMA of channel mean (λ=0.1, 3σ)"], [C.green, "CUSUM of channel mean (k=0.5σ, h=5σ)"]])
      + `<div class="ctl">OES-32: ${lag("oes")} · ${fa.oes} false alarms before onset &nbsp;|&nbsp; EWMA: ${lag("ewma")} · ${fa.ewma} FA &nbsp;|&nbsp; CUSUM: ${lag("cusum")} · ${fa.cusum} FA</div>`;
  };
  bindSliders(el, draw);
}
function biquad(b0, b1, b2, a1, a2) { return { b0, b1, b2, a1, a2 }; }
function rbj(type, f0, fs, Q) { const w = 2 * Math.PI * f0 / fs, cs = Math.cos(w), al = Math.sin(w) / (2 * Q); let b;
  if (type === "notch") b = [1, -2 * cs, 1]; else if (type === "lp") b = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2]; else b = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
  const a0 = 1 + al; return biquad(b[0] / a0, b[1] / a0, b[2] / a0, -2 * cs / a0, (1 - al) / a0); }
function renderOes512(el) {
  $(".ctls", el).innerHTML = `<div class="ctl">${slider("o-seed", "seed", 1, 99, 1, 3)}${slider("o-mains", "50 Hz mains", 0, 3, .1, 1.5)}${slider("o-couple", "shared signal (from t=4 s)", 0, 1, .05, .6)}${slider("o-dc", "slow offset drift", 0, 2, .1, .8)}</div><canvas width="720" height="180" aria-label="heatmap"></canvas>`;
  const draw = () => {
    const r = rng(+$("#o-seed", el).value), mains = +$("#o-mains", el).value, cp = +$("#o-couple", el).value, dc = +$("#o-dc", el).value;
    const fs = 250, T = 2000, NC = 512, W = 250, filt = [rbj("notch", 50, fs, 30), rbj("hp", .5, fs, .707), rbj("lp", 45, fs, .707)];
    const st = Array.from({ length: NC }, () => filt.map(() => [0, 0])), ph = Array.from({ length: NC }, () => r() * 6.28), fr = Array.from({ length: NC }, () => 6 + r() * 20), gain = Array.from({ length: NC }, () => r() < .5 ? 1 : -1);
    const buf = Array.from({ length: W }, () => new Float64Array(NC)); let base = null; const coh = [], inst = [], drift = [];
    const cv = $("canvas", el), cx = cv.getContext("2d"), img = cx.createImageData(720, 180);
    for (let t = 0; t < T; t++) {
      const tt = t / fs, shared = Math.sin(2 * Math.PI * 10 * tt) * (tt > 4 ? cp * 2 : 0), row = buf[t % W];
      for (let c = 0; c < NC; c++) {
        let x = Math.sin(2 * Math.PI * fr[c] * tt + ph[c]) * .5 + gauss(r) * .5 + mains * Math.sin(2 * Math.PI * 50 * tt) + gain[c] * shared + dc * (c % 7) / 6 * tt / 8;
        for (let f = 0; f < 3; f++) { const q = filt[f], s = st[c][f], y = q.b0 * x + s[0]; s[0] = q.b1 * x - q.a1 * y + s[1]; s[1] = q.b2 * x - q.a2 * y; x = y; }
        row[c] = x;
        if (t % 11 === 0 && c % 3 === 0) { const px = Math.floor(t / T * 720), py = Math.floor(c / 3 / 171 * 180); if (py < 180) { const v = Math.max(-1, Math.min(1, x / 2)), i = (py * 720 + px) * 4;
          for (let dx = 0; dx < 4 && px + dx < 720; dx++) { const j = i + dx * 4; img.data[j] = v > 0 ? 201 * v + 10 : 10; img.data[j + 1] = v > 0 ? 168 * v + 20 : 20 - 200 * v * .7; img.data[j + 2] = v > 0 ? 76 * v + 40 : 40 - 232 * v; img.data[j + 3] = 255; } } }
      }
      if (t >= W - 1 && t % 25 === 0) {
        const sub = []; for (let c = 0; c < NC; c += 16) sub.push(buf.map(rw => rw[c]));
        const z = sub.map(a => { const m = a.reduce((p, q) => p + q) / W, s = Math.sqrt(a.reduce((p, q) => p + (q - m) ** 2, 0) / W); return s > 0 ? a.map(v => (v - m) / s) : null; }).filter(Boolean);
        let sum = 0, n = 0; for (let i = 0; i < z.length; i++) for (let j = i + 1; j < z.length; j++) { let d = 0; for (let k = 0; k < W; k++) d += z[i][k] * z[j][k]; sum += Math.abs(d / W); n++; }
        coh.push(n ? sum / n : 0);
        const mean = new Float64Array(NC), vr = new Float64Array(NC); for (const rw of buf) for (let c = 0; c < NC; c++) mean[c] += rw[c] / W;
        for (const rw of buf) for (let c = 0; c < NC; c++) vr[c] += (rw[c] - mean[c]) ** 2 / W;
        const mv = vr.reduce((a, b) => a + b) / NC; inst.push(Math.sqrt(vr.reduce((a, b) => a + (b - mv) ** 2, 0) / NC));
        if (!base) base = mean.slice(); let dd = 0; for (let c = 0; c < NC; c++) dd += (mean[c] - base[c]) ** 2; drift.push(Math.sqrt(dd));
      }
    }
    cx.putImageData(img, 0, 0);
    const nz = a => { const m = Math.max(...a) || 1; return a.map(v => v / m); };
    $(".viz", el).innerHTML = lines([{ y: coh, color: C.gold }, { y: nz(inst), color: C.cyan }, { y: nz(drift), color: C.green }], { h: 190, yMin: 0, yMax: 1, xLabel: "8 s synthetic, 1 s windows" })
      + legend([[C.gold, `coherence (mean |r|), last ${coh.at(-1).toFixed(3)}`], [C.cyan, `instability (scaled), last ${inst.at(-1).toFixed(3)}`], [C.green, `drift (scaled), last ${drift.at(-1).toFixed(3)}`]])
      + `<div class="ctl">Heatmap above: every 3rd channel after notch + band-pass. Raise “50 Hz mains”: the notch removes it, so coherence barely moves. Raise “shared signal”: coherence jumps at 4 s.</div>`;
  };
  bindSliders(el, draw);
}
function renderThz(el) { const d = L.thz;
  $(".viz", el).innerHTML = lines([{ y: d.oracle.map(v => v / 120), color: C.gold }, { y: d.lpf.map(v => v / 120), color: C.cyan }, { y: d.nominal.map(v => v / 120), color: C.mut }], { h: 200, yMin: 0, yMax: 100, xLabel: "depth: " + d.depth.join(" / ") + " µm" })
    + legend([[C.gold, "oracle receiver"], [C.cyan, "LPF-calibrated"], [C.mut, "nominal"]]) + `<div class="ctl">% of 12,000 synthetic frames decoded, two-tone beat, σ = 0.25 (artifacts/thz-channel-benchmark.csv)</div>`; }
function renderQec(el) { const q = L.qec;
  $(".viz", el).innerHTML = bars(q.points.map((p, i) => ({ label: p, v: q.ratio35[i][0], lo: q.ratio35[i][1], up: q.ratio35[i][2], hi: i === 2, text: `${q.ratio35[i][0]} [${q.ratio35[i][1]}, ${q.ratio35[i][2]}] · fails ${q.surface[i].join("/")}` })), { max: 24, ref: 1, refLabel: "ratio 1", fmt: v => v.toFixed(0) })
    + `<div class="ctl">Surface-code ratio q(d=3) / q(d=5) with 95% bootstrap CI per (gate, readout) noise point; failures out of 20,000 at d = 3/5/7. Classical toy simulation.</div>`; }

// ---------- page ----------
const counts = { REPRODUCED: 0, BASELINE: 0, OPEN: 0, EXPLORATORY: 0 }; EXP.forEach(e => counts[e.verdict]++);
$("#score").innerHTML = `<p class="scoreline">${EXP.length} experiments · ${counts.REPRODUCED} reproduced · ${counts.BASELINE} where a simpler baseline won · ${counts.OPEN + counts.EXPLORATORY} open</p>`;
const main = $("#cards");
EXP.forEach((e, i) => { const el = document.createElement("article"); el.className = "card"; el.id = e.id;
  el.innerHTML = `<span class="v ${e.verdict}">${VL[e.verdict]}</span><div>${e.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div><h2>${i + 1}. ${esc(e.title)}</h2>
  <dl class="facts"><dt>Claim tested</dt><dd>${esc(e.claim)}</dd><dt>Conditions</dt><dd>${esc(e.cond)}</dd><dt>Difference vs baseline</dt><dd>${esc(e.diff)}</dd><dt>Where it stands</dt><dd><b class="${e.verdict}">${VL[e.verdict]}</b></dd></dl>
  <div class="ctls"></div><div class="viz"></div>
  <p class="learn">What I learned: ${esc(e.learned)}</p>
  <p class="need">Next step: ${esc(e.need)}</p>
  <p class="links">Code <a href="${GH}${e.repo}/tree/${e.sha}">${e.repo}</a>${e.branch ? " · " + esc(e.branch) : ""} · commit <a href="${GH}${e.repo}/commit/${e.sha}"><code>${e.sha.slice(0, 7)}</code></a> · source <a href="${GH}${e.repo}/blob/${e.sha}/${e.path}"><code>${esc(e.path)}</code></a>${e.doi ? ` · DOI <a href="https://doi.org/${e.doi}">${e.doi}</a>` : " · no DOI yet"}</p>
  <details><summary>How to rerun from a clean checkout</summary><pre>${esc(e.rerun)}</pre></details>`;
  main.appendChild(el); try { e.render(el); } catch (err) { $(".viz", el).textContent = "Visualisation failed: " + err.message; } });
