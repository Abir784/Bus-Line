// GET /api/admin/notifications
// Lists recent notifications (SMS/email) sent by the system. Optional filters:
//   ?bookingId=...     — only notifications for a booking
//   ?channel=SMS|EMAIL — only one channel
//   ?type=...          — only one type (BOOKING_CONFIRMATION, DEPARTURE_REMINDER, DELAY_ALERT, REFUND_NOTICE)
//   ?limit=...         — default 50, max 200
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bookingId = searchParams.get('bookingId')
  const channel = searchParams.get('channel')
  const type = searchParams.get('type')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)

  const where: Prisma.NotificationWhereInput = {}
  if (bookingId) where.bookingId = bookingId
  if (channel) where.channel = channel
  if (type) where.type = type

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return NextResponse.json(notifications)
}
