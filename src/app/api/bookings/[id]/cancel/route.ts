// POST /api/bookings/[id]/cancel
// Cancels a booking: marks it CANCELLED, sets paymentStatus=REFUNDED if it was PAID,
// generates a refund reference, releases the seats (so they're immediately bookable again),
// and sends a refund-notice SMS to the passenger.
//
// Body: { reason?: string }
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendRefundNoticeSMS } from '@/lib/notifications'

function makeRefundRef() {
  return 'RFD-' + Math.random().toString(36).slice(2, 10).toUpperCase()
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const reason = ((body as { reason?: string })?.reason || 'Cancelled by passenger').trim()

  const booking = await db.booking.findUnique({
    where: { id },
    include: { trip: { include: { route: true } } },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 })
  }

  const wasPaid = booking.paymentStatus === 'PAID'
  const refundRef = wasPaid ? makeRefundRef() : null
  const now = new Date()

  const updated = await db.booking.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
      cancelReason: reason,
      // Refund the full amount if the booking was paid.
      refundAmount: wasPaid ? booking.totalAmount : null,
      refundRef,
      refundedAt: wasPaid ? now : null,
      paymentStatus: wasPaid ? 'REFUNDED' : booking.paymentStatus,
    },
    include: { trip: { include: { route: true, bus: true } } },
  })

  // Send refund notice SMS if the booking was paid.
  let notification: { ok: boolean; providerRef?: string; error?: string } | null = null
  if (wasPaid) {
    notification = await sendRefundNoticeSMS({
      id: booking.id,
      tripId: booking.tripId,
      passengerName: booking.passengerName,
      passengerPhone: booking.passengerPhone,
      refundAmount: booking.totalAmount,
      refundRef: refundRef!,
      reason,
    })
  }

  return NextResponse.json({
    ok: true,
    booking: {
      id: updated.id,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      cancelledAt: updated.cancelledAt,
      cancelReason: updated.cancelReason,
      refundAmount: updated.refundAmount,
      refundRef: updated.refundRef,
      refundedAt: updated.refundedAt,
    },
    seatsReleased: booking.seatNumbers.split(',').filter(Boolean),
    notification,
    message: wasPaid
      ? `Booking cancelled. Refund of ৳${booking.totalAmount} (ref ${refundRef}) will be processed within 3-5 business days.`
      : 'Booking cancelled. No refund applicable (booking was not paid).',
  })
}
