// POST /api/admin/buses/[id]/gps-token
// Set or rotate a bus's GPS device token. The owner generates a token here and physically
// configures the GPS device (or driver app) with the same token to authenticate pushes.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function makeToken() {
  return 'gps_' + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 6)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  // Allow owner to supply a custom token or auto-generate one.
  const token = (body as { token?: string })?.token?.trim() || makeToken()

  const bus = await db.bus.update({
    where: { id },
    data: { gpsDeviceToken: token },
    select: { id: true, name: true, plateNumber: true, gpsDeviceToken: true },
  })
  return NextResponse.json(bus)
}
