// JS port of the OES-32 normative residual (sparkainlp-x/oes32-residual, residual_definition.md).
// R = max_i |y_i - x_i| over exactly 32 finite values; FAIL iff R > tolerance (strict).
(function (root) {
  const DIMENSION = 32;
  function check(v, name) {
    if (!Array.isArray(v) || v.length !== DIMENSION) throw new RangeError(name + " must have exactly 32 values");
    for (const x of v) if (typeof x !== "number" || !Number.isFinite(x)) throw new RangeError(name + " must be finite numbers");
  }
  function evaluateResidual(reference, observed, tolerance) {
    check(reference, "reference"); check(observed, "observed");
    if (typeof tolerance !== "number" || !Number.isFinite(tolerance) || tolerance < 0) throw new RangeError("tolerance must be finite and >= 0");
    const comps = reference.map((x, i) => Math.abs(observed[i] - x));
    const agg = Math.max(...comps);
    const failed = agg > tolerance;
    return { component_residuals: comps, aggregate_residual: agg, tolerance, passed: !failed, failed };
  }
  const api = { DIMENSION, evaluateResidual };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.OES32 = api;
})(this);
