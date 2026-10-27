'use client'

// Interactive seat selection. Layout: rows of 2-2 seats with a center aisle.
// Driver's seat is rendered at the top; the entrance at the bottom.

import { Bus as BusIcon } from 'lucide-react'
import { generateSeatLabels } from '@/lib/types'

interface Props {
  totalSeats: number
  takenSeats: string[]
  selected: string[]
  onToggle: (seat: string) => void
}

export function SeatMap({ totalSeats, takenSeats, selected, onToggle }: Props) {
  const allSeats = generateSeatLabels(totalSeats)
  // Group into rows of 4 (2 + aisle + 2)
  const rows: string[][] = []
  for (let i = 0; i < allSeats.length; i += 4) {
    rows.push(allSeats.slice(i, i + 4))
  }
  const taken = new Set(takenSeats)
  const sel = new Set(selected)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-sm rounded-2xl border-2 border-dashed border-border bg-muted/40 p-4 sm:p-6">
        {/* Driver area */}
        <div className="flex items-center justify-between mb-4 text-muted-foreground text-xs uppercase tracking-wide">
          <span className="flex items-center gap-1.5">
            <BusIcon className="h-3.5 w-3.5" /> Front of bus
          </span>
          <span>Driver</span>
        </div>

        <div className="space-y-3">
          {rows.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center justify-center gap-2">
              {/* Left pair */}
              <Seat seat={row[0]} taken={taken.has(row[0])} selected={sel.has(row[0])} onToggle={onToggle} />
              <Seat seat={row[1]} taken={taken.has(row[1])} selected={sel.has(row[1])} onToggle={onToggle} />
              {/* Aisle */}
              <div className="w-6 text-center text-[10px] text-muted-foreground">
                {String.fromCharCode(65 + rIdx)}
              </div>
              {/* Right pair */}
              {row[2] && <Seat seat={row[2]} taken={taken.has(row[2])} selected={sel.has(row[2])} onToggle={onToggle} />}
              {row[3] && <Seat seat={row[3]} taken={taken.has(row[3])} selected={sel.has(row[3])} onToggle={onToggle} />}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-[10px] text-muted-foreground uppercase tracking-wide">
          ↓ Back entrance
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        <Legend swatch="bg-primary text-primary-foreground" label="Selected" />
        <Legend swatch="bg-muted-foreground/30 text-muted-foreground border border-muted-foreground/40" label="Available" />
        <Legend swatch="bg-destructive/30 text-destructive border border-destructive/50" label="Booked" />
      </div>
    </div>
  )
}

function Seat({
  seat,
  taken,
  selected,
  onToggle,
}: {
  seat?: string
  taken: boolean
  selected: boolean
  onToggle: (s: string) => void
}) {
  if (!seat) return <div className="w-9 h-9 sm:w-10 sm:h-10" />
  const base =
    'relative w-9 h-9 sm:w-10 sm:h-10 rounded-md text-[10px] font-semibold flex items-center justify-center transition-all select-none'
  const styles = taken
    ? 'bg-destructive/30 text-destructive border border-destructive/50 cursor-not-allowed'
    : selected
      ? 'bg-primary text-primary-foreground shadow-md scale-105 cursor-pointer'
      : 'bg-muted-foreground/15 text-foreground hover:bg-muted-foreground/30 border border-border cursor-pointer'
  return (
    <button
      type="button"
      aria-label={`Seat ${seat}${taken ? ' (taken)' : selected ? ' (selected)' : ''}`}
      disabled={taken}
      onClick={() => !taken && onToggle(seat)}
      className={`${base} ${styles}`}
    >
      {seat}
    </button>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${swatch}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}
