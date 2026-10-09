const priorityService = require('../../src/services/priority/priorityService');

describe('priority calculation (deterministic rules)', () => {
  test('large pothole is HIGH (base 55 + severity 15 = 70)', () => {
    const r = priorityService.calculate({ category: 'pothole', text: 'bada gadda hai sadak par' });
    expect(r.priority).toBe('HIGH');
    expect(r.priority_score).toBe(70);
  });

  test('sparking streetlight is HIGH (40 + 35)', () => {
    const r = priorityService.calculate({ category: 'streetlight', text: 'street light par sparking ho rahi hai' });
    expect(r.priority).toBe('HIGH');
    expect(r.priority_score).toBe(75);
  });

  test('plain garbage is LOW', () => {
    const r = priorityService.calculate({ category: 'garbage', text: 'kachra pada hai' });
    expect(r.priority).toBe('LOW');
    expect(r.priority_score).toBe(35);
  });

  test('water leak near hospital is HIGH (45 + 25)', () => {
    const r = priorityService.calculate({ category: 'water_leak', text: 'hospital ke paas paani leak ho raha hai' });
    expect(r.priority).toBe('HIGH');
    expect(r.priority_score).toBe(70);
  });

  test('more reports escalate the score (+5 per extra report, max +20)', () => {
    const r = priorityService.calculate({ category: 'garbage', text: 'kachra pada hai', reportCount: 5 });
    expect(r.priority_score).toBe(55); // 35 + 20
  });

  test('photo evidence adds +5', () => {
    const r = priorityService.calculate({ category: 'garbage', text: 'kachra pada hai', hasPhoto: true });
    expect(r.priority_score).toBe(40);
  });

  test('score is clamped to 100 and exposes factors', () => {
    const r = priorityService.calculate({
      category: 'pothole',
      text: 'school ke paas bada gadda hai, accident hua hai, bachche gir gaye',
      reportCount: 50,
      hasPhoto: true,
    });
    expect(r.priority_score).toBe(100);
    expect(r.priority).toBe('HIGH');
    expect(Array.isArray(r.factors)).toBe(true);
  });
});