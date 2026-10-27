// GET /api/bookings/lookup?email=...&phone=... — list bookings for a passenger
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')?.trim()
  const phone = searchParams.get('phone')?.trim()
  if (!email && !phone) {
    return NextResponse.json({ error: 'Provide email or phone' }, { status: 400 })
  }
  // SQLite doesn't support `mode: 'insensitive'` — use case-insensitive LIKE for email.
  const bookings = await db.booking.findMany({
    where: {
      OR: [
        ...(email ? [{ passengerEmail: { contains: email } }] : []),
        ...(phone ? [{ passengerPhone: { equals: phone } }] : []),
      ],
    },
    include: {
      trip: {
        include: {
          bus: true,
          route: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(bookings)
}
