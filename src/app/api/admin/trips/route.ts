// POST /api/admin/trips — create a new scheduled trip (= a "ticket" listing in this app).
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { busId, routeId, departureTime, arrivalTime, pricePerSeat, status } = body as {
    busId: string
    routeId: string
    departureTime: string
    arrivalTime: string
    pricePerSeat: number
    status?: string
  }

  if (!busId || !routeId || !departureTime || !arrivalTime || !pricePerSeat) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const trip = await db.trip.create({
    data: {
      bus: { connect: { id: busId } },
      route: { connect: { id: routeId } },
      departureTime: new Date(departureTime),
      arrivalTime: new Date(arrivalTime),
      pricePerSeat: Number(pricePerSeat),
      status: status ?? 'SCHEDULED',
    },
    include: { bus: true, route: { include: { counters: { orderBy: { sequence: 'asc' } } } } },
  })
  return NextResponse.json(trip, { status: 201 })
}
