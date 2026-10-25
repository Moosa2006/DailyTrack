const CACHE_NAME = 'dailytrack-v2'
const URLS_TO_CACHE = ['/', '/index.html', '/manifest.json', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName)
          return undefined
        })
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response.ok) return response
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
        return response
      })
      .catch(() => caches.match(request).then((response) => response || caches.match('/index.html')))
  )
})
