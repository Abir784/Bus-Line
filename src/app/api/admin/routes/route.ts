// POST /api/admin/routes — create a new route (with counters array).
// Body: { name, origin, destination, distanceKm, estimatedMinutes, counters: [{ name, address, lat, lng, sequence, minutesFromStart }] }
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { name, origin, destination, distanceKm, estimatedMinutes, counters } = body as {
    name: string
    origin: string
    destination: string
    distanceKm: number
    estimatedMinutes: number
    counters: { name: string; address?: string; lat: number; lng: number; sequence: number; minutesFromStart: number }[]
  }
  if (!name || !origin || !destination || !Array.isArray(counters) || counters.length < 2) {
    return NextResponse.json({ error: 'Missing required fields or counters' }, { status: 400 })
  }

  const route = await db.route.create({
    data: {
      name,
      origin,
      destination,
      distanceKm,
      estimatedMinutes,
      counters: {
        create: counters.map((c) => ({
          name: c.name,
          address: c.address ?? null,
          lat: c.lat,
          lng: c.lng,
          sequence: c.sequence,
          minutesFromStart: c.minutesFromStart,
        })),
      },
    },
    include: { counters: { orderBy: { sequence: 'asc' } } },
  })
  return NextResponse.json(route, { status: 201 })
}
