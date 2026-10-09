const { LANGUAGES } = require('../../config/constants');

const GURMUKHI_RE = /[\u0A00-\u0A7F]/;
const DEVANAGARI_RE = /[\u0900-\u097F]/;

// Romanized Hindi/Punjabi function words — 2+ hits means Hinglish.
const HINGLISH_TOKENS = [
  'hai', 'mein', 'vich', 'nahi', 'nahin', 'raha', 'rahi', 'bahut', 'bada', 'kya',
  'kar', 'karo', 'gaddha', 'gadda', 'sadak', 'kachra', 'kooda', 'paani', 'batti', 'ho',
].map((t) => new RegExp(`(?<![a-z])${t}(?![a-z])`));

function detectLanguage(text) {
  const t = String(text || '');
  if (!t.trim()) return 'en';
  if (GURMUKHI_RE.test(t)) return 'pa';
  if (DEVANAGARI_RE.test(t)) return 'hi';
  const lower = ` ${t.toLowerCase()} `;
  let hits = 0;
  for (const re of HINGLISH_TOKENS) {
    if (re.test(lower)) hits += 1;
    if (hits >= 2) return 'hinglish';
  }
  return 'en';
}

function isSupported(code) {
  return typeof code === 'string' && LANGUAGES.includes(code);
}

// Accept a valid client-supplied code; otherwise detect from the text itself.
function normalizeLanguage(input, text) {
  if (typeof input === 'string') {
    const v = input.toLowerCase().trim();
    if (isSupported(v)) return v;
  }
  return detectLanguage(text);
}

module.exports = { detectLanguage, normalizeLanguage, isSupported };