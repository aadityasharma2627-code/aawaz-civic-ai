// Structured JSON logging. Complaint text is deliberately never logged in full —
// only metadata (category, source, latency, lengths) to protect citizens.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] || LEVELS.info;

function write(level, msg, extra) {
  if (LEVELS[level] < minLevel) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...(extra || {}) });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

module.exports = {
  debug: (msg, extra) => write('debug', msg, extra),
  info: (msg, extra) => write('info', msg, extra),
  warn: (msg, extra) => write('warn', msg, extra),
  error: (msg, extra) => write('error', msg, extra),
};