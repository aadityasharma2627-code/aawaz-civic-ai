/**
 * Classification orchestrator. Order of precedence:
 *   1. manual hint (validated category supplied with the request)
 *   2. LLM (only if AI_API_KEY is configured)
 *   3. deterministic multilingual keyword fallback  <- can NEVER fail
 */
const config = require('../../config');
const logger = require('../../utils/logger');
const llmProvider = require('../ai/llmProvider');
const fallbackClassifier = require('../ai/fallbackClassifier');

async function classify({ text, language, sector, photo, categoryHint }) {
  if (categoryHint) {
    return {
      category: categoryHint,
      confidence: 1,
      clean_complaint: fallbackClassifier.buildCleanComplaint({ category: categoryHint, sector, text, photo }),
      matched_terms: [],
      source: 'manual',
      latency_ms: 0,
    };
  }

  if (config.ai.apiKey) {
    try {
      const result = await llmProvider.classify({ text, language, sector });
      logger.info('classification.ai', { category: result.category, latency_ms: result.latency_ms });
      return { ...result, source: 'ai' };
    } catch (err) {
      logger.warn('classification.ai_failed_using_fallback', { error: err.message });
    }
  }

  const result = fallbackClassifier.classify({ text, sector, photo });
  logger.info('classification.fallback', { category: result.category, matched_terms: result.matched_terms });
  return { ...result, source: 'fallback' };
}

module.exports = { classify };