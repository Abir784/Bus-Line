// POST /api/admin/bus-location
// Body: { tripId, busId, action: 'advance' | 'set', currentCounterId?, nextCounterId?, lat?, lng?, speed?, status?, progressPct?, etaMinutes? }
//
// Persists the new BusLocation row AND broadcasts it via the WebSocket service so subscribers
// (the user-facing tracking page) get a live update.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { io as ioClient } from 'socket.io-client'

async function broadcast(payload: Record<string, unknown>) {
  try {
    // Server-side: connect directly to the tracking service on its own port.
    // (Caddy gateway is for browser clients only.) The tracking service uses
    // socket.io with path: '/', so the client must match.
    const sock = ioClient('http://localhost:3003', {
      transports: ['websocket'],
      reconnection: false,
      timeout: 3000,
      forceNew: true,
      path: '/',
    })
    await new Promise<void>((resolve) => {
      sock.on('connect', () => {
        sock.emit('update-location', payload)
        // Give the emit a tick to flush before disconnecting.
        setTimeout(() => {
          sock.disconnect()
          resolve()
        }, 100)
      })
      sock.on('connect_error', (err: unknown) => {
        console.error('[bus-location] ws connect_error:', err)
        resolve()
      })
      setTimeout(() => resolve(), 3000)
    })
  } catch (e) {
    console.error('[bus-location] broadcast failed:', e)
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { tripId, busId, action } = body as {
    tripId: string
    busId: string
    action: 'advance' | 'set'
    currentCounterId?: string | null
    nextCounterId?: string | null
    lat?: number
    lng?: number
    speed?: number
    status?: 'IDLE' | 'MOVING' | 'AT_COUNTER' | 'ARRIVED'
    progressPct?: number
    etaMinutes?: number
  }

  if (!tripId || !busId) {
    return NextResponse.json({ error: 'tripId and busId required' }, { status: 400 })
  }

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      route: { include: { counters: { orderBy: { sequence: 'asc' } } } },
      locations: { orderBy: { lastUpdated: 'desc' }, take: 1 },
    },
  })
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  const counters = trip.route.counters
  if (counters.length === 0) {
    return NextResponse.json({ error: 'Route has no counters' }, { status: 400 })
  }

  const prev = trip.locations[0]
  let currentIdx = 0
  if (prev?.currentCounterId) {
    const idx = counters.findIndex((c) => c.id === prev.currentCounterId)
    if (idx >= 0) currentIdx = idx
  }

  let payload: {
    busId: string
    tripId: string
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

  if (action === 'advance') {
    // Move the bus to the NEXT counter (or to the next leg with a 50% progress step).
    const nextIdx = Math.min(currentIdx + 1, counters.length - 1)
    const current = counters[nextIdx]
    const next = counters[Math.min(nextIdx + 1, counters.length - 1)]
    const isAtEnd = nextIdx >= counters.length - 1

    payload = {
      busId,
      tripId,
      lat: current.lat,
      lng: current.lng,
      currentCounterId: current.id,
      currentCounterName: current.name,
      nextCounterId: isAtEnd ? null : next.id,
      nextCounterName: isAtEnd ? null : next.name,
      speed: 0,
      heading: 0,
      status: isAtEnd ? 'ARRIVED' : 'AT_COUNTER',
      progressPct: isAtEnd ? 100 : (nextIdx / (counters.length - 1)) * 100,
      etaMinutes: isAtEnd ? 0 : Math.max(0, (current.minutesFromStart - (prev?.etaMinutes ?? 0)) || 30),
      lastUpdated: new Date().toISOString(),
    }

    // If the trip just arrived, mark it ARRIVED.
    if (isAtEnd) {
      await db.trip.update({ where: { id: tripId }, data: { status: 'ARRIVED' } })
    } else if (trip.status === 'BOARDING' || trip.status === 'SCHEDULED') {
      await db.trip.update({ where: { id: tripId }, data: { status: 'DEPARTED' } })
    }
  } else {
    // "set" — explicit values, or interpolate between current and next counter using progressPct.
    const targetProgress = typeof body.progressPct === 'number' ? body.progressPct : (prev?.progressPct ?? 0)
    const targetIdx = Math.min(
      counters.length - 1,
      Math.floor((targetProgress / 100) * (counters.length - 1))
    )
    const nextIdx = Math.min(targetIdx + 1, counters.length - 1)
    const from = counters[targetIdx]
    const to = counters[nextIdx]
    const segT = (counters.length > 1)
      ? (targetProgress / 100) * (counters.length - 1) - targetIdx
      : 0
    const lat = typeof body.lat === 'number' ? body.lat : lerp(from.lat, to.lat, segT)
    const lng = typeof body.lng === 'number' ? body.lng : lerp(from.lng, to.lng, segT)

    payload = {
      busId,
      tripId,
      lat,
      lng,
      currentCounterId: from.id,
      currentCounterName: from.name,
      nextCounterId: targetIdx >= counters.length - 1 ? null : to.id,
      nextCounterName: targetIdx >= counters.length - 1 ? null : to.name,
      speed: typeof body.speed === 'number' ? body.speed : 50,
      heading: 0,
      status: body.status ?? (targetProgress >= 100 ? 'ARRIVED' : targetProgress === 0 ? 'AT_COUNTER' : 'MOVING'),
      progressPct: targetProgress,
      etaMinutes: typeof body.etaMinutes === 'number' ? body.etaMinutes : Math.max(0, Math.round(((100 - targetProgress) / 100) * trip.route.estimatedMinutes)),
      lastUpdated: new Date().toISOString(),
    }
  }

  // Persist.
  const created = await db.busLocation.create({
    data: {
      bus: { connect: { id: payload.busId } },
      trip: { connect: { id: payload.tripId } },
      lat: payload.lat,
      lng: payload.lng,
      currentCounterId: payload.currentCounterId,
      currentCounterName: payload.currentCounterName,
      nextCounterId: payload.nextCounterId,
      nextCounterName: payload.nextCounterName,
      speed: payload.speed,
      heading: payload.heading,
      status: payload.status,
      progressPct: payload.progressPct,
      etaMinutes: payload.etaMinutes,
      lastUpdated: new Date(payload.lastUpdated),
    },
  })

  // Broadcast to WebSocket subscribers.
  await broadcast(payload)

  return NextResponse.json({ ok: true, location: created })
}
