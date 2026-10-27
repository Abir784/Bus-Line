// Real-time bus tracking WebSocket service.
// - Holds the latest known location for each (busId, tripId) in memory.
// - Admin clients push "update-location" events; the service broadcasts to all subscribers.
// - "subscribe" event lets a client join a room per tripId (or "all") to receive updates.
//
// All persistence still happens via the Next.js API routes against Prisma. This service is the
// live fan-out layer only.

import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

interface BusLocationPayload {
  busId: string
  tripId: string | null
  lat: number
  lng: number
  currentCounterId: string | null
  currentCounterName: string | null
  nextCounterId: string | null
  nextCounterName: string | null
  speed: number
  heading: number
  status: 'IDLE' | 'MOVING' | 'AT_COUNTER' | 'ARRIVED'
  progressPct: number
  etaMinutes: number
  lastUpdated: string
}

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// In-memory cache of latest location per (busId|tripId) so newly connected clients get a snapshot.
const latest = new Map<string, BusLocationPayload>()

const keyFor = (busId: string, tripId: string | null) =>
  `${busId}|${tripId ?? 'none'}`

io.on('connection', (socket: Socket) => {
  console.log(`[tracking] client connected: ${socket.id}`)

  // Client subscribes to updates for a specific trip (or "all").
  socket.on('subscribe', (data: { tripId?: string } | null) => {
    const tripId = data?.tripId
    if (tripId) {
      void socket.join(`trip:${tripId}`)
      // Send snapshot of all known locations for this trip.
      for (const loc of latest.values()) {
        if (loc.tripId === tripId) socket.emit('location-update', loc)
      }
    } else {
      void socket.join('all')
      for (const loc of latest.values()) socket.emit('location-update', loc)
    }
    console.log(`[tracking] ${socket.id} subscribed to ${tripId ?? 'all'}`)
  })

  socket.on('unsubscribe', (data: { tripId?: string } | null) => {
    if (data?.tripId) {
      void socket.leave(`trip:${data.tripId}`)
    } else {
      void socket.leave('all')
    }
  })

  // Admin / simulator pushes a new location. We cache it and broadcast.
  socket.on('update-location', (payload: BusLocationPayload) => {
    if (!payload || !payload.busId) return
    latest.set(keyFor(payload.busId, payload.tripId), payload)
    // Broadcast to per-trip subscribers and to "all" subscribers.
    if (payload.tripId) {
      io.to(`trip:${payload.tripId}`).emit('location-update', payload)
    }
    io.to('all').emit('location-update', payload)
  })

  socket.on('disconnect', () => {
    console.log(`[tracking] client disconnected: ${socket.id}`)
  })

  socket.on('error', (err: unknown) => {
    console.error(`[tracking] socket error (${socket.id}):`, err)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[tracking] WebSocket service running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('[tracking] SIGTERM, shutting down...')
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  console.log('[tracking] SIGINT, shutting down...')
  httpServer.close(() => process.exit(0))
})
