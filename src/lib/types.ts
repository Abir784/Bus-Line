// Shared types & helpers for the bus ticketing app.

export type TripStatus = 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type BusLocationStatus = 'IDLE' | 'MOVING' | 'AT_COUNTER' | 'ARRIVED'

export interface Counter {
  id: string
  name: string
  address?: string | null
  lat: number
  lng: number
  sequence: number
  minutesFromStart: number
}

export interface Route {
  id: string
  name: string
  origin: string
  destination: string
  distanceKm: number
  estimatedMinutes: number
  counters?: Counter[]
}

export interface Bus {
  id: string
  name: string
  plateNumber: string
  totalSeats: number
  type: string
  driverName?: string | null
  driverPhone?: string | null
}

export interface Trip {
  id: string
  busId: string
  routeId: string
  departureTime: string
  arrivalTime: string
  pricePerSeat: number
  status: TripStatus
  bus?: Bus
  route?: Route
  takenSeats?: string[]
}

export interface Booking {
  id: string
  tripId: string
  passengerName: string
  passengerEmail: string
  passengerPhone: string
  seatNumbers: string
  boardingCounterName?: string | null
  totalAmount: number
  paymentStatus: PaymentStatus
  paymentMethod?: string | null
  paymentRef?: string | null
  status: string
  createdAt: string
  trip?: Trip
}

export interface BusLocation {
  id: string
  busId: string
  tripId?: string | null
  lat: number
  lng: number
  currentCounterId?: string | null
  currentCounterName?: string | null
  nextCounterId?: string | null
  nextCounterName?: string | null
  speed: number
  heading: number
  status: BusLocationStatus
  progressPct: number
  etaMinutes: number
  lastUpdated: string
}

export interface TripWithTracking extends Trip {
  location?: BusLocation | null
}

export const STATUS_LABELS: Record<TripStatus, string> = {
  SCHEDULED: 'Scheduled',
  BOARDING: 'Boarding',
  DEPARTED: 'Departed',
  ARRIVED: 'Arrived',
  CANCELLED: 'Cancelled',
}

export const STATUS_COLORS: Record<TripStatus, string> = {
  SCHEDULED: 'bg-secondary text-secondary-foreground',
  BOARDING: 'bg-accent text-accent-foreground',
  DEPARTED: 'bg-primary text-primary-foreground',
  ARRIVED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-destructive text-white',
}

export function formatBDT(amount: number): string {
  return '৳' + amount.toLocaleString('en-BD', { maximumFractionDigits: 0 })
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)}, ${formatTime(date)}`
}

export function minutesToDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// Generate seat labels in A1..A9, B1..B9 style. Layout: 9 rows × 4 seats with center aisle.
export function generateSeatLabels(total: number): string[] {
  const seats: string[] = []
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  let i = 0
  outer: for (const r of rows) {
    for (let n = 1; n <= 4; n++) {
      seats.push(`${r}${n}`)
      i++
      if (i >= total) break outer
    }
  }
  return seats
}

export function classNames(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(' ')
}
