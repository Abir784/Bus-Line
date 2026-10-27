// POST /api/gps/push
// Simulates a GPS device on a bus pushing its current position.
// In production this is the endpoint a hardware GPS tracker (or a mobile-driver app)
// would POST to every few seconds. The body matches what such devices typically send.
//
// Authentication: the device must include its `gpsDeviceToken`. We match the token to a Bus
// and use the bus's currently-active trip (DEPARTED or BOARDING) to associate the location.
//
// Body: { token: string, lat: number, lng: number, speed?: number, heading?: number, status?: 'MOVING'|'AT_COUNTER'|'ARRIVED' }
//
// The endpoint computes current/next counter by projecting the (lat,lng) onto the route's
// ordered counters, then persists a BusLocation row + broadcasts via the tracking WebSocket
// service so all passengers currently tracking this bus get a live update.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { io as ioClient } from 'socket.io-client'

interface Counter {
  id: string
  name: string
  lat: number
  lng: number
  sequence: number
  minutesFromStart: number
}

// Haversine distance in km.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Find the segment of the route the bus is currently on, based on (lat,lng).
// Returns the index of the closest counter (currentIdx) and the next one (nextIdx).
function projectOntoRoute(lat: number, lng: number, counters: Counter[]): {
  currentIdx: number
  nextIdx: number
  progressPct: number
  distanceFromRouteM: number
} {
  if (counters.length === 0) {
    return { currentIdx: 0, nextIdx: 0, progressPct: 0, distanceFromRouteM: 0 }
  }
  if (counters.length === 1) {
    const d = haversineKm(lat, lng, counters[0]!.lat, counters[0]!.lng) * 1000
    return { currentIdx: 0, nextIdx: 0, progressPct: 100, distanceFromRouteM: d }
  }
  // Find the segment [i, i+1] the bus is closest to.
  let bestSeg = 0
  let bestDist = Infinity
  let bestT = 0 // 0..1 — how far along the segment the bus is
  for (let i = 0; i < counters.length - 1; i++) {
    const a = counters[i]!
    const b = counters[i + 1]!
    // Project (lat,lng) onto the segment [a,b] using simple linear interpolation in lat/lng space.
    // This is approximate (ignores curvature) but good enough for a route map.
    const dx = b.lng - a.lng
    const dy = b.lat - a.lat
    const segLenSq = dx * dx + dy * dy
    let t = segLenSq > 0 ? ((lng - a.lng) * dx + (lat - a.lat) * dy) / segLenSq : 0
    t = Math.max(0, Math.min(1, t))
    const projLat = a.lat + dy * t
    const projLng = a.lng + dx * t
    const d = haversineKm(lat, lng, projLat, projLng) * 1000 // meters
    if (d < bestDist) {
      bestDist = d
      bestSeg = i
      bestT = t
    }
  }
  const currentIdx = bestSeg
  const nextIdx = Math.min(bestSeg + 1, counters.length - 1)
  // Overall progress: (bestSeg + bestT) / (count - 1) * 100
  const progressPct = ((bestSeg + bestT) / (counters.length - 1)) * 100
  return { currentIdx, nextIdx, progressPct, distanceFromRouteM: bestDist }
}

async function broadcast(payload: Record<string, unknown>) {
  try {
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
        setTimeout(() => {
          sock.disconnect()
          resolve()
        }, 100)
      })
      sock.on('connect_error', (err: unknown) => {
        console.error('[gps-push] ws connect_error:', err)
        resolve()
      })
      setTimeout(() => resolve(), 3000)
    })
  } catch (e) {
    console.error('[gps-push] broadcast failed:', e)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { token, lat, lng, speed, heading, status } = body as {
    token?: string
    lat?: number
    lng?: number
    speed?: number
    heading?: number
    status?: 'MOVING' | 'AT_COUNTER' | 'ARRIVED'
  }

  if (!token || typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'token, lat, lng are required' }, { status: 400 })
  }

  // Find the bus by GPS device token.
  const bus = await db.bus.findFirst({ where: { gpsDeviceToken: token } })
  if (!bus) {
    return NextResponse.json({ error: 'Unknown GPS device token' }, { status: 401 })
  }

  // Find the bus's currently-active trip (DEPARTED > BOARDING > latest scheduled).
  const activeTrip = await db.trip.findFirst({
    where: {
      busId: bus.id,
      status: { in: ['BOARDING', 'DEPARTED'] },
    },
    include: { route: { include: { counters: { orderBy: { sequence: 'asc' } } } } },
    orderBy: { departureTime: 'desc' },
  })
  if (!activeTrip) {
    return NextResponse.json(
      { error: 'Bus has no active trip to track', busId: bus.id, busName: bus.name },
      { status: 404 }
    )
  }

  const counters = activeTrip.route.counters as Counter[]
  const proj = projectOntoRoute(lat, lng, counters)
  const current = counters[proj.currentIdx]
  const next = counters[proj.nextIdx]
  // Snap current counter if the bus is within ~100m of it.
  const AT_COUNTER_THRESHOLD_M = 150
  const isAtCounter = proj.distanceFromRouteM < AT_COUNTER_THRESHOLD_M
  const finalStatus =
    status ?? (proj.progressPct >= 99 ? 'ARRIVED' : isAtCounter ? 'AT_COUNTER' : 'MOVING')
  // ETA to next counter (minutes) — based on remaining minutesFromStart delta and current speed.
  const remainingMinutes =
    next && current ? Math.max(0, next.minutesFromStart - current.minutesFromStart) : 0
  const etaMinutes =
    finalStatus === 'ARRIVED'
      ? 0
      : typeof speed === 'number' && speed > 5
        ? Math.max(1, Math.round((remainingMinutes * (proj.progressPct % 1 || 0.5))))
        : remainingMinutes

  const payload = {
    busId: bus.id,
    tripId: activeTrip.id,
    lat,
    lng,
    currentCounterId: current?.id ?? null,
    currentCounterName: current?.name ?? null,
    nextCounterId: next?.id ?? null,
    nextCounterName: next?.name ?? null,
    speed: typeof speed === 'number' ? speed : 0,
    heading: typeof heading === 'number' ? heading : 0,
    status: finalStatus,
    progressPct: proj.progressPct,
    etaMinutes,
    lastUpdated: new Date().toISOString(),
  }

  // Persist + broadcast.
  const created = await db.busLocation.create({
    data: {
      bus: { connect: { id: bus.id } },
      trip: { connect: { id: activeTrip.id } },
      lat,
      lng,
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

  await broadcast(payload)

  return NextResponse.json({
    ok: true,
    bus: { id: bus.id, name: bus.name, plate: bus.plateNumber },
    trip: { id: activeTrip.id },
    location: created,
    projected: {
      currentCounter: current?.name ?? null,
      nextCounter: next?.name ?? null,
      progressPct: proj.progressPct.toFixed(1),
      distanceFromRouteM: Math.round(proj.distanceFromRouteM),
      snappedToCounter: isAtCounter,
    },
  })
}
