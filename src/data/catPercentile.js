// ESTIMATES, not official data. Rough score-to-percentile mapping built from ranges reported for
// CAT 2025 in published analyses. IIMs do not publish an official table. Update it with the real
// CAT 2026 slot data after the exam. Rows are [score, percentile], sorted by score ascending.
// Below the 80th percentile the numbers are rough. You can give each slot its own rows.
export const isSample = false

const est = {
  overall: [[0, 0], [10, 30], [20, 55], [30, 70], [38, 80], [43, 85], [52, 90], [66, 95], [77, 98], [86, 99], [100, 99.5], [118, 99.9], [204, 100]],
  varc: [[0, 0], [6, 35], [12, 60], [18, 80], [20, 85], [24, 90], [31, 95], [34, 98], [40, 99], [45, 99.5], [52, 99.9], [72, 100]],
  lrdi: [[0, 0], [4, 40], [8, 65], [12, 80], [14, 85], [17, 90], [23, 95], [28, 98], [31, 99], [37, 99.5], [44, 99.9], [66, 100]],
  qa: [[0, 0], [4, 40], [8, 65], [12, 80], [14, 85], [16, 90], [22, 95], [27, 98], [30, 99], [37, 99.5], [45, 99.9], [66, 100]],
}

export const table = { 1: est, 2: est, 3: est }

// Linear interpolation between the two nearest rows.
export function estimate(slot, section, score) {
  const pts = (table[slot] || table[1])[section]
  if (!pts) return 0
  if (score <= pts[0][0]) return pts[0][1]
  const last = pts[pts.length - 1]
  if (score >= last[0]) return last[1]
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    if (score <= x1) {
      const [x0, y0] = pts[i - 1]
      return Math.round((y0 + ((score - x0) / (x1 - x0)) * (y1 - y0)) * 100) / 100
    }
  }
  return last[1]
}
