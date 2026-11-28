
export const isSample = false

// ==========================================
// 1. MINIMUM POSSIBLE SCORES
// ==========================================

export const MIN_SCORE = {
  overall: -48,
  varc: -18,
  dilr: -15,
  qa: -15,
}

// ==========================================
// 2. NEGATIVE SCORE PERCENTILE SETTINGS
// ==========================================
// These are estimated lower-tail anchors, not official
// historical CAT percentile data.
//
// A score at the minimum gets 0.01 percentile.
// A score of zero gets 1 percentile.
// Scores between them are interpolated.

export const NEGATIVE_SCORE_ANCHORS = {
  overall: {
    minimumPercentile: 0.01,
    zeroPercentile: 1,
  },
  varc: {
    minimumPercentile: 0.01,
    zeroPercentile: 1,
  },
  dilr: {
    minimumPercentile: 0.01,
    zeroPercentile: 1,
  },
  qa: {
    minimumPercentile: 0.01,
    zeroPercentile: 1,
  },
}

// ==========================================
// 3. HISTORICAL BASELINE CURVES
// ==========================================

export const est = {
  overall: [
    [0, 1],
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
    [0, 1],
    [6, 35],
    [12, 60],
    [16, 70],
    [18.02, 80],
    [20.50, 85],
    [25, 90],
    [30.90, 95],
    [37, 98],
    [42, 99],
    [46, 99.5],
    [53.40, 99.9],
    [68, 100],
  ],

  dilr: [
    [0, 1],
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
    [0, 1],
    [4, 40],
    [8, 65],
    [9, 70],
    [10.30, 80],
    [13, 85],
    [16, 90],

    // Recalibrated using historical 2021–2025 benchmarks
    [21.00, 95],
    [26.75, 98],
    [29.90, 99],
    [34.30, 99.5],
    [41.79, 99.9],
    [68, 100],
  ],
}

// ==========================================
// 4. SLOT-WISE DIFFICULTY SETTINGS
// ==========================================
// Rating scale: 1 = Very Easy, 10 = Very Difficult.

export const difficulty = {
  1: {
    overall: 7.0,
    varc: 6.5,
    dilr: 7.5,
    qa: 6.5,
  },

  2: {
    overall: 7.5,
    varc: 7.0,
    dilr: 8.0,
    qa: 7.5,
  },

  3: {
    overall: 6.5,
    varc: 6.5,
    dilr: 7.0,
    qa: 6.0,
  },
}

// ==========================================
// 5. DIFFICULTY ADJUSTMENT
// ==========================================

export const BASE_DIFFICULTY = 7
export const ADJUSTMENT_RATE = 0.04

function getDifficultyMultiplier(rating) {
  return Math.max(
    0.5,
    1 - (rating - BASE_DIFFICULTY) * ADJUSTMENT_RATE
  )
}

// ==========================================
// 6. BUILD SLOT-WISE CURVES
// ==========================================

function buildCurve(section, slot) {
  const rating = difficulty[slot]?.[section]

  if (
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 10
  ) {
    throw new Error(
      `Invalid difficulty rating: Slot ${slot}, ${section}`
    )
  }

  const multiplier = getDifficultyMultiplier(rating)

  const minScore = MIN_SCORE[section]
  const negativeAnchors = NEGATIVE_SCORE_ANCHORS[section]

  // Negative score range remains independent of the
  // difficulty multiplier.
  const negativePoints = [
    [minScore, negativeAnchors.minimumPercentile],
    [0, negativeAnchors.zeroPercentile],
  ]

  // Adjust positive score thresholds according to difficulty.
  const positivePoints = est[section]
    .filter(([score]) => score > 0)
    .map(([score, percentile]) => [
      score * multiplier,
      percentile,
    ])

  return [
    ...negativePoints,
    ...positivePoints,
  ]
}

function buildSlot(slot) {
  return {
    overall: buildCurve("overall", slot),
    varc: buildCurve("varc", slot),
    dilr: buildCurve("dilr", slot),
    qa: buildCurve("qa", slot),
  }
}

export const table = {
  1: buildSlot(1),
  2: buildSlot(2),
  3: buildSlot(3),
}

// ==========================================
// 7. SCORE VALIDATION
// ==========================================

export function validateScore(section, score) {
  const key = section === "lrdi" ? "dilr" : section

  if (!(key in MIN_SCORE)) {
    return {
      valid: false,
      error: "Invalid section.",
    }
  }

  if (
    typeof score !== "number" ||
    !Number.isFinite(score)
  ) {
    return {
      valid: false,
      error: "Please enter a valid numerical score.",
    }
  }

  if (score < MIN_SCORE[key]) {
    return {
      valid: false,
      error: `${key.toUpperCase()} score cannot be below ${MIN_SCORE[key]}.`,
    }
  }

  return {
    valid: true,
    error: null,
  }
}

// ==========================================
// 8. PERCENTILE ESTIMATION
// ==========================================

export function estimate(slot, section, score) {
  const key = section === "lrdi" ? "dilr" : section
  const slotNumber = Number(slot)

  if (![1, 2, 3].includes(slotNumber)) {
    return null
  }

  const validation = validateScore(key, score)

  if (!validation.valid) {
    return null
  }

  const points = table[slotNumber]?.[key]

  if (!points) {
    return null
  }

  // Reject scores below the minimum. Never clamp.
  if (score < MIN_SCORE[key]) {
    return null
  }

  const first = points[0]
  const last = points[points.length - 1]

  if (score <= first[0]) {
    return first[1]
  }

  if (score >= last[0]) {
    return last[1]
  }

  // Linear interpolation between adjacent anchors.
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]

    if (score <= x1) {
      const [x0, y0] = points[i - 1]

      const percentile =
        y0 + ((score - x0) / (x1 - x0)) * (y1 - y0)

      return Math.round(percentile * 100) / 100
    }
  }

  return last[1]
}

// ==========================================
// 9. GET VALIDATION ERROR
// ==========================================

export function getScoreError(section, score) {
  return validateScore(section, score).error
}
