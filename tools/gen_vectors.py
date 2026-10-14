"""Generate contract vectors from the Python reference in sparkainlp-x/oes32-residual.

Usage: python tools/gen_vectors.py /path/to/oes32-residual > tests/vectors.json
"""
import json, math, random, subprocess, sys
from pathlib import Path

repo = Path(sys.argv[1])
sys.path.insert(0, str(repo / "src"))
from residual_reference import DIMENSION, evaluate_residual  # noqa: E402

def vw(v, i=0):
    x = [0.0] * DIMENSION; x[i] = v; return x

cases = []
o = vw(-0.75, 7); o[13] = 0.5
cases += [([0.0]*32, [0.0]*32, 0.0), ([0.0]*32, o, 0.5), ([0.0]*32, vw(0.25), 0.25),
          ([0.0]*32, vw(0.250001), 0.25)]
ref = [i/10 for i in range(32)]
cases.append((ref, [v+0.125 for v in ref], 0.125))
rng = random.Random(20261013)
for _ in range(40):
    a = [rng.uniform(-5, 5) for _ in range(32)]
    b = [x + rng.gauss(0, 0.3) for x in a]
    cases.append((a, b, round(rng.uniform(0, 1), 3)))
valid = []
for a, b, t in cases:
    r = evaluate_residual(a, b, t)
    valid.append({"reference": a, "observed": b, "tolerance": t,
                  "component_residuals": list(r.component_residuals),
                  "aggregate_residual": r.aggregate_residual, "passed": r.passed})
invalid = [{"reference": [0.0]*31, "observed": [0.0]*32, "tolerance": 0.0},
           {"reference": [0.0]*32, "observed": [0.0]*33, "tolerance": 0.0},
           {"reference": [0.0]*32, "observed": [0.0]*32, "tolerance": -0.01}]
for c in invalid:
    try:
        evaluate_residual(c["reference"], c["observed"], c["tolerance"]); raise SystemExit("expected ValueError")
    except ValueError:
        pass
sha = subprocess.run(["git", "-C", str(repo), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
json.dump({"source": "sparkainlp-x/oes32-residual", "commit": sha, "valid": valid, "invalid": invalid,
           "note": "NaN/Inf/bool cases are covered directly in tests/residual.test.mjs (not JSON-representable)."},
          sys.stdout, indent=1)
