// GET /api/routes — list all routes (with counters)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const routes = await db.route.findMany({
    include: {
      counters: { orderBy: { sequence: 'asc' } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(routes)
}
