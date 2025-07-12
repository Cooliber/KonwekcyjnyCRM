// HVAC Mobile Service Worker for Offline Functionality
const CACHE_NAME = 'hvac-mobile-v1.0.0';
const STATIC_CACHE_NAME = 'hvac-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'hvac-dynamic-v1.0.0';
const MAP_CACHE_NAME = 'hvac-maps-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/mobile',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add your main CSS and JS files here
];

// Map tile URLs to cache for offline use
const MAP_TILE_PATTERNS = [
  /^https:\/\/[abc]\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/,
  /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/\d+\/\d+\/\d+$/
];

// API endpoints that should work offline
const API_PATTERNS = [
  /^.*\/api\/jobs\/today$/,
  /^.*\/api\/technician\/profile$/,
  /^.*\/api\/routes\/current$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== MAP_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests with appropriate strategies
  if (request.method === 'GET') {
    // Map tiles - Cache First strategy
    if (MAP_TILE_PATTERNS.some(pattern => pattern.test(request.url))) {
      event.respondWith(handleMapTiles(request));
      return;
    }

    // API requests - Network First with fallback
    if (API_PATTERNS.some(pattern => pattern.test(request.url))) {
      event.respondWith(handleAPIRequests(request));
      return;
    }

    // Static assets - Cache First
    if (STATIC_ASSETS.includes(url.pathname)) {
      event.respondWith(handleStaticAssets(request));
      return;
    }

    // Other requests - Stale While Revalidate
    event.respondWith(handleDynamicRequests(request));
  }
});

// Cache First strategy for map tiles
async function handleMapTiles(request) {
  try {
    const cache = await caches.open(MAP_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version immediately
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.log('Map tile fetch failed:', error);
    // Return a placeholder tile or cached version
    return new Response('', { status: 404 });
  }
}

// Network First strategy for API requests
async function handleAPIRequests(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('API request failed, trying cache:', error);
    
    // Fallback to cache
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback data
    return createOfflineFallback(request);
  }
}

// Cache First strategy for static assets
async function handleStaticAssets(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network if not in cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.log('Static asset fetch failed:', error);
    return new Response('', { status: 404 });
  }
}

// Stale While Revalidate strategy for dynamic content
async function handleDynamicRequests(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Fetch from network in background
    const networkPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }).catch(() => null);
    
    // Return cached version immediately if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Otherwise wait for network
    return await networkPromise || new Response('', { status: 404 });
    
  } catch (error) {
    console.log('Dynamic request failed:', error);
    return new Response('', { status: 404 });
  }
}

