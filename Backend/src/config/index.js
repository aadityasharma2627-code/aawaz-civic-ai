require('dotenv').config();

function parseCorsOrigins() {
  const raw = (process.env.FRONTEND_URL || '').trim();
  if (raw) return raw.split(',').map((s) => s.trim()).filter(Boolean);
  // Development-only default; production requires FRONTEND_URL.
  return ['http://localhost:5173', 'http://localhost:3000'];
}

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '4000', 10),

  databaseUrl: process.env.DATABASE_URL || '',
  databaseSsl:
    process.env.DATABASE_SSL === 'true' ||
    /supabase\.(co|com|in)/i.test(process.env.DATABASE_URL || ''),

  supabaseUrl: process.env.SUPABASE_URL || '',       // reserved for future storage
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',

  ai: {
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '8000', 10),
  },

  includeAiMeta: process.env.INCLUDE_AI_META === 'true',
  corsOrigins: parseCorsOrigins(),
  rateLimit: { windowMs: 10 * 60 * 1000, max: 500 },
};

module.exports = config;