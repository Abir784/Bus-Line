// POST /api/payment — simulate a payment gateway.
// Body: { bookingId, method: 'CARD' | 'BKASH' | 'NOGOD' | 'CASH', ...gatewayFields }
// Returns: { success: boolean, paymentRef, paymentStatus }
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

  const booking = await db.booking.findUnique({ where: { id: bookingId } })
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

  return NextResponse.json({
    success,
    paymentRef: success ? paymentRef : null,
    paymentStatus: updated.paymentStatus,
    message: success
      ? 'Payment successful. Your tickets are confirmed.'
      : 'Payment failed. Please try a different method.',
  })
}
