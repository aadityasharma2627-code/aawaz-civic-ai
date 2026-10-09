// Minimal service worker: network-first with offline shell fallback.
// Registered only in production builds (see src/main.jsx).
const CACHE = 'awaaz-shell-v1'
const SHELL = ['/', '/index.html']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  // Never intercept API calls - the offline queue handles those in-app.
  if (new URL(request.url).pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached || caches.match('/index.html'))
    )
  )
})
