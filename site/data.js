// Every number below is copied from a committed file in a public sparkainlp-x repo (path + commit given per card).
window.LAB = {
  smap: { // oes-resilience reports/smap_msl_results/smap_msl_summary.csv, subset all_channels, target_fp 0.01
    SMAP: { oes32:[0.378601,0.273556,0.522167], maxabs:[0.47541,0.328767,0.645841], zscore:[0.060887,0.032237,0.155983], ewma:[0.086957,0.060642,0.131869], cusum:[0.169252,0.122105,0.256413] },
    MSL:  { oes32:[0.434783,0.333291,0.575758], maxabs:[0.5,0.350868,0.657143], zscore:[0.248756,0.177911,0.389381], ewma:[0.223176,0.126982,0.423358], cusum:[0.514286,0.387097,0.681319] },
    v2: { SMAP: 0.213, MSL: 0.434 }
  },
  qbench: { // oes-resilience@qbench-evidence-layer examples/qbench_sample/qbench_report.md
    schemes: {
      "family x batch (12 blocks, preregistered)": { n:12, mean:0.0187, lo:0.0053, hi:0.0324, verdict:"noisy_o3 better" },
      "family only (3 blocks)": { n:3, mean:0.0187, lo:0.0000, hi:0.0538, verdict:"no significant difference" },
      "batch only (4 blocks)": { n:4, mean:0.0187, lo:0.0183, hi:0.0191, verdict:"noisy_o3 better (fewer than 5 blocks: unreliable)" }
    },
    perFamily: { ghz:0.0000, bv:0.0022, qft:0.0538 }
  },
  qec: { // qec-scaling-bench results/scaling_sweep_seed_1823.json via README table (R = 4d, 20,000 shots)
    points: ["(0.001,0.001)","(0.001,0.005)","(0.003,0.003)","(0.005,0.001)","(0.005,0.005)","(0.01,0.01)"],
    surface: [[55,10,1],[88,18,4],[310,164,56],[611,477,303],[702,595,382],[2229,3004,3503]],
    ratio35: [[9.2,5.0,22.3],[8.2,5.2,14.9],[3.17,2.60,3.84],[2.15,1.91,2.42],[1.97,1.78,2.21],[1.17,1.11,1.25]]
  },
  thz: { // digital-to-wave-2-thz-validity README, artifacts/thz-channel-benchmark.json
    depth: [0,5,10,20,30,50,100], oracle:[12000,11999,11984,11732,9749,892,0], lpf:[12000,3610,0,0,0,0,0], nominal:[8492,0,0,0,0,0,0]
  }
};
