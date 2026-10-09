const departmentRouter = require('../../src/services/routing/departmentRouter');
const { CATEGORIES, DEPARTMENT_BY_CATEGORY } = require('../../src/config/constants');

describe('department routing', () => {
  test('routes every category to its official department', () => {
    for (const c of CATEGORIES) {
      expect(departmentRouter.route(c)).toBe(DEPARTMENT_BY_CATEGORY[c]);
    }
  });

  test('is case-insensitive', () => {
    expect(departmentRouter.route('Pothole')).toBe('MC Roads');
  });

  test('rejects unknown categories (no arbitrary departments)', () => {
    expect(() => departmentRouter.route('free_pizza')).toThrow();
  });
});