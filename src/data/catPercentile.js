// SAMPLE DATA. Replace with your own score-vs-percentile data, then set isSample = false.
// Each row is [overall score, percentile], sorted by score ascending.
// You can give each slot (1, 2, 3) its own rows.
export const isSample = true

const sample = [
  [0, 0], [20, 40], [30, 60], [40, 75], [50, 87], [60, 94],
  [70, 97], [80, 98.5], [90, 99.3], [110, 99.9], [204, 100],
]

export const table = { 1: sample, 2: sample, 3: sample }

// Linear interpolation between the two nearest rows.
export function estimate(slot, score) {
  const pts = table[slot] || table[1]
  if (score <= pts[0][0]) return pts[0][1]
  const last = pts[pts.length - 1]
  if (score >= last[0]) return last[1]
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    if (score <= x1) {
      const [x0, y0] = pts[i - 1]
      const p = y0 + ((score - x0) / (x1 - x0)) * (y1 - y0)
      return Math.round(p * 100) / 100
    }
  }
  return last[1]
}
