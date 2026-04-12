const CACHE_NAME = 'dailytrack-v1'
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache opened')
      return cache.addAll(URLS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - Network first strategy
self.addEventListener('fetch', event => {
  // Skip API calls, only cache static assets
  if (event.request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response
        const responseClone = response.clone()
        
        // Cache the response
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone)
        })
        
        return response
      })
      .catch(() => {
        // Return cached version if network fails
        return caches.match(event.request).then(response => {
          return response || new Response('Offline - Content not available')
        })
      })
  )
})
