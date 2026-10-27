// GET /api/trips — list trips with filters: routeId, origin, destination, date, status, search
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const routeId = searchParams.get('routeId')
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const date = searchParams.get('date') // YYYY-MM-DD
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  // SQLite doesn't support `mode: 'insensitive'` — `contains` is already case-insensitive by default.
  const where: Prisma.TripWhereInput = {}
  if (routeId) where.routeId = routeId
  if (status) where.status = status
  if (origin || destination) {
    where.route = {
      ...(origin ? { origin: { contains: origin } } : {}),
      ...(destination ? { destination: { contains: destination } } : {}),
    }
  }
  if (search) {
    where.OR = [
      { bus: { name: { contains: search } } },
      { bus: { plateNumber: { contains: search } } },
      { route: { name: { contains: search } } },
      { route: { origin: { contains: search } } },
      { route: { destination: { contains: search } } },
    ]
  }
  if (date) {
    const start = new Date(`${date}T00:00:00`)
    const end = new Date(`${date}T23:59:59.999`)
    where.departureTime = { gte: start, lte: end }
  }

  const trips = await db.trip.findMany({
    where,
    include: {
      bus: true,
      route: { include: { counters: { orderBy: { sequence: 'asc' } } } },
      bookings: { where: { status: 'CONFIRMED' } },
    },
    orderBy: { departureTime: 'asc' },
  })

  // For each trip, compute taken seats and remaining seat count.
  const tripsWithSeats = trips.map((t) => {
    const takenSeats = t.bookings.flatMap((b) => b.seatNumbers.split(',').filter(Boolean))
    const { bookings, ...rest } = t
    return {
      ...rest,
      takenSeats,
      bookedCount: takenSeats.length,
      remainingSeats: Math.max(0, t.bus.totalSeats - takenSeats.length),
    }
  })

  return NextResponse.json(tripsWithSeats)
}
