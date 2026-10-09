/**
 * Deterministic priority scorer (v1).
 *
 * Interface: calculate({ category, text, reportCount, hasPhoto })
 *            -> { priority, priority_score, factors }
 *
 * ML-READY BY DESIGN: to replace with a model later, swap this module's
 * `calculate` implementation (e.g. model.predict(...)) and return the same
 * shape. Nothing else in the codebase needs to change.
 */
const { detectSignals, SIGNALS } = require('../../utils/textSignals');

const BASE_SCORES = {
  pothole: 55,
  water_leak: 45,
  streetlight: 40,
  garbage: 35,
  other: 30,
};

const SIGNAL_WEIGHTS = Object.fromEntries(SIGNALS.map((s) => [s.name, s.weight]));
const PHOTO_BONUS = 5;
const REPORT_BONUS_PER_REPORT = 5;
const REPORT_BONUS_MAX = 20;
const HIGH_THRESHOLD = 70;    // keep in sync with complaintModel.incrementReport SQL
const MEDIUM_THRESHOLD = 45;  // keep in sync with complaintModel.incrementReport SQL

function priorityFromScore(score) {
  if (score >= HIGH_THRESHOLD) return 'HIGH';
  if (score >= MEDIUM_THRESHOLD) return 'MEDIUM';
  return 'LOW';
}

function calculate({ category, text = '', reportCount = 1, hasPhoto = false }) {
  const factors = [];

  const base = BASE_SCORES[category] ?? BASE_SCORES.other;
  factors.push({ factor: `base_${category}`, points: base });
  let score = base;

  // Danger / proximity / severity language (multilingual)
  for (const signal of detectSignals(text)) {
    const points = SIGNAL_WEIGHTS[signal] || 0;
    if (points) {
      score += points;
      factors.push({ factor: signal, points });
    }
  }

  // Number of citizens reporting the same problem
  const extraReports = Math.max(0, Number(reportCount) - 1);
  if (extraReports > 0) {
    const points = Math.min(REPORT_BONUS_MAX, extraReports * REPORT_BONUS_PER_REPORT);
    score += points;
    factors.push({ factor: 'report_count', points });
  }

  if (hasPhoto) {
    score += PHOTO_BONUS;
    factors.push({ factor: 'photo_evidence', points: PHOTO_BONUS });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  return { priority: priorityFromScore(finalScore), priority_score: finalScore, factors };
}

module.exports = { calculate, priorityFromScore };