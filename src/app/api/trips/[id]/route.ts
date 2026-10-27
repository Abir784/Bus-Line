// GET /api/trips/[id] — single trip with route, counters, bus, taken seats
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const trip = await db.trip.findUnique({
    where: { id },
    include: {
      bus: true,
      route: { include: { counters: { orderBy: { sequence: 'asc' } } } },
      bookings: { where: { status: 'CONFIRMED' } },
    },
  })
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  const takenSeats = trip.bookings.flatMap((b) =>
    b.seatNumbers.split(',').filter(Boolean)
  )
  const { bookings, ...rest } = trip
  return NextResponse.json({
    ...rest,
    takenSeats,
    bookedCount: takenSeats.length,
    remainingSeats: Math.max(0, trip.bus.totalSeats - takenSeats.length),
  })
}
