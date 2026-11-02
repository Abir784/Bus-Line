// Shared helpers for talking to the tracking WebSocket service.
//
// Server-side (API routes) broadcast location updates to the Render tracking service.
// Browser-side connects directly to the same service (URL exposed via NEXT_PUBLIC_* env).

import { io as ioClient } from 'socket.io-client'

export const TRACKING_PATH = '/socket.io'

// URL the browser should connect to. Falls back to the in-sandbox Caddy gateway.
export const TRACKING_CLIENT_URL =
  process.env.NEXT_PUBLIC_TRACKING_SERVICE_URL || '/?XTransformPort=3003'

// URL the Next.js server (API routes) should connect to. Falls back to localhost for dev.
export function trackingServerUrl(): string {
  return process.env.TRACKING_SERVICE_URL || process.env.TRACKING_SERVICE_INTERNAL_URL || 'http://localhost:3003'
}

export async function broadcastLocation(payload: Record<string, unknown>): Promise<void> {
  try {
    const sock = ioClient(trackingServerUrl(), {
      transports: ['websocket'],
      reconnection: false,
      timeout: 3000,
      forceNew: true,
      path: TRACKING_PATH,
    })
    await new Promise<void>((resolve) => {
      sock.on('connect', () => {
        sock.emit('update-location', payload)
        setTimeout(() => {
          sock.disconnect()
          resolve()
        }, 100)
      })
      sock.on('connect_error', (err: unknown) => {
        console.error('[tracking] ws connect_error:', err)
        resolve()
      })
      setTimeout(() => resolve(), 3000)
    })
  } catch (e) {
    console.error('[tracking] broadcast failed:', e)
  }
}
