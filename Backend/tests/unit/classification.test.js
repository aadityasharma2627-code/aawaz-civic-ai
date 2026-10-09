const { classify } = require('../../src/services/ai/fallbackClassifier');
const { detectLanguage } = require('../../src/services/language/languageService');

describe('deterministic fallback classifier (multilingual)', () => {
  test('classifies Hinglish pothole', () => {
    const r = classify({ text: 'Sector 22 mein road par bada gadda hai', sector: 'Sector 22' });
    expect(r.category).toBe('pothole');
    expect(r.confidence).toBeGreaterThan(0.5);
    expect(r.clean_complaint).toContain('Sector 22');
  });

  test('classifies Punjabi (romanized) garbage', () => {
    const r = classify({ text: 'Sector 35 vich kooda bahut jama hai', sector: 'Sector 35' });
    expect(r.category).toBe('garbage');
  });

  test('classifies Punjabi (Gurmukhi) garbage', () => {
    const r = classify({ text: 'ਸੈਕਟਰ 35 ਵਿੱਚ ਕੂੜਾ ਬਹੁਤ ਜਮਾ ਹੈ', sector: 'Sector 35' });
    expect(r.category).toBe('garbage');
  });

  test('classifies English streetlight', () => {
    const r = classify({ text: 'There is a broken street light near the school', sector: 'Sector 21' });
    expect(r.category).toBe('streetlight');
  });

  test('classifies Hinglish water leak', () => {
    const r = classify({ text: 'Sector 43 mein paani leak ho raha hai', sector: 'Sector 43' });
    expect(r.category).toBe('water_leak');
  });

  test('classifies Hindi (Devanagari) pothole', () => {
    const r = classify({ text: 'सेक्टर 22 में सड़क पर बड़ा गड्ढा है', sector: 'Sector 22' });
    expect(r.category).toBe('pothole');
  });

  test('classifies Hindi (Devanagari) garbage', () => {
    const r = classify({ text: 'सेक्टर 35 में कचरा बहुत जमा है', sector: 'Sector 35' });
    expect(r.category).toBe('garbage');
  });

  test('falls back to "other" for unrelated text with low confidence', () => {
    const r = classify({ text: 'Please increase the bus frequency on this route', sector: 'Sector 20' });
    expect(r.category).toBe('other');
    expect(r.confidence).toBeLessThanOrEqual(0.35);
  });

  test('clean complaint mentions hazards, sector and photo', () => {
    const r = classify({ text: 'bijli ka taar sparking ho raha hai school ke paas', sector: 'Sector 9', photo: 'https://x.com/a.jpg' });
    expect(r.clean_complaint).toContain('Sector 9');
    expect(r.clean_complaint).toContain('electrical hazard');
    expect(r.clean_complaint).toContain('Photo evidence attached.');
  });
});

describe('language detection', () => {
  test('Devanagari → hi', () => expect(detectLanguage('सड़क पर गड्ढा है')).toBe('hi'));
  test('Gurmukhi → pa', () => expect(detectLanguage('ਸੜਕ ਤੇ ਗੜ੍ਹਾ ਹੈ')).toBe('pa'));
  test('romanized → hinglish', () => expect(detectLanguage('Sector 22 mein bada gadda hai')).toBe('hinglish'));
  test('English → en', () => expect(detectLanguage('There is a broken street light')).toBe('en'));
});