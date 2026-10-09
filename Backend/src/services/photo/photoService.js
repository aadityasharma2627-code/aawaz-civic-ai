/**
 * Photo handling is intentionally modular.
 * v1: accepts an http(s) image URL or a base64 data:image URL, stored as photo_url.
 * v2+: swap validatePhoto() for a real uploader (Supabase Storage / S3) — the rest
 * of the pipeline only ever sees a `photo_url` string, and the entire text/voice
 * complaint flow works perfectly with photo === null.
 */
const MAX_URL_LENGTH = 2048;
const MAX_DATA_URL_LENGTH = 3000000; // ~2.2 MB base64 image
const HTTP_URL_RE = /^https?:\/\/\S+$/i;
const DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i;

function validatePhoto(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  if (!s) return null; // empty string = no photo, not an error
  if (HTTP_URL_RE.test(s) && s.length <= MAX_URL_LENGTH) return s;
  if (DATA_URL_RE.test(s) && s.length <= MAX_DATA_URL_LENGTH) return s;
  return null;
}

module.exports = { validatePhoto };