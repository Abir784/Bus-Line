'use client'

// A self-contained route visualization.
// Renders all counters along a route as dots on an SVG canvas, draws the road between them,
// and shows the bus at its current progress (0–100). Updates animate via CSS transitions.

import { useMemo } from 'react'
import { Bus as BusIcon, MapPin, Flag } from 'lucide-react'
import type { Counter, BusLocation } from '@/lib/types'

interface Props {
  counters: Counter[]
  location: BusLocation | null
  progress?: number // 0-100, overrides location.progressPct if provided
  height?: number
}

export function RouteMap({ counters, location, progress, height = 220 }: Props) {
  const width = 900 // viewBox width; SVG scales to container

  // Compute x positions for each counter (spread evenly with padding).
  const padding = 60
  const usableW = width - padding * 2
  const stepX = counters.length > 1 ? usableW / (counters.length - 1) : 0
  const pts = counters.map((c, i) => ({
    counter: c,
    x: padding + i * stepX,
    y: height / 2,
  }))

  const currentProgress = typeof progress === 'number' ? progress : location?.progressPct ?? 0
  const clamped = Math.max(0, Math.min(100, currentProgress))

  // Bus position: interpolate between two counters based on progress.
  const busPos = useMemo(() => {
    if (counters.length === 0) return { x: padding, y: height / 2 }
    const f = (clamped / 100) * (counters.length - 1)
    const i = Math.floor(f)
    const t = f - i
    const a = pts[i] ?? pts[pts.length - 1]
    const b = pts[Math.min(i + 1, pts.length - 1)]
    return { x: a.x + (b.x - a.x) * t, y: height / 2 }
  }, [clamped, counters.length, pts, height])

  const pathD = pts.length
    ? `M ${pts[0]!.x} ${pts[0]!.y} ${pts
        .slice(1)
        .map((p) => `L ${p.x} ${p.y}`)
        .join(' ')}`
    : ''

  const currentCounterId = location?.currentCounterId ?? null
  const nextCounterId = location?.nextCounterId ?? null

  return (
    <div className="w-full overflow-x-auto scroll-thin">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ minWidth: 600 }}
      >
        {/* Road background (thicker, lighter) */}
        <path
          d={pathD}
          stroke="var(--border)"
          strokeWidth={28}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />
        {/* Road dashes */}
        <path
          d={pathD}
          stroke="var(--muted-foreground)"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="10 14"
          opacity={0.5}
        />
        {/* Progress overlay (from start to bus position) */}
        <path
          d={`M ${pts[0]?.x ?? 0} ${height / 2} L ${busPos.x} ${height / 2}`}
          stroke="var(--primary)"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          opacity={0.85}
        />

        {/* Counters */}
        {pts.map((p, i) => {
          const isCurrent = p.counter.id === currentCounterId
          const isNext = p.counter.id === nextCounterId
          const isStart = i === 0
          const isEnd = i === pts.length - 1
          return (
            <g key={p.counter.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isCurrent ? 12 : 8}
                fill={isCurrent ? 'var(--primary)' : isNext ? 'var(--accent)' : 'var(--card)'}
                stroke={isCurrent ? 'var(--primary)' : 'var(--muted-foreground)'}
                strokeWidth={2}
              />
              {isStart && (
                <g transform={`translate(${p.x - 14}, ${p.y - 32})`}>
                  <Flag className="h-4 w-4 text-primary" />
                </g>
              )}
              {isEnd && (
                <g transform={`translate(${p.x - 2}, ${p.y - 32})`}>
                  <MapPin className="h-4 w-4 text-accent-foreground" />
                </g>
              )}
              <text
                x={p.x}
                y={p.y + 32}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: 11, fontWeight: isCurrent || isNext ? 700 : 400 }}
              >
                {p.counter.name.length > 24
                  ? p.counter.name.slice(0, 22) + '…'
                  : p.counter.name}
              </text>
              <text
                x={p.x}
                y={p.y + 46}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 9 }}
              >
                {p.counter.minutesFromStart > 0
                  ? `${Math.floor(p.counter.minutesFromStart / 60)}h ${p.counter.minutesFromStart % 60}m`
                  : 'Start'}
              </text>
            </g>
          )
        })}

        {/* Bus marker */}
        <g
          transform={`translate(${busPos.x - 14}, ${busPos.y - 14})`}
          style={{ transition: 'transform 1.2s ease-in-out' }}
        >
          <circle
            cx={14}
            cy={14}
            r={18}
            fill="var(--primary)"
            className="bus-marker-pulse"
            style={{ transformOrigin: '14px 14px' }}
          />
          <foreignObject x={2} y={2} width={24} height={24}>
            <BusIcon className="h-5 w-5 text-primary-foreground" />
          </foreignObject>
        </g>
      </svg>
    </div>
  )
}