// Create offline fallback responses
function createOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Fallback data for different API endpoints
  if (url.pathname.includes('/jobs/today')) {
    return new Response(JSON.stringify({
      jobs: [],
      offline: true,
      message: 'Offline mode - cached data may be outdated'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.pathname.includes('/technician/profile')) {
    return new Response(JSON.stringify({
      name: 'Technician',
      offline: true,
      message: 'Offline mode - limited functionality'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({
    error: 'Offline',
    message: 'This feature requires an internet connection'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'job-updates') {
    event.waitUntil(syncJobUpdates());
  }
  
  if (event.tag === 'location-updates') {
    event.waitUntil(syncLocationUpdates());
  }
});

// Sync job status updates when back online
async function syncJobUpdates() {
  try {
    // Get pending job updates from IndexedDB
    const pendingUpdates = await getPendingJobUpdates();
    
    for (const update of pendingUpdates) {
      try {
        await fetch('/api/jobs/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        
        // Remove from pending updates
        await removePendingJobUpdate(update.id);
        
      } catch (error) {
        console.log('Failed to sync job update:', error);
      }
    }
    
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Sync location updates when back online
async function syncLocationUpdates() {
  try {
    // Get pending location updates from IndexedDB
    const pendingLocations = await getPendingLocationUpdates();
    
    for (const location of pendingLocations) {
      try {
        await fetch('/api/technician/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(location)
        });
        
        // Remove from pending updates
        await removePendingLocationUpdate(location.id);
        
      } catch (error) {
        console.log('Failed to sync location update:', error);
      }
    }
    
  } catch (error) {
    console.log('Location sync failed:', error);
  }
}

// IndexedDB helpers (simplified - would need full implementation)
async function getPendingJobUpdates() {
  // Implementation would use IndexedDB to store/retrieve pending updates
  return [];
}

async function removePendingJobUpdate(id) {
  // Implementation would remove from IndexedDB
}

async function getPendingLocationUpdates() {
  // Implementation would use IndexedDB to store/retrieve pending locations
  return [];
}

async function removePendingLocationUpdate(id) {
  // Implementation would remove from IndexedDB
}

// Enhanced push notification handling with AI-driven features
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  let notificationData = {
    title: 'HVAC Mobile',
    body: 'You have a new notification',
    priority: 'normal',
    type: 'system',
    district: null,
    actionUrl: '/mobile'
  };

  // Parse notification data if available
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (e) {
      console.log('Failed to parse notification data:', e);
    }
  }

  // Determine notification options based on priority and type
  const options = createNotificationOptions(notificationData);

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title, options),
      // Store notification for offline access
      storeNotificationOffline(notificationData),
      // Update badge count
      updateBadgeCount()
    ])
  );
});

// Create notification options based on data
function createNotificationOptions(data) {
  const baseOptions = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: data.actionUrl || '/mobile',
      type: data.type,
      priority: data.priority,
      district: data.district,
      timestamp: Date.now()
    },
    tag: data.type, // Group similar notifications
    renotify: data.priority === 'urgent', // Re-alert for urgent notifications
    requireInteraction: data.priority === 'urgent' || data.type === 'emergency',
    silent: data.priority === 'low'
  };

  // Priority-based customization
  switch (data.priority) {
    case 'urgent':
      return {
        ...baseOptions,
        vibrate: [300, 100, 300, 100, 300],
        actions: [
          {
            action: 'view_urgent',
            title: '🚨 View Now',
            icon: '/icons/action-urgent.png'
          },
          {
            action: 'call_support',
            title: '📞 Call Support',
            icon: '/icons/action-call.png'
          }
        ]
      };

    case 'high':
      return {
        ...baseOptions,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'view',
            title: 'View Details',
            icon: '/icons/action-view.png'
          },
          {
            action: 'acknowledge',
            title: 'Acknowledge',
            icon: '/icons/action-check.png'
          }
        ]
      };

    case 'medium':
      return {
        ...baseOptions,
        vibrate: [100, 50, 100],
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/icons/action-view.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/action-dismiss.png'
          }
        ]
      };

    case 'low':
      return {
        ...baseOptions,
        vibrate: [50],
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/icons/action-view.png'
          }
        ]
      };

    default:
      return {
        ...baseOptions,
        vibrate: [100, 50, 100],
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/icons/action-view.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/action-dismiss.png'
          }
        ]
      };
  }
}

// Store notification for offline access
async function storeNotificationOffline(notificationData) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const notificationKey = `notification_${Date.now()}`;

    const response = new Response(JSON.stringify(notificationData), {
      headers: { 'Content-Type': 'application/json' }
    });

    await cache.put(notificationKey, response);
  } catch (error) {
    console.log('Failed to store notification offline:', error);
  }
}

// Update badge count
async function updateBadgeCount() {
  try {
    // Get stored notifications count
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const keys = await cache.keys();
    const notificationKeys = keys.filter(key => key.url.includes('notification_'));

    // Update badge (if supported)
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(notificationKeys.length);
    }
  } catch (error) {
    console.log('Failed to update badge count:', error);
  }
}

// Enhanced notification click handling with action routing
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  // Handle different actions
  switch (action) {
    case 'view_urgent':
      event.waitUntil(handleUrgentView(data));
      break;

    case 'call_support':
      event.waitUntil(handleCallSupport(data));
      break;

    case 'acknowledge':
      event.waitUntil(handleAcknowledge(data));
      break;

    case 'view':
      event.waitUntil(handleView(data));
      break;

    case 'dismiss':
      event.waitUntil(handleDismiss(data));
      break;

    default:
      // Default click (no action button)
      event.waitUntil(handleDefaultClick(data));
      break;
  }

  // Analytics tracking
  trackNotificationInteraction(action, data);
});

