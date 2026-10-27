// Outbound notification helpers.
// - SMS: simulated (logs to console + persists Notification row with status=SENT + providerRef).
//   In production this is where you'd call a real SMS gateway (e.g. Twilio, SSL Wireless, REVE SMS Gateway).
// - Email: simulated the same way. In production wire nodemailer with SMTP creds.

import { db } from '@/lib/db'

export interface SendResult {
  ok: boolean
  providerRef?: string
  error?: string
}

function makeRef(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

// Persist a Notification row + simulate the send.
async function recordAndSend(params: {
  bookingId?: string | null
  tripId?: string | null
  channel: 'SMS' | 'EMAIL'
  type: string
  recipient: string
  subject?: string
  body: string
}): Promise<SendResult> {
  const ref = makeRef(params.channel === 'SMS' ? 'SMS' : 'EML')
  try {
    // Simulate gateway latency + 3% failure rate.
    await new Promise((r) => setTimeout(r, 200))
    const ok = Math.random() > 0.03
    const notification = await db.notification.create({
      data: {
        bookingId: params.bookingId ?? null,
        tripId: params.tripId ?? null,
        channel: params.channel,
        type: params.type,
        recipient: params.recipient,
        subject: params.subject ?? null,
        body: params.body,
        status: ok ? 'SENT' : 'FAILED',
        providerRef: ok ? ref : null,
        error: ok ? null : 'Simulated gateway error',
        sentAt: ok ? new Date() : null,
      },
    })
    // Console log so the dev log shows the simulated send.
    console.log(`[notification] ${params.channel} ${notification.status} → ${params.recipient} (${params.type}) ref=${ref}`)
    return ok
      ? { ok: true, providerRef: ref }
      : { ok: false, error: 'Simulated gateway error' }
  } catch (e) {
    console.error('[notification] persist failed:', e)
    return { ok: false, error: String(e) }
  }
}

export async function sendBookingConfirmationSMS(booking: {
  id: string
  tripId: string
  passengerName: string
  passengerPhone: string
  seatNumbers: string
  boardingCounterName?: string | null
  totalAmount: number
  paymentRef?: string | null
  departureTime: string | Date
  origin: string
  destination: string
}): Promise<SendResult> {
  const body = `BusLine: Booking confirmed. ${booking.passengerName}, seats ${booking.seatNumbers}, ${booking.origin}->${booking.destination}, dep ${new Date(booking.departureTime).toLocaleString('en-GB')}. Board at ${booking.boardingCounterName ?? 'origin terminal'}. Paid ৳${booking.totalAmount}. Ref ${booking.paymentRef ?? '-'}.`
  return recordAndSend({
    bookingId: booking.id,
    tripId: booking.tripId,
    channel: 'SMS',
    type: 'BOOKING_CONFIRMATION',
    recipient: booking.passengerPhone,
    body,
  })
}

export async function sendBookingConfirmationEmail(booking: {
  id: string
  tripId: string
  passengerName: string
  passengerEmail: string
  seatNumbers: string
  boardingCounterName?: string | null
  totalAmount: number
  paymentRef?: string | null
  departureTime: string | Date
  arrivalTime: string | Date
  origin: string
  destination: string
  busName: string
  busPlate: string
}): Promise<SendResult> {
  const subject = `BusLine ticket confirmed — ${booking.origin} → ${booking.destination}`
  const body = [
    `Hi ${booking.passengerName},`,
    ``,
    `Your bus ticket is confirmed. Here are the details:`,
    ``,
    `Route:        ${booking.origin} → ${booking.destination}`,
    `Bus:          ${booking.busName} (${booking.busPlate})`,
    `Departure:    ${new Date(booking.departureTime).toLocaleString('en-GB')}`,
    `Arrival:      ${new Date(booking.arrivalTime).toLocaleString('en-GB')}`,
    `Seats:        ${booking.seatNumbers}`,
    `Boarding at:  ${booking.boardingCounterName ?? 'Origin terminal'}`,
    `Total paid:   ৳${booking.totalAmount}`,
    `Payment ref:  ${booking.paymentRef ?? '-'}`,
    `Booking ID:   ${booking.id.slice(-8).toUpperCase()}`,
    ``,
    `Show this email or your booking ID at the boarding counter. Track your bus live at busline.example.`,
    ``,
    `— BusLine`,
  ].join('\n')
  return recordAndSend({
    bookingId: booking.id,
    tripId: booking.tripId,
    channel: 'EMAIL',
    type: 'BOOKING_CONFIRMATION',
    recipient: booking.passengerEmail,
    subject,
    body,
  })
}

export async function sendDepartureReminderSMS(booking: {
  id: string
  tripId: string
  passengerName: string
  passengerPhone: string
  departureTime: string | Date
  boardingCounterName?: string | null
  origin: string
  destination: string
}): Promise<SendResult> {
  const dep = new Date(booking.departureTime)
  const body = `BusLine reminder: ${booking.passengerName}, your bus ${booking.origin}->${booking.destination} departs ${dep.toLocaleString('en-GB')}. Board at ${booking.boardingCounterName ?? 'origin terminal'}. Track live at busline.example.`
  return recordAndSend({
    bookingId: booking.id,
    tripId: booking.tripId,
    channel: 'SMS',
    type: 'DEPARTURE_REMINDER',
    recipient: booking.passengerPhone,
    body,
  })
}

export async function sendDelayAlertSMS(booking: {
  id: string
  tripId: string
  passengerName: string
  passengerPhone: string
  origin: string
  destination: string
  delayMinutes: number
  newEta: string
}): Promise<SendResult> {
  const body = `BusLine alert: Your bus ${booking.origin}->${booking.destination} is delayed by ${booking.delayMinutes} min. New ETA at next stop: ${booking.newEta}. Track live at busline.example.`
  return recordAndSend({
    bookingId: booking.id,
    tripId: booking.tripId,
    channel: 'SMS',
    type: 'DELAY_ALERT',
    recipient: booking.passengerPhone,
    body,
  })
}

export async function sendRefundNoticeSMS(booking: {
  id: string
  tripId: string
  passengerName: string
  passengerPhone: string
  refundAmount: number
  refundRef: string
  reason: string
}): Promise<SendResult> {
  const body = `BusLine: Your booking ${booking.id.slice(-8).toUpperCase()} has been cancelled. Refund ৳${booking.refundAmount} (ref ${booking.refundRef}) will be processed within 3-5 business days. Reason: ${booking.reason}.`
  return recordAndSend({
    bookingId: booking.id,
    tripId: booking.tripId,
    channel: 'SMS',
    type: 'REFUND_NOTICE',
    recipient: booking.passengerPhone,
    body,
  })
}
