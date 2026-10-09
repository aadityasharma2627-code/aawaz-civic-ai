// Shared hazard/severity signal detection (Hindi + Punjabi + English + Hinglish).
// Used by BOTH the deterministic priority scorer and the fallback complaint writer,
// so a single source of truth drives "how dangerous does this sound".

const SIGNALS = [
  { name: 'electrical_danger',  weight: 35, terms: ['sparking', 'spark', 'bijli', 'बिजली', 'ਬਿਜਲੀ', 'current', 'electrocut', 'wire hanging', 'झटका'] },
  { name: 'school_proximity',   weight: 25, terms: ['school', 'स्कूल', 'ਸਕੂਲ', 'skool', 'vidyalaya'] },
  { name: 'hospital_proximity', weight: 25, terms: ['hospital', 'अस्पताल', 'ਹਸਪਤਾਲ', 'dispensary', 'clinic', 'nursing home'] },
  { name: 'accident_risk',      weight: 25, terms: ['accident', 'hadsa', 'हादसा', 'ਹਾਦਸਾ', 'दुर्घटना', 'injur', 'ghayal', 'चोट', 'ਸੱਟ'] },
  { name: 'children_risk',      weight: 15, terms: ['bacha', 'bachche', 'bachon', 'बच्चे', 'ਬੱਚੇ', 'child', 'children', 'kids'] },
  { name: 'major_severity',     weight: 15, terms: ['bahut', 'bohot', 'bada', 'bade', 'major', 'severe', 'big', 'huge', 'deep', 'flood', 'jama', 'बहुत', 'बड़ा', 'ਬਹੁਤ', 'ਵੱਡਾ', 'हफ्तों', 'weeks', 'din se', 'days'] },
  { name: 'health_risk',        weight: 10, terms: ['bimari', 'बीमारी', 'ਬਿਮਾਰੀ', 'disease', 'dengue', 'malaria', 'smell', 'stink', 'बदबू', 'ਬਦਬੂ', 'health'] },
];

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function buildMatcher(term) {
  if (/^[a-z0-9' -]+$/i.test(term)) {
    const re = new RegExp(`(?<![a-z0-9])${escapeRe(term)}(?![a-z0-9])`, 'i');
    return (text) => re.test(text);
  }
  return (text) => text.includes(term); // Devanagari / Gurmukhi
}

const COMPILED = SIGNALS.map((s) => ({ ...s, matchers: s.terms.map(buildMatcher) }));

function detectSignals(rawText) {
  const text = String(rawText || '').toLowerCase();
  const found = [];
  for (const signal of COMPILED) {
    for (const match of signal.matchers) {
      if (match(text)) { found.push(signal.name); break; }
    }
  }
  return found;
}

module.exports = { detectSignals, SIGNALS };