// Handle urgent notification view
async function handleUrgentView(data) {
  try {
    // Focus existing window or open new one
    const windowClients = await clients.matchAll({ type: 'window' });

    if (windowClients.length > 0) {
      // Focus existing window and navigate
      const client = windowClients[0];
      await client.focus();
      client.postMessage({
        type: 'URGENT_NOTIFICATION',
        url: data.url,
        data: data
      });
    } else {
      // Open new window
      await clients.openWindow(data.url + '?urgent=true');
    }

    // Mark as clicked
    await markNotificationClicked(data);

  } catch (error) {
    console.log('Failed to handle urgent view:', error);
  }
}

// Handle call support action
async function handleCallSupport(data) {
  try {
    // Open phone dialer if on mobile, otherwise open contact page
    if ('navigator' in self && 'userAgent' in navigator) {
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        await clients.openWindow('tel:+48123456789'); // Emergency support number
      } else {
        await clients.openWindow('/contact?emergency=true');
      }
    }

    await markNotificationClicked(data);

  } catch (error) {
    console.log('Failed to handle call support:', error);
  }
}

// Handle acknowledge action
async function handleAcknowledge(data) {
  try {
    // Send acknowledgment to server
    await fetch('/api/notifications/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.notificationId,
        timestamp: Date.now()
      })
    });

    // Show confirmation
    await self.registration.showNotification('Acknowledged', {
      body: 'Notification acknowledged successfully',
      icon: '/icons/icon-192x192.png',
      tag: 'acknowledgment',
      silent: true
    });

    await markNotificationClicked(data);

  } catch (error) {
    console.log('Failed to acknowledge notification:', error);
  }
}

// Handle regular view action
async function handleView(data) {
  try {
    const windowClients = await clients.matchAll({ type: 'window' });

    if (windowClients.length > 0) {
      const client = windowClients[0];
      await client.focus();
      client.postMessage({
        type: 'NAVIGATE',
        url: data.url
      });
    } else {
      await clients.openWindow(data.url);
    }

    await markNotificationClicked(data);

  } catch (error) {
    console.log('Failed to handle view:', error);
  }
}

// Handle dismiss action
async function handleDismiss(data) {
  try {
    // Just mark as dismissed - no navigation
    await markNotificationDismissed(data);

  } catch (error) {
    console.log('Failed to handle dismiss:', error);
  }
}

// Handle default click (no action button)
async function handleDefaultClick(data) {
  try {
    // Determine best action based on notification type
    switch (data.type) {
      case 'emergency':
        await handleUrgentView(data);
        break;

      case 'job_assigned':
        await handleView({ ...data, url: data.url || '/jobs' });
        break;

      case 'message':
        await handleView({ ...data, url: data.url || '/chat' });
        break;

      default:
        await handleView(data);
        break;
    }

  } catch (error) {
    console.log('Failed to handle default click:', error);
  }
}

// Mark notification as clicked
async function markNotificationClicked(data) {
  try {
    await fetch('/api/notifications/clicked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.notificationId,
        clickedAt: Date.now(),
        action: 'clicked'
      })
    });
  } catch (error) {
    console.log('Failed to mark notification as clicked:', error);
  }
}

// Mark notification as dismissed
async function markNotificationDismissed(data) {
  try {
    await fetch('/api/notifications/dismissed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.notificationId,
        dismissedAt: Date.now(),
        action: 'dismissed'
      })
    });
  } catch (error) {
    console.log('Failed to mark notification as dismissed:', error);
  }
}

// Track notification interactions for analytics
function trackNotificationInteraction(action, data) {
  try {
    // Send analytics data
    fetch('/api/analytics/notification-interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        type: data.type,
        priority: data.priority,
        district: data.district,
        timestamp: Date.now()
      })
    }).catch(error => {
      console.log('Failed to track notification interaction:', error);
    });
  } catch (error) {
    console.log('Failed to track notification interaction:', error);
  }
}
