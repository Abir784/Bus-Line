// POST /api/admin/buses — create a new bus.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { name, plateNumber, totalSeats, type, driverName, driverPhone } = body as {
    name: string
    plateNumber: string
    totalSeats: number
    type: string
    driverName?: string
    driverPhone?: string
  }
  if (!name || !plateNumber || !totalSeats || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const bus = await db.bus.create({
      data: {
        name,
        plateNumber,
        totalSeats: Number(totalSeats),
        type,
        driverName: driverName ?? null,
        driverPhone: driverPhone ?? null,
      },
    })
    return NextResponse.json(bus, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Unique')) {
      return NextResponse.json({ error: 'Plate number already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
