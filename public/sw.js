const CACHE_NAME = 'casa-arrumada-v1'

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/tasks',
  '/events',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Network-first for navigation, cache-first for assets
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/dashboard').then((r) => r || fetch(event.request))
      )
    )
    return
  }

  if (event.request.url.includes('/icons/') || event.request.url.includes('/manifest')) {
    event.respondWith(
      caches.match(event.request).then((r) => r || fetch(event.request))
    )
  }
})
