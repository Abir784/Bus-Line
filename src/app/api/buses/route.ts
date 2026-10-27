// GET /api/buses — list all buses
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const buses = await db.bus.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(buses)
}
