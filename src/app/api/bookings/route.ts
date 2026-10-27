// POST /api/bookings — create a new booking (payment-status PENDING).
// Body: { tripId, passengerName, passengerEmail, passengerPhone, seatNumbers: string[], boardingCounterId?, boardingCounterName? }
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { tripId, passengerName, passengerEmail, passengerPhone, seatNumbers, boardingCounterId, boardingCounterName } = body as {
    tripId: string
    passengerName: string
    passengerEmail: string
    passengerPhone: string
    seatNumbers: string[]
    boardingCounterId?: string | null
    boardingCounterName?: string | null
  }

  if (!tripId || !passengerName || !passengerEmail || !passengerPhone || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      bus: true,
      bookings: { where: { status: 'CONFIRMED' } },
    },
  })
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  if (trip.status === 'CANCELLED') return NextResponse.json({ error: 'Trip cancelled' }, { status: 400 })

  // Re-check seat conflicts server-side.
  const takenSeats = trip.bookings.flatMap((b) =>
    b.seatNumbers.split(',').filter(Boolean)
  )
  const conflict = seatNumbers.find((s) => takenSeats.includes(s))
  if (conflict) {
    return NextResponse.json({ error: `Seat ${conflict} is already booked` }, { status: 409 })
  }
  // Validate seats exist on the bus.
  for (const s of seatNumbers) {
    if (!/^[A-L][1-4]$/.test(s)) {
      return NextResponse.json({ error: `Invalid seat label: ${s}` }, { status: 400 })
    }
  }

  const totalAmount = trip.pricePerSeat * seatNumbers.length
  const booking = await db.booking.create({
    data: {
      trip: { connect: { id: tripId } },
      passengerName,
      passengerEmail,
      passengerPhone,
      seatNumbers: seatNumbers.join(','),
      boardingCounterId: boardingCounterId ?? null,
      boardingCounterName: boardingCounterName ?? null,
      totalAmount,
      paymentStatus: 'PENDING',
      status: 'CONFIRMED',
    },
  })

  return NextResponse.json(booking, { status: 201 })
}
