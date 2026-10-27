// GET /api/admin/stats — dashboard numbers.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [trips, buses, routes, bookings, paidBookings, activeTrips] = await Promise.all([
    db.trip.count(),
    db.bus.count(),
    db.route.count(),
    db.booking.count(),
    db.booking.findMany({
      where: { paymentStatus: 'PAID' },
      select: { totalAmount: true, seatNumbers: true },
    }),
    db.trip.findMany({
      where: { status: { in: ['BOARDING', 'DEPARTED'] } },
      include: { bus: true, route: true },
    }),
  ])

  const revenue = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0)
  const ticketsSold = paidBookings.reduce((sum, b) => sum + b.seatNumbers.split(',').filter(Boolean).length, 0)

  // Revenue by route (top 5)
  const routeRevenue = await db.booking.groupBy({
    by: ['tripId'],
    where: { paymentStatus: 'PAID' },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 5,
  })
  const tripIds = routeRevenue.map((r) => r.tripId)
  const tripsInfo = await db.trip.findMany({
    where: { id: { in: tripIds } },
    include: { route: true },
  })
  const revenueByRoute = routeRevenue.map((r) => {
    const t = tripsInfo.find((x) => x.id === r.tripId)
    return {
      routeName: t?.route?.name ?? 'Unknown',
      revenue: r._sum.totalAmount ?? 0,
    }
  })

  return NextResponse.json({
    counts: { trips, buses, routes, bookings },
    revenue,
    ticketsSold,
    activeTrips: activeTrips.map((t) => ({
      id: t.id,
      status: t.status,
      departureTime: t.departureTime,
      busName: t.bus.name,
      routeName: t.route.name,
      origin: t.route.origin,
      destination: t.route.destination,
    })),
    revenueByRoute,
  })
}
