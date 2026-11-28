
export const isSample = false

// CAT 2021-2025 historical average score-percentile curves.
// Historical averages are used as the CAT 2026 baseline.
// Points are [score, percentile].

export const est = {
  overall: [
    [0, 0],
    [10, 30],
    [20, 55],
    [30, 70],
    [35, 75],
    [39.30, 80],
    [46.63, 85],
    [52.17, 90],
    [63.83, 95],
    [74.94, 98],
    [87.36, 99],
    [95.86, 99.5],
    [113.17, 99.9],
    [204, 100],
  ],

  varc: [
    [0, 0],
    [6, 35],
    [12, 60],
    [16, 70],
    [18.02, 80],
    [20.50, 85],
    [25.00, 90],
    [30.90, 95],
    [37.00, 98],
    [42.00, 99],
    [46.00, 99.5],
    [53.40, 99.9],
    [68, 100],
  ],

  lrdi: [
    [0, 0],
    [4, 40],
    [8, 65],
    [10.50, 70],
    [12.67, 80],
    [14.62, 85],
    [18.87, 90],
    [22.88, 95],
    [28.40, 98],
    [32.16, 99],
    [35.60, 99.5],
    [42.52, 99.9],
    [68, 100],
  ],

  qa: [
    [0, 0],
    [4, 40],
    [8, 65],
    [9, 70],
    [10.30, 80],
    [13.00, 85],
    [16.00, 90],
    [20.47, 95],
    [26.75, 98],
    [29.90, 99],
    [34.20, 99.5],
    [41.79, 99.9],
    [68, 100],
  ],
}

// CAT 2026 difficulty assumptions (out of 10)
export const difficulty = {
  1: {
    overall: 7.0,
    varc: 6.5,
    lrdi: 7.5,
    qa: 6.5,
  },

  2: {
    overall: 7.5,
    varc: 7.0,
    lrdi: 8.0,
    qa: 7.5,
  },

  3: {
    overall: 6.5,
    varc: 6.5,
    lrdi: 7.0,
    qa: 6.0,
  },
}

// Difficulty adjustment configuration
const BASE_DIFFICULTY = 7.0

// Percentage change in score thresholds per difficulty point
const ADJUSTMENT_RATE = 0.04

function getDifficultyFactor(slot, section) {
  const rating =
    difficulty[slot]?.[section] ?? BASE_DIFFICULTY

  return 1 - (rating - BASE_DIFFICULTY) * ADJUSTMENT_RATE
}

// Build independent percentile curves for each slot
function buildSlotCurve(slot) {
  const result = {}

  for (const section of Object.keys(est)) {
    const factor = getDifficultyFactor(slot, section)

    result[section] = est[section].map(([score, percentile]) => {
      // Keep the maximum-score endpoint fixed
      if (percentile === 100) {
        return [score, percentile]
      }

      return [
        Math.round(score * factor * 100) / 100,
        percentile,
      ]
    })
  }

  return result
}

// Slot-specific percentile tables
export const table = {
  1: buildSlotCurve(1),
  2: buildSlotCurve(2),
  3: buildSlotCurve(3),
}

// Linear interpolation between the nearest score-percentile points
export function estimate(slot, section, score) {
  const pts = (table[slot] || table[1])[section]

  if (!pts) return 0

  if (score <= pts[0][0]) {
    return pts[0][1]
  }

  const last = pts[pts.length - 1]

  if (score >= last[0]) {
    return last[1]
  }

  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]

    if (score <= x1) {
      const [x0, y0] = pts[i - 1]

      const percentile =
        y0 + ((score - x0) / (x1 - x0)) * (y1 - y0)

      return Math.round(percentile * 100) / 100
    }
  }

  return last[1]
}
