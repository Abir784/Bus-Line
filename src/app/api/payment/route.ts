// POST /api/payment — simulate a payment gateway.
// Body: { bookingId, method: 'CARD' | 'BKASH' | 'NOGOD' | 'CASH', ...gatewayFields }
// On success: marks booking PAID + sends booking-confirmation SMS and email.
// Returns: { success: boolean, paymentRef, paymentStatus, notifications: [...] }
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  sendBookingConfirmationSMS,
  sendBookingConfirmationEmail,
} from '@/lib/notifications'

function makeRef(method: string) {
  const tag = method.padEnd(4, 'X').slice(0, 4).toUpperCase()
  return `PAY-${tag}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { bookingId, method } = body as { bookingId: string; method: string }
  if (!bookingId || !method) {
    return NextResponse.json({ error: 'bookingId and method required' }, { status: 400 })
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { trip: { include: { bus: true, route: true } } },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.paymentStatus === 'PAID') {
    return NextResponse.json({ error: 'Booking already paid' }, { status: 400 })
  }

  // Simulate gateway latency + 5% failure rate.
  await new Promise((r) => setTimeout(r, 700))
  const success = Math.random() > 0.05
  const paymentRef = makeRef(method)

  const updated = await db.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: success ? 'PAID' : 'FAILED',
      paymentMethod: method,
      paymentRef: success ? paymentRef : null,
    },
  })

  // On successful payment, fire confirmation SMS + email.
  let notifications: Array<{ channel: string; recipient: string; status: string }> = []
  if (success && booking.trip) {
    const trip = booking.trip
    const ctx = {
      id: booking.id,
      tripId: booking.tripId,
      passengerName: booking.passengerName,
      passengerPhone: booking.passengerPhone,
      passengerEmail: booking.passengerEmail,
      seatNumbers: booking.seatNumbers,
      boardingCounterName: booking.boardingCounterName,
      totalAmount: booking.totalAmount,
      paymentRef,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      origin: trip.route?.origin ?? 'Origin',
      destination: trip.route?.destination ?? 'Destination',
      busName: trip.bus?.name ?? 'Bus',
      busPlate: trip.bus?.plateNumber ?? '',
    }
    const [smsRes, emailRes] = await Promise.all([
      sendBookingConfirmationSMS(ctx),
      sendBookingConfirmationEmail(ctx),
    ])
    notifications = [
      { channel: 'SMS', recipient: booking.passengerPhone, status: smsRes.ok ? 'SENT' : 'FAILED' },
      { channel: 'EMAIL', recipient: booking.passengerEmail, status: emailRes.ok ? 'SENT' : 'FAILED' },
    ]
  }

  return NextResponse.json({
    success,
    paymentRef: success ? paymentRef : null,
    paymentStatus: updated.paymentStatus,
    notifications,
    message: success
      ? 'Payment successful. Your tickets are confirmed. A confirmation SMS and email have been sent.'
      : 'Payment failed. Please try a different method.',
  })
}
