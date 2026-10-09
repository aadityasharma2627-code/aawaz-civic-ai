/**
 * Optional LLM integration (any OpenAI-compatible API: OpenAI, Groq, OpenRouter,
 * Ollama's /v1 endpoint...). Returns a VALIDATED result or throws — the caller
 * always falls back to the deterministic classifier on any failure.
 */
const config = require('../../config');
const { CATEGORIES } = require('../../config/constants');

const SYSTEM_PROMPT = [
  'You are the classification engine of Awaaz, a civic complaint system for Chandigarh, India.',
  'Classify the citizen complaint into exactly one category:',
  '- pothole: potholes, damaged/broken roads, footpaths',
  '- garbage: garbage, waste, overflowing dustbins, sanitation',
  '- streetlight: street lights, lamps, poles, street electrical hazards',
  '- water_leak: water leakage, broken pipes, water supply problems',
  '- other: anything else',
  'The complaint may be in English, Hindi (Devanagari), Punjabi (Gurmukhi) or Hinglish (romanized).',
  'Rewrite it as one clean formal English sentence (max 2) for a municipal record; keep location details.',
  'Respond with ONLY valid JSON, no other text:',
  '{"category": "pothole|garbage|streetlight|water_leak|other", "confidence": 0.0-1.0, "clean_complaint": "..."}',
].join('\n');

function extractJson(content) {
  const trimmed = String(content || '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  return JSON.parse(trimmed);
}

async function classify({ text, language, sector }) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ai.timeoutMs);

  try {
    const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.ai.apiKey}` },
      body: JSON.stringify({
        model: config.ai.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Language: ${language || 'unknown'}\nSector/Area: ${sector || 'unknown'}\nComplaint:\n"""\n${text}\n"""`,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LLM HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const parsed = extractJson(data?.choices?.[0]?.message?.content);

    // STRICT output validation — never trust free-form model output.
    if (!CATEGORIES.includes(parsed.category)) throw new Error('LLM returned an invalid category.');
    const clean = typeof parsed.clean_complaint === 'string' ? parsed.clean_complaint.trim().slice(0, 500) : '';
    if (clean.length < 5) throw new Error('LLM returned an invalid clean_complaint.');
    const confidence = Number(parsed.confidence);

    return {
      category: parsed.category,
      confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0.7,
      clean_complaint: clean,
      matched_terms: [],
      latency_ms: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { classify };