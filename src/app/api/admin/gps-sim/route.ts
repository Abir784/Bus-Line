// POST /api/admin/gps-sim
// Simulates a GPS device pushing positions along a bus's currently-active route.
// Steps the bus from its current position to the next counter, then to the next, etc.,
// calling /api/gps/push for each step.
//
// Body: { busId: string, steps?: number (default 3), delayMs?: number (default 800) }
//
// This is a demo/testing helper. In production, real GPS hardware would push to /api/gps/push
// directly.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { busId, steps = 3, delayMs = 800 } = body as {
    busId?: string
    steps?: number
    delayMs?: number
  }
  if (!busId) return NextResponse.json({ error: 'busId required' }, { status: 400 })

  const bus = await db.bus.findUnique({
    where: { id: busId },
    include: {
      trips: {
        where: { status: { in: ['BOARDING', 'DEPARTED'] } },
        include: { route: { include: { counters: { orderBy: { sequence: 'asc' } } } } },
        orderBy: { departureTime: 'desc' },
        take: 1,
      },
      locations: { orderBy: { lastUpdated: 'desc' }, take: 1 },
    },
  })
  if (!bus) return NextResponse.json({ error: 'Bus not found' }, { status: 404 })
  if (!bus.gpsDeviceToken) {
    return NextResponse.json(
      { error: 'Bus has no GPS device token. Generate one first.' },
      { status: 400 }
    )
  }
  const trip = bus.trips[0]
  if (!trip) {
    return NextResponse.json(
      { error: 'Bus has no active (BOARDING or DEPARTED) trip' },
      { status: 400 }
    )
  }
  const counters = trip.route.counters
  if (counters.length < 2) {
    return NextResponse.json({ error: 'Route has fewer than 2 counters' }, { status: 400 })
  }

  // Find where the bus currently is — use the latest BusLocation if any, else counter[0].
  const prev = bus.locations[0]
  let currentIdx = 0
  if (prev?.currentCounterId) {
    const idx = counters.findIndex((c) => c.id === prev.currentCounterId)
    if (idx >= 0) currentIdx = idx
  }

  const totalSteps = Math.min(steps, (counters.length - 1 - currentIdx) * 2 + 1)
  const pushed: Array<{ lat: number; lng: number; counter: string; progress: number }> = []

  // Internal call to /api/gps/push — we re-use the same logic by calling the URL.
  // (Next.js: relative fetch works since we share the same process.)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  for (let i = 1; i <= totalSteps; i++) {
    // Interpolate between currentIdx and currentIdx+1, in 0.5 steps.
    const f = currentIdx + i * 0.5
    const segIdx = Math.min(Math.floor(f), counters.length - 2)
    const segT = f - segIdx
    const a = counters[segIdx]!
    const b = counters[segIdx + 1]!
    const lat = a.lat + (b.lat - a.lat) * segT
    const lng = a.lng + (b.lng - a.lng) * segT
    const progress = (f / (counters.length - 1)) * 100

    const res = await fetch(`${baseUrl}/api/gps/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: bus.gpsDeviceToken,
        lat,
        lng,
        speed: 50 + Math.random() * 20,
        heading: Math.random() * 360,
      }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: `GPS push failed at step ${i}`, detail: j },
        { status: 500 }
      )
    }
    const j = (await res.json()) as { projected?: { currentCounter?: string; progressPct?: string } }
    pushed.push({
      lat,
      lng,
      counter: j.projected?.currentCounter ?? '?',
      progress: Number(j.projected?.progressPct ?? 0),
    })

    if (i < totalSteps && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  return NextResponse.json({
    ok: true,
    bus: { id: bus.id, name: bus.name, plate: bus.plateNumber },
    trip: { id: trip.id },
    startingCounterIdx: currentIdx,
    startingCounterName: counters[currentIdx]?.name,
    stepsTaken: totalSteps,
    pushed,
  })
}
