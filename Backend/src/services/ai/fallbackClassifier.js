/**
 * Deterministic multilingual keyword classifier — the reliability backbone of Awaaz.
 * Works for English, Hindi (Devanagari), Punjabi (Gurmukhi) and Hinglish.
 * Weighted scoring: strong category words (gaddha, pothole...) outweigh weak
 * context words (road, sadak...). This module can NEVER throw — the demo always works.
 */
const { CATEGORIES } = require('../../config/constants');
const { detectSignals } = require('../../utils/textSignals');

const KEYWORDS = {
  pothole: [
    ['pothole', 5], ['potholes', 5], ['gaddha', 5], ['gadda', 5], ['gadha', 5],
    ['गड्ढा', 5], ['गड्डा', 5], ['ਗੜ੍ਹਾ', 5], ['ਗੱਡਾ', 5],
    ['hole in the road', 5], ['pit on the road', 5], ['road hole', 5],
    ['crater', 4], ['road damage', 4], ['damaged road', 4], ['broken road', 4],
    ['sadak', 2], ['सड़क', 2], ['ਸੜਕ', 2], ['footpath', 2],
    ['road', 1],
  ],
  garbage: [
    ['garbage', 5], ['kachra', 5], ['kachda', 5], ['kooda', 5], ['kuda', 5],
    ['waste', 5], ['trash', 5], ['rubbish', 5], ['dustbin', 5],
    ['कचरा', 5], ['कूड़ा', 5], ['ਕੂੜਾ', 5], ['garbage dump', 5],
    ['gandagi', 4], ['गंदगी', 4], ['ਗੰਦਗੀ', 4], ['litter', 4],
    ['safai', 3], ['सफाई', 3], ['ਸਫ਼ਾਈ', 3], ['gutter', 3], ['dumping', 3],
    ['smell', 3], ['stink', 3], ['badboo', 3], ['बदबू', 3], ['ਬਦਬੂ', 3],
    ['naali', 2], ['नाली', 2], ['drain', 2],
  ],
  streetlight: [
    ['streetlight', 5], ['street light', 5], ['streetlite', 5], ['street lite', 5],
    ['light pole', 5], ['lamp post', 5], ['lamppost', 5], ['street lamp', 5],
    ['floodlight', 5], ['bulb', 5], ['batti', 5], ['बत्ती', 5], ['ਬੱਤੀ', 5], ['pole light', 5],
    ['andhera', 4], ['andher', 4], ['hanera', 4], ['अंधेरा', 4], ['ਹਨੇਰਾ', 4],
    ['dark', 4], ['darkness', 4], ['not working', 4],
    ['light', 3], ['लाइट', 3], ['ਲਾਈਟ', 3], ['lamp', 3],
    ['bijli', 3], ['बिजली', 3], ['ਬਿਜਲੀ', 3], ['sparking', 3], ['spark', 3],
    ['wire', 3], ['तार', 3], ['ਤਾਰ', 3], ['current', 2],
  ],
  water_leak: [
    ['leak', 5], ['leaks', 5], ['leakage', 5], ['leaking', 5],
    ['लीक', 5], ['ਲੀਕ', 5], ['seepage', 5], ['pipeline burst', 5], ['pipe burst', 5],
    ['paani', 4], ['pani', 4], ['पानी', 4], ['ਪਾਣੀ', 4],
    ['pipe', 4], ['pipes', 4], ['पाइप', 4], ['ਪਾਈਪ', 4],
    ['tap', 4], ['नल', 4], ['ਨਲ', 4], ['nal', 4], ['water supply', 4],
    ['water', 3], ['pipeline', 3], ['supply', 2],
  ],
};

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function buildMatcher(term) {
  if (/^[a-z0-9' -]+$/i.test(term)) {
    const re = new RegExp(`(?<![a-z0-9])${escapeRe(term)}(?![a-z0-9])`, 'i');
    return (text) => re.test(text);
  }
  return (text) => text.includes(term); // Devanagari / Gurmukhi substring match
}

const COMPILED = Object.fromEntries(
  Object.entries(KEYWORDS).map(([cat, entries]) => [
    cat,
    entries.map(([term, weight]) => ({ term, weight, match: buildMatcher(term) })),
  ])
);

function scoreText(rawText) {
  const text = String(rawText || '').toLowerCase();
  const scores = {};
  const matched = {};
  for (const category of CATEGORIES) {
    if (category === 'other') continue;
    let score = 0;
    const hits = [];
    for (const { term, weight, match } of COMPILED[category]) {
      if (match(text)) { score += weight; hits.push(term); }
    }
    scores[category] = score;
    matched[category] = hits;
  }
  let category = 'other';
  let best = 0;
  for (const c of Object.keys(scores)) {
    if (scores[c] > best) { best = scores[c]; category = c; }
  }
  return { category, score: best, matchedTerms: matched[category] || [] };
}

function confidenceFor(score) {
  if (score <= 0) return 0.3;
  return Math.min(0.9, 0.55 + score * 0.05);
}

const TEMPLATES = {
  pothole: (s) => `Pothole / road damage reported in ${s}.`,
  garbage: (s) => `Garbage accumulation reported in ${s}.`,
  streetlight: (s) => `Streetlight not working reported in ${s}.`,
  water_leak: (s) => `Water leakage reported in ${s}.`,
  other: (s) => `Civic issue reported in ${s}.`,
};

const SIGNAL_PHRASES = {
  electrical_danger: 'Possible electrical hazard.',
  school_proximity: 'Reported near a school.',
  hospital_proximity: 'Reported near a hospital or clinic.',
  accident_risk: 'Accident/injury risk reported.',
  children_risk: 'Children frequently pass through the area.',
  major_severity: 'Reported as a major issue.',
  health_risk: 'Possible public health risk.',
};

function buildCleanComplaint({ category, sector, text, photo }) {
  let clean = TEMPLATES[category](sector || 'Chandigarh');
  for (const signal of detectSignals(text)) clean += ` ${SIGNAL_PHRASES[signal]}`;
  if (photo) clean += ' Photo evidence attached.';
  return clean.slice(0, 500);
}

function classify({ text, sector, photo }) {
  const { category, score, matchedTerms } = scoreText(text);
  return {
    category,
    confidence: Number(confidenceFor(score).toFixed(2)),
    clean_complaint: buildCleanComplaint({ category, sector, text, photo }),
    matched_terms: matchedTerms,
  };
}

module.exports = { classify, buildCleanComplaint, scoreText };