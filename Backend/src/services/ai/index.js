/**
 * AI service facade — the "AI that hears Chandigarh".
 *
 * Accepts: { text, language, sector, photo, categoryHint }
 * Returns the SAME strict, predictable JSON every time — never free-form
 * natural language:
 *   { category, confidence, clean_complaint, priority, priority_score, department, _meta }
 *
 * Design guarantee: the LLM only suggests category + clean text.
 * Priority and department are ALWAYS computed by deterministic server-side
 * services, so routing and urgency are auditable and can never be prompt-injected.
 */
const classifier = require('../classification/classifier');
const priorityService = require('../priority/priorityService');
const departmentRouter = require('../routing/departmentRouter');

async function analyzeComplaint({ text, language, sector, photo, categoryHint }) {
  const started = Date.now();

  const classification = await classifier.classify({ text, language, sector, photo, categoryHint });

  const priority = priorityService.calculate({
    category: classification.category,
    text,
    reportCount: 1,
    hasPhoto: Boolean(photo),
  });

  const department = departmentRouter.route(classification.category);

  return {
    category: classification.category,
    confidence: classification.confidence,
    clean_complaint: classification.clean_complaint,
    priority: priority.priority,
    priority_score: priority.priority_score,
    department,
    _meta: {
      classification_source: classification.source, // 'ai' | 'fallback' | 'manual'
      classification_latency_ms: classification.latency_ms ?? Date.now() - started,
      matched_terms: classification.matched_terms || [],
      priority_factors: priority.factors,
    },
  };
}

module.exports = { analyzeComplaint };