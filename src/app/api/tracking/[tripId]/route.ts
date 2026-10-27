// GET /api/tracking/[tripId] — single trip + counters + latest location
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      bus: true,
      route: { include: { counters: { orderBy: { sequence: 'asc' } } } },
      locations: { orderBy: { lastUpdated: 'desc' }, take: 1 },
      bookings: { where: { status: 'CONFIRMED' } },
    },
  })
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  const { bookings, ...rest } = trip
  return NextResponse.json({ ...rest, location: rest.locations[0] ?? null })
}
