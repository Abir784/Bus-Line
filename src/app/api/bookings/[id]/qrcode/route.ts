// GET /api/bookings/[id]/qrcode
// Returns a PNG image of a QR code encoding the booking's verification payload.
// The conductor scans this at boarding to confirm the passenger.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import QRCode from 'qrcode'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const booking = await db.booking.findUnique({
    where: { id },
    include: { trip: { include: { bus: true, route: true } } },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.paymentStatus !== 'PAID') {
    return NextResponse.json(
      { error: 'QR code is only available for paid bookings' },
      { status: 400 }
    )
  }

  // Encode a compact verification payload — conductor's scanner decodes this and looks up the booking.
  const payload = JSON.stringify({
    type: 'BUSLINE_TICKET',
    bookingId: booking.id,
    shortId: booking.id.slice(-8).toUpperCase(),
    seats: booking.seatNumbers,
    passenger: booking.passengerName,
    phone: booking.passengerPhone,
    route: `${booking.trip?.route?.origin ?? ''}->${booking.trip?.route?.destination ?? ''}`,
    bus: booking.trip?.bus?.name ?? '',
    departure: booking.trip?.departureTime,
    paid: booking.totalAmount,
    ref: booking.paymentRef,
  })

  const pngBuffer = await QRCode.toBuffer(payload, {
    type: 'png',
    margin: 2,
    width: 320,
    color: {
      dark: '#0F7050', // emerald — matches brand
      light: '#FFFFFF',
    },
  })

  return new NextResponse(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
