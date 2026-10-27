// GET /api/tracking — list latest known location for every active trip.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  // For each trip that is BOARDING / DEPARTED, fetch its latest BusLocation row.
  const activeTrips = await db.trip.findMany({
    where: { status: { in: ['BOARDING', 'DEPARTED', 'ARRIVED'] } },
    include: {
      bus: true,
      route: { include: { counters: { orderBy: { sequence: 'asc' } } } },
      locations: { orderBy: { lastUpdated: 'desc' }, take: 1 },
    },
  })

  const result = activeTrips.map((t) => ({
    id: t.id,
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
    status: t.status,
    bus: t.bus,
    route: t.route,
    location: t.locations[0] ?? null,
  }))

  return NextResponse.json(result)
}
