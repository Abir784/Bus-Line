'use client'

// BusLine — single-page app with view switching.
// Views: home / search / trip-detail / checkout / confirmation / track / my-bookings / admin

import * as React from 'react'
import { io } from 'socket.io-client'
import { useToast } from '@/hooks/use-toast'
import {
  Bus as BusIcon,
  Search,
  MapPin,
  Clock,
  Calendar,
  Ticket,
  LayoutDashboard,
  Settings2,
  Radio,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Sun,
  Moon,
  User,
  Mail,
  Phone,
  CreditCard,
  Wallet,
  Banknote,
  Plus,
  ChevronRight,
  Activity,
  Users,
  DollarSign,
  Route as RouteIcon,
  Gauge,
  Navigation,
  Flag,
  TrendingUp,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

import { RouteMap } from '@/components/route-map'
import { SeatMap } from '@/components/seat-map'
import {
  classNames,
  formatBDT,
  formatDate,
  formatDateTime,
  formatTime,
  generateSeatLabels,
  minutesToDuration,
  STATUS_COLORS,
  STATUS_LABELS,
  type Booking,
  type Bus,
  type BusLocation,
  type Counter,
  type Route,
  type Trip,
  type TripWithTracking,
} from '@/lib/types'

// ============================================================================
// Top-level app
// ============================================================================

type View =
  | { name: 'home' }
  | { name: 'search'; origin?: string; destination?: string; date?: string }
  | { name: 'trip'; tripId: string }
  | { name: 'checkout'; bookingId: string }
  | { name: 'confirmation'; bookingId: string }
  | { name: 'track'; tripId?: string }
  | { name: 'my-bookings' }
  | { name: 'admin' }

export default function Home() {
  const [view, setView] = React.useState<View>({ name: 'home' })
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [dark, setDark] = React.useState(false)

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const go = (v: View) => {
    setView(v)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header
        view={view}
        go={go}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        dark={dark}
        setDark={setDark}
      />
      <main className="flex-1">
        {view.name === 'home' && <HomeView go={go} />}
        {view.name === 'search' && (
          <SearchView origin={view.origin} destination={view.destination} date={view.date} go={go} />
        )}
        {view.name === 'trip' && <TripDetailView tripId={view.tripId} go={go} />}
        {view.name === 'checkout' && <CheckoutView bookingId={view.bookingId} go={go} />}
        {view.name === 'confirmation' && <ConfirmationView bookingId={view.bookingId} go={go} />}
        {view.name === 'track' && <TrackView tripId={view.tripId} go={go} />}
        {view.name === 'my-bookings' && <MyBookingsView go={go} />}
        {view.name === 'admin' && <AdminView go={go} />}
      </main>
      <Footer />
    </div>
  )
}

// ============================================================================
// Header & Footer
// ============================================================================

function Header({
  view,
  go,
  isAdmin,
  setIsAdmin,
  dark,
  setDark,
}: {
  view: View
  go: (v: View) => void
  isAdmin: boolean
  setIsAdmin: (v: boolean) => void
  dark: boolean
  setDark: (v: boolean) => void
}) {
  const isActive = (n: View['name']) => view.name === n
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <button onClick={() => go({ name: 'home' })} className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BusIcon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-base font-bold tracking-tight leading-none">BusLine</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Live bus ticketing</div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            <NavBtn active={isActive('home')} onClick={() => go({ name: 'home' })} icon={<Search className="h-4 w-4" />}>
              Find tickets
            </NavBtn>
            <NavBtn active={isActive('track')} onClick={() => go({ name: 'track' })} icon={<Radio className="h-4 w-4" />}>
              Track bus
            </NavBtn>
            <NavBtn active={isActive('my-bookings')} onClick={() => go({ name: 'my-bookings' })} icon={<Ticket className="h-4 w-4" />}>
              My bookings
            </NavBtn>
            {isAdmin && (
              <NavBtn active={isActive('admin')} onClick={() => go({ name: 'admin' })} icon={<LayoutDashboard className="h-4 w-4" />}>
                Admin
              </NavBtn>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant={isAdmin ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsAdmin(!isAdmin)}
              className="hidden sm:inline-flex"
            >
              <Settings2 className="h-4 w-4 mr-1" />
              {isAdmin ? 'Admin mode' : 'Owner login'}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto scroll-thin">
          <NavBtn active={isActive('home')} onClick={() => go({ name: 'home' })} icon={<Search className="h-4 w-4" />}>
            Find
          </NavBtn>
          <NavBtn active={isActive('track')} onClick={() => go({ name: 'track' })} icon={<Radio className="h-4 w-4" />}>
            Track
          </NavBtn>
          <NavBtn active={isActive('my-bookings')} onClick={() => go({ name: 'my-bookings' })} icon={<Ticket className="h-4 w-4" />}>
            Bookings
          </NavBtn>
          {isAdmin && (
            <NavBtn active={isActive('admin')} onClick={() => go({ name: 'admin' })} icon={<LayoutDashboard className="h-4 w-4" />}>
              Admin
            </NavBtn>
          )}
        </nav>
      </div>
    </header>
  )
}

function NavBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BusIcon className="h-4 w-4" />
              </div>
              <span className="font-bold">BusLine</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Online bus ticketing with live, counter-by-counter tracking. Book your seat, then watch your bus move in real time.
            </p>
          </div>
          <div className="text-sm space-y-1.5">
            <div className="font-semibold mb-2">Product</div>
            <div className="text-muted-foreground">Find tickets</div>
            <div className="text-muted-foreground">Live tracking</div>
            <div className="text-muted-foreground">My bookings</div>
          </div>
          <div className="text-sm space-y-1.5">
            <div className="font-semibold mb-2">For operators</div>
            <div className="text-muted-foreground">Admin dashboard</div>
            <div className="text-muted-foreground">Fleet management</div>
            <div className="text-muted-foreground">Route builder</div>
          </div>
          <div className="text-sm space-y-1.5">
            <div className="font-semibold mb-2">Support</div>
            <div className="text-muted-foreground">Help center</div>
            <div className="text-muted-foreground">Refund policy</div>
            <div className="text-muted-foreground">Terms of service</div>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} BusLine. Demo project. All fares in BDT (৳).</span>
          <span>Simulated payment gateway — no real charges.</span>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// Home view
// ============================================================================

function HomeView({ go }: { go: (v: View) => void }) {
  const [origin, setOrigin] = React.useState('')
  const [destination, setDestination] = React.useState('')
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [featured, setFeatured] = React.useState<Trip[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTrips, setActiveTrips] = React.useState<TripWithTracking[]>([])

  React.useEffect(() => {
    let alive = true
    Promise.all([
      fetch('/api/trips').then((r) => r.json()),
      fetch('/api/tracking').then((r) => r.json()),
    ])
      .then(([trips, tracking]) => {
        if (!alive) return
        setFeatured((trips as Trip[]).slice(0, 6))
        setActiveTrips((tracking as TripWithTracking[]).filter((t) => t.location).slice(0, 3))
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-3">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live tracking on every trip
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Book your bus seat.{' '}
              <span className="text-primary">Track it live</span> all the way to your destination.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
              BusLine is a complete ticketing platform. Pick a route, choose your seats, pay online, and watch the bus move counter by counter on the live map — so you always know exactly where it is.
            </p>
          </div>

          {/* Search box */}
          <Card className="mt-8 max-w-4xl shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="origin" className="text-xs text-muted-foreground">From</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="origin"
                      placeholder="Dhaka"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="destination" className="text-xs text-muted-foreground">To</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="destination"
                      placeholder="Chittagong"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs text-muted-foreground">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    size="lg"
                    className="w-full md:w-auto"
                    onClick={() => go({ name: 'search', origin, destination, date })}
                  >
                    <Search className="h-4 w-4 mr-1" /> Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Live trips ticker */}
      {activeTrips.length > 0 && (
        <section className="border-b bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold">Buses on the road right now</span>
            </div>
            <div className="flex gap-3 overflow-x-auto scroll-thin pb-1">
              {activeTrips.map((t) => (
                <button
                  key={t.id}
                  onClick={() => go({ name: 'track', tripId: t.id })}
                  className="flex-shrink-0 rounded-lg border bg-card p-3 text-left hover:shadow-md transition-shadow min-w-[260px]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]}>
                      {STATUS_LABELS[t.status as keyof typeof STATUS_LABELS]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{t.bus?.name}</span>
                  </div>
                  <div className="font-semibold text-sm">
                    {t.route?.origin} <ArrowRight className="h-3 w-3 inline" /> {t.route?.destination}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {t.location?.currentCounterName ?? 'Departed'} → {t.location?.nextCounterName ?? 'Final stop'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured trips */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Available trips</h2>
            <p className="text-muted-foreground text-sm">Browse upcoming departures across all routes.</p>
          </div>
          <Button variant="outline" onClick={() => go({ name: 'search' })}>
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="h-44 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <TripCard key={t.id} trip={t} onBook={() => go({ name: 'trip', tripId: t.id })} onTrack={() => go({ name: 'track', tripId: t.id })} />
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Search className="h-5 w-5" />}
              title="Find & book in seconds"
              text="Search by route and date, see live availability, pick your seats, and pay with card, bKash, Nagad, or cash at counter."
            />
            <FeatureCard
              icon={<Radio className="h-5 w-5" />}
              title="Real-time bus tracking"
              text="Watch your bus move along the route. We show the current counter, next stop, ETA, and overall progress — updated live."
            />
            <FeatureCard
              icon={<LayoutDashboard className="h-5 w-5" />}
              title="Full operator dashboard"
              text="Owners can add buses, build routes with counters, schedule trips, set prices, and push live location updates to passengers."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
          {icon}
        </div>
        <h3 className="font-semibold mb-1.5">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
      </CardContent>
    </Card>
  )
}

function TripCard({
  trip,
  onBook,
  onTrack,
}: {
  trip: Trip
  onBook: () => void
  onTrack: () => void
}) {
  const status = trip.status as keyof typeof STATUS_LABELS
  const remaining = (trip as TripWithTracking).remainingSeats ?? 0
  const taken = (trip as TripWithTracking).bookedCount ?? 0
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
          <span className="text-xs text-muted-foreground">{trip.bus?.type}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div>
            <div className="font-semibold text-base">{trip.route?.origin}</div>
            <div className="text-xs text-muted-foreground">{formatTime(trip.departureTime)}</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
          <div>
            <div className="font-semibold text-base">{trip.route?.destination}</div>
            <div className="text-xs text-muted-foreground">{formatTime(trip.arrivalTime)}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-3">{formatDate(trip.departureTime)}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
          <BusIcon className="h-3.5 w-3.5" /> {trip.bus?.name}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-4">
          <Users className="h-3.5 w-3.5" /> {remaining} seats left · {taken} booked
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-muted-foreground">From</div>
            <div className="text-lg font-bold text-primary">{formatBDT(trip.pricePerSeat)}</div>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={onTrack}>
              <Radio className="h-3.5 w-3.5" /> Track
            </Button>
            <Button size="sm" onClick={onBook}>
              Book <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Search view
// ============================================================================

function SearchView({
  origin,
  destination,
  date,
  go,
}: {
  origin?: string
  destination?: string
  date?: string
  go: (v: View) => void
}) {
  const [originState, setOriginState] = React.useState(origin ?? '')
  const [destinationState, setDestinationState] = React.useState(destination ?? '')
  const [dateState, setDateState] = React.useState(date ?? new Date().toISOString().slice(0, 10))
  const [trips, setTrips] = React.useState<Trip[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sort, setSort] = React.useState<'time' | 'price' | 'remaining'>('time')

  const runSearch = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (originState) params.set('origin', originState)
    if (destinationState) params.set('destination', destinationState)
    if (dateState) params.set('date', dateState)
    fetch(`/api/trips?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setTrips(data as Trip[]))
      .finally(() => setLoading(false))
  }, [originState, destinationState, dateState])

  React.useEffect(() => {
    runSearch()
  }, [runSearch])

  const sorted = React.useMemo(() => {
    const copy = [...trips]
    if (sort === 'time') copy.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
    if (sort === 'price') copy.sort((a, b) => a.pricePerSeat - b.pricePerSeat)
    if (sort === 'remaining')
      copy.sort((a, b) => ((b as TripWithTracking).remainingSeats ?? 0) - ((a as TripWithTracking).remainingSeats ?? 0))
    return copy
  }, [trips, sort])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" size="sm" onClick={() => go({ name: 'home' })} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
      </Button>

      <Card className="mb-6">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input placeholder="Dhaka" value={originState} onChange={(e) => setOriginState(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input placeholder="Chittagong" value={destinationState} onChange={(e) => setDestinationState(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" value={dateState} onChange={(e) => setDateState(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={runSearch} className="w-full md:w-auto">
                <Search className="h-4 w-4 mr-1" /> Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {sorted.length} trip{sorted.length === 1 ? '' : 's'} found
        </h1>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Sort by</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">Departure time</SelectItem>
              <SelectItem value="price">Price (low → high)</SelectItem>
              <SelectItem value="remaining">Seats available</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No trips match your search. Try a different date or route.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((t) => (
            <TripRow key={t.id} trip={t} onBook={() => go({ name: 'trip', tripId: t.id })} onTrack={() => go({ name: 'track', tripId: t.id })} />
          ))}
        </div>
      )}
    </div>
  )
}

function TripRow({
  trip,
  onBook,
  onTrack,
}: {
  trip: Trip
  onBook: () => void
  onTrack: () => void
}) {
  const status = trip.status as keyof typeof STATUS_LABELS
  const remaining = (trip as TripWithTracking).remainingSeats ?? 0
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="text-center min-w-[70px]">
            <div className="text-lg font-bold">{formatTime(trip.departureTime)}</div>
            <div className="text-[10px] text-muted-foreground uppercase">{trip.route?.origin}</div>
          </div>
          <div className="flex-1 hidden sm:flex flex-col items-center min-w-0">
            <div className="text-xs text-muted-foreground mb-1">
              {minutesToDuration(trip.route?.estimatedMinutes ?? 0)}
            </div>
            <div className="w-full flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <div className="h-0.5 flex-1 bg-border" />
              <BusIcon className="h-3 w-3 text-muted-foreground" />
              <div className="h-0.5 flex-1 bg-border" />
              <div className="h-2 w-2 rounded-full bg-accent" />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {trip.route?.distanceKm} km
            </div>
          </div>
          <div className="text-center min-w-[70px]">
            <div className="text-lg font-bold">{formatTime(trip.arrivalTime)}</div>
            <div className="text-[10px] text-muted-foreground uppercase">{trip.route?.destination}</div>
          </div>
        </div>

        <Separator orientation="vertical" className="hidden sm:block h-16" />

        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-muted-foreground">{trip.bus?.name}</div>
            <div className="text-xs text-muted-foreground">{trip.bus?.type}</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
              <span className="text-xs text-muted-foreground">{remaining} seats</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">From</div>
            <div className="text-xl font-bold text-primary">{formatBDT(trip.pricePerSeat)}</div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Button size="sm" onClick={onBook}>
              Book <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
            <Button size="sm" variant="outline" onClick={onTrack}>
              <Radio className="h-3.5 w-3.5" /> Track
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Trip detail + seat selection
// ============================================================================

function TripDetailView({ tripId, go }: { tripId: string; go: (v: View) => void }) {
  const [trip, setTrip] = React.useState<TripWithTracking | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<string[]>([])
  const [boarding, setBoarding] = React.useState<string>('')
  const { toast } = useToast()

  const loadTrip = React.useCallback(() => {
    fetch(`/api/trips/${tripId}`)
      .then((r) => r.json())
      .then((data) => {
        setTrip(data)
        setBoarding(data?.route?.counters?.[0]?.id ?? '')
      })
      .finally(() => setLoading(false))
  }, [tripId])

  React.useEffect(() => {
    loadTrip()
  }, [loadTrip])

  const toggleSeat = (s: string) => {
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const handleProceed = async () => {
    if (!trip) return
    if (selected.length === 0) {
      toast({ title: 'Select at least one seat', variant: 'destructive' })
      return
    }
    // We need passenger details before creating booking — defer to checkout view.
    // Stash selection in sessionStorage and route to a passenger-form step inside checkout.
    const boardingCounter = trip.route?.counters?.find((c) => c.id === boarding)
    const sel = {
      tripId,
      seatNumbers: selected,
      boardingCounterId: boardingCounter?.id ?? null,
      boardingCounterName: boardingCounter?.name ?? null,
    }
    sessionStorage.setItem('pending-booking', JSON.stringify(sel))
    // We don't have a bookingId yet — pass a sentinel and let CheckoutView handle it.
    go({ name: 'checkout', bookingId: 'pending' })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Card className="h-96 animate-pulse bg-muted/40" />
      </div>
    )
  }
  if (!trip) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Trip not found.</p>
        <Button variant="outline" onClick={() => go({ name: 'search' })} className="mt-4">
          Back to search
        </Button>
      </div>
    )
  }

  const seats = trip.takenSeats ?? []
  const total = selected.length * trip.pricePerSeat

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" size="sm" onClick={() => go({ name: 'search' })} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to results
      </Button>

      {/* Trip summary */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={STATUS_COLORS[trip.status as keyof typeof STATUS_COLORS]}>
                  {STATUS_LABELS[trip.status as keyof typeof STATUS_LABELS]}
                </Badge>
                <span className="text-xs text-muted-foreground">{trip.bus?.type}</span>
              </div>
              <div className="flex items-center gap-2 text-xl font-bold">
                {trip.route?.origin} <ArrowRight className="h-5 w-5 text-muted-foreground" /> {trip.route?.destination}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {trip.route?.name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">From</div>
              <div className="text-2xl font-bold text-primary">{formatBDT(trip.pricePerSeat)}</div>
              <div className="text-xs text-muted-foreground">per seat</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Stat label="Departure" value={formatTime(trip.departureTime)} sub={formatDate(trip.departureTime)} />
            <Stat label="Arrival" value={formatTime(trip.arrivalTime)} sub={formatDate(trip.arrivalTime)} />
            <Stat label="Bus" value={trip.bus?.name ?? '-'} sub={trip.bus?.plateNumber} />
            <Stat label="Duration" value={minutesToDuration(trip.route?.estimatedMinutes ?? 0)} sub={`${trip.route?.distanceKm} km`} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Seat selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" /> Select your seats
            </CardTitle>
            <CardDescription>
              {seats.length} of {trip.bus?.totalSeats} seats booked. Pick one or more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeatMap
              totalSeats={trip.bus?.totalSeats ?? 36}
              takenSeats={seats}
              selected={selected}
              onToggle={toggleSeat}
            />
          </CardContent>
        </Card>

        {/* Booking summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Boarding point</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={boarding} onValueChange={setBoarding}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a counter" />
                </SelectTrigger>
                <SelectContent>
                  {trip.route?.counters?.map((c: Counter) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex flex-col">
                        <span>{c.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(new Date(new Date(trip.departureTime).getTime() + c.minutesFromStart * 60000))}
                          {c.address ? ` · ${c.address}` : ''}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selected seats</span>
                <span className="font-medium">
                  {selected.length === 0 ? 'None yet' : selected.join(', ')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fare per seat</span>
                <span className="font-medium">{formatBDT(trip.pricePerSeat)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">{formatBDT(total)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleProceed} disabled={selected.length === 0}>
                Proceed to checkout <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                You'll enter passenger details and pay on the next step.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</div>
      <div className="font-semibold text-sm">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

// ============================================================================
// Checkout (passenger form + payment)
// ============================================================================

function CheckoutView({ bookingId, go }: { bookingId: string; go: (v: View) => void }) {
  const { toast } = useToast()
  const pending = React.useMemo(() => {
    try {
      const raw = sessionStorage.getItem('pending-booking')
      return raw ? (JSON.parse(raw) as { tripId: string; seatNumbers: string[]; boardingCounterId: string | null; boardingCounterName: string | null }) : null
    } catch {
      return null
    }
  }, [])

  const [trip, setTrip] = React.useState<TripWithTracking | null>(null)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [method, setMethod] = React.useState<'CARD' | 'BKASH' | 'NOGOD' | 'CASH'>('CARD')
  const [cardNum, setCardNum] = React.useState('')
  const [cardExp, setCardExp] = React.useState('')
  const [cardCvc, setCardCvc] = React.useState('')
  const [mobileNum, setMobileNum] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [paying, setPaying] = React.useState(false)

  React.useEffect(() => {
    if (!pending) return
    fetch(`/api/trips/${pending.tripId}`)
      .then((r) => r.json())
      .then((d) => setTrip(d))
  }, [pending])

  if (!pending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Your booking session has expired.</p>
        <Button variant="outline" className="mt-4" onClick={() => go({ name: 'home' })}>
          Back to home
        </Button>
      </div>
    )
  }

  const total = (trip?.pricePerSeat ?? 0) * pending.seatNumbers.length

  const handlePay = async () => {
    if (!name || !email || !phone) {
      toast({ title: 'Please fill in passenger details', variant: 'destructive' })
      return
    }
    if (method === 'CARD' && (!cardNum || !cardExp || !cardCvc)) {
      toast({ title: 'Please fill in card details', variant: 'destructive' })
      return
    }
    if ((method === 'BKASH' || method === 'NOGOD') && !mobileNum) {
      toast({ title: 'Please enter your mobile number', variant: 'destructive' })
      return
    }

    setCreating(true)
    // Create booking
    const createRes = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: pending.tripId,
        passengerName: name,
        passengerEmail: email,
        passengerPhone: phone,
        seatNumbers: pending.seatNumbers,
        boardingCounterId: pending.boardingCounterId,
        boardingCounterName: pending.boardingCounterName,
      }),
    })
    const booking = await createRes.json()
    setCreating(false)
    if (!createRes.ok) {
      toast({ title: 'Booking failed', description: booking.error ?? 'Unknown error', variant: 'destructive' })
      return
    }

    // Save the freshly-created booking so the confirmation view can render immediately,
    // even before the lookup endpoint returns.
    try {
      sessionStorage.setItem(
        'last-booking',
        JSON.stringify({
          ...booking,
          trip: trip
            ? {
                ...trip,
                route: trip.route,
                bus: trip.bus,
              }
            : undefined,
        })
      )
    } catch {
      // ignore quota errors
    }

    setPaying(true)
    const payRes = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id, method }),
    })
    const pay = await payRes.json()
    setPaying(false)

    if (pay.success) {
      sessionStorage.removeItem('pending-booking')
      toast({ title: 'Payment successful', description: 'Your tickets are confirmed.' })
      go({ name: 'confirmation', bookingId: booking.id })
    } else {
      toast({ title: 'Payment failed', description: 'Please try again or use a different method.', variant: 'destructive' })
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" size="sm" onClick={() => go({ name: 'trip', tripId: pending.tripId })} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to seat selection
      </Button>

      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Passenger details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Passenger details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" />
              </div>
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Payment method
              </CardTitle>
              <CardDescription>Simulated gateway — no real charges.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <PayBtn active={method === 'CARD'} onClick={() => setMethod('CARD')} icon={<CreditCard className="h-4 w-4" />} label="Card" />
                <PayBtn active={method === 'BKASH'} onClick={() => setMethod('BKASH')} icon={<Wallet className="h-4 w-4" />} label="bKash" />
                <PayBtn active={method === 'NOGOD'} onClick={() => setMethod('NOGOD')} icon={<Wallet className="h-4 w-4" />} label="Nagad" />
                <PayBtn active={method === 'CASH'} onClick={() => setMethod('CASH')} icon={<Banknote className="h-4 w-4" />} label="Cash" />
              </div>

              {method === 'CARD' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Card number</Label>
                    <Input
                      value={cardNum}
                      onChange={(e) => setCardNum(e.target.value.replace(/[^\d ]/g, '').slice(0, 19))}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expiry (MM/YY)</Label>
                    <Input value={cardExp} onChange={(e) => setCardExp(e.target.value.slice(0, 5))} placeholder="12/27" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CVC</Label>
                    <Input value={cardCvc} onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" inputMode="numeric" />
                  </div>
                </div>
              )}
              {(method === 'BKASH' || method === 'NOGOD') && (
                <div className="space-y-1.5">
                  <Label>{method === 'BKASH' ? 'bKash' : 'Nagad'} account mobile number</Label>
                  <Input
                    value={mobileNum}
                    onChange={(e) => setMobileNum(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    inputMode="numeric"
                  />
                  <p className="text-xs text-muted-foreground">
                    A confirmation PIN will be sent to this number (simulated).
                  </p>
                </div>
              )}
              {method === 'CASH' && (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <p className="font-medium mb-1">Pay at counter</p>
                  <p className="text-muted-foreground">
                    Your booking will be held for 2 hours. Please visit the boarding counter and pay before departure to confirm your seats.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trip && (
                <>
                  <div className="text-sm">
                    <div className="font-medium">{trip.route?.origin} → {trip.route?.destination}</div>
                    <div className="text-muted-foreground text-xs">{formatDateTime(trip.departureTime)}</div>
                    <div className="text-muted-foreground text-xs">{trip.bus?.name}</div>
                  </div>
                  <Separator />
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Seats</span>
                      <span className="font-medium">{pending.seatNumbers.join(', ')}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Boarding</span>
                      <span className="font-medium text-right text-xs">{pending.boardingCounterName ?? '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fare × {pending.seatNumbers.length}</span>
                      <span className="font-medium">{formatBDT(trip.pricePerSeat)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatBDT(total)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePay}
                    disabled={creating || paying}
                  >
                    {creating || paying ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing payment…</>
                    ) : (
                      <>Pay {formatBDT(total)}</>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    By proceeding, you agree to our terms. Payments are simulated.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PayBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-3 transition-all',
        active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-muted-foreground'
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

// ============================================================================
// Confirmation
// ============================================================================

function ConfirmationView({ bookingId, go }: { bookingId: string; go: (v: View) => void }) {
  const [booking, setBooking] = React.useState<Booking | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // We didn't build a GET /api/bookings/:id — fetch from lookup using email/phone? Simpler: refetch via /api/bookings/lookup using a session hint. But we have the booking object created in CheckoutView.
    // As a fallback, store the booking in sessionStorage at checkout time.
    const raw = sessionStorage.getItem('last-booking')
    if (raw) {
      try {
        setBooking(JSON.parse(raw) as Booking)
        setLoading(false)
        return
      } catch {
        // ignore
      }
    }
    // Try fetching the booking via the lookup endpoint (won't have email/phone at this point)
    // Simpler: store bookingId-only and read from sessionStorage.
    setLoading(false)
  }, [bookingId])

  React.useEffect(() => {
    // If we have a fresh booking in sessionStorage, refresh it from the server.
    const raw = sessionStorage.getItem('last-booking')
    if (!raw) return
    try {
      const b = JSON.parse(raw) as Booking
      fetch(`/api/bookings/lookup?email=${encodeURIComponent(b.passengerEmail)}`)
        .then((r) => r.json())
        .then((data: Booking[]) => {
          const found = data.find((x) => x.id === bookingId)
          if (found) setBooking(found)
        })
    } catch {
      // ignore
    }
  }, [bookingId])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card className="h-64 animate-pulse bg-muted/40" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Booking not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => go({ name: 'home' })}>
          Back to home
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-9 w-9" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking confirmed!</h1>
          <p className="text-muted-foreground mb-6">
            A copy of your ticket has been sent to <span className="font-medium text-foreground">{booking.passengerEmail}</span>.
          </p>

          <div className="text-left rounded-xl border bg-muted/30 p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Booking ID</span>
              <span className="font-mono font-medium">{booking.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Passenger</span>
              <span className="font-medium">{booking.passengerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{booking.passengerPhone}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium">{booking.trip?.route?.origin} → {booking.trip?.route?.destination}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Departure</span>
              <span className="font-medium">{booking.trip ? formatDateTime(booking.trip.departureTime) : '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bus</span>
              <span className="font-medium">{booking.trip?.bus?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Seats</span>
              <span className="font-medium">{booking.seatNumbers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Boarding</span>
              <span className="font-medium text-right text-xs">{booking.boardingCounterName ?? '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium">{booking.paymentMethod} · {booking.paymentRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total paid</span>
              <span className="text-xl font-bold text-primary">{formatBDT(booking.totalAmount)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
            <Button onClick={() => booking.trip && go({ name: 'track', tripId: booking.trip.id })}>
              <Radio className="h-4 w-4 mr-1" /> Track this bus
            </Button>
            <Button variant="outline" onClick={() => go({ name: 'my-bookings' })}>
              View my bookings
            </Button>
            <Button variant="ghost" onClick={() => go({ name: 'home' })}>
              Back to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Track view (live tracking)
// ============================================================================

function TrackView({ tripId, go }: { tripId?: string; go: (v: View) => void }) {
  const [trips, setTrips] = React.useState<TripWithTracking[]>([])
  const [activeTripId, setActiveTripId] = React.useState<string | undefined>(tripId)
  const [loading, setLoading] = React.useState(true)
  const [locations, setLocations] = React.useState<Record<string, BusLocation>>({})

  // Load all trackable trips
  React.useEffect(() => {
    fetch('/api/tracking')
      .then((r) => r.json())
      .then((data) => {
        const arr = data as TripWithTracking[]
        setTrips(arr)
        if (!activeTripId && arr.length > 0) setActiveTripId(arr[0]!.id)
        // Seed local location map
        const map: Record<string, BusLocation> = {}
        for (const t of arr) if (t.location) map[t.id] = t.location
        setLocations(map)
      })
      .finally(() => setLoading(false))
  }, [activeTripId])

  // WebSocket subscription — receives live bus location updates from the tracking service.
  React.useEffect(() => {
    const sock = io('/?XTransformPort=3003', {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      path: '/',
    })
    sock.on('connect', () => {
      sock.emit('subscribe', {})
    })
    sock.on('location-update', (loc: BusLocation) => {
      if (!loc.tripId) return
      setLocations((prev) => ({ ...prev, [loc.tripId]: loc }))
    })
    return () => {
      sock.disconnect()
    }
  }, [])

  const activeTrip = trips.find((t) => t.id === activeTripId)
  const activeLocation = activeTripId ? locations[activeTripId] : undefined

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Card className="h-96 animate-pulse bg-muted/40" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="h-6 w-6 text-primary" /> Live bus tracking
        </h1>
        <p className="text-muted-foreground">Real-time location of every active bus, updated live as it moves between counters.</p>
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No buses are currently on the road. Active trips will appear here once they depart.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Trip list */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-1 px-1">Active buses</div>
            <div className="max-h-[640px] overflow-y-auto scroll-thin space-y-2 pr-1">
              {trips.map((t) => {
                const loc = locations[t.id]
                const isActive = t.id === activeTripId
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTripId(t.id)}
                    className={classNames(
                      'w-full text-left rounded-lg border-2 p-3 transition-all',
                      isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]}>
                        {STATUS_LABELS[t.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{formatTime(t.departureTime)}</span>
                    </div>
                    <div className="font-semibold text-sm">
                      {t.route?.origin} → {t.route?.destination}
                    </div>
                    <div className="text-xs text-muted-foreground">{t.bus?.name}</div>
                    {loc && (
                      <div className="mt-1.5 text-xs flex items-center gap-1 text-primary">
                        <Navigation className="h-3 w-3" />
                        At {loc.currentCounterName ?? 'start'}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active trip detail */}
          {activeTrip && (
            <TrackDetail trip={activeTrip} location={activeLocation ?? null} />
          )}
        </div>
      )}
    </div>
  )
}

function TrackDetail({ trip, location }: { trip: TripWithTracking; location: BusLocation | null }) {
  const counters = trip.route?.counters ?? []
  const progress = location?.progressPct ?? 0
  const isLive = !!location && (trip.status === 'DEPARTED' || trip.status === 'BOARDING')

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={STATUS_COLORS[trip.status as keyof typeof STATUS_COLORS]}>
                  {STATUS_LABELS[trip.status as keyof typeof STATUS_LABELS]}
                </Badge>
                {isLive && (
                  <Badge variant="secondary" className="gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> LIVE
                  </Badge>
                )}
              </div>
              <div className="text-xl font-bold">
                {trip.route?.origin} <ArrowRight className="h-5 w-5 inline text-muted-foreground" /> {trip.route?.destination}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {trip.bus?.name} · {trip.bus?.plateNumber} · {trip.bus?.type}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-xs text-muted-foreground">Departed</div>
              <div className="font-semibold">{formatTime(trip.departureTime)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {location ? `Updated ${new Date(location.lastUpdated).toLocaleTimeString()}` : 'No updates yet'}
              </div>
            </div>
          </div>

          {/* Route map */}
          <div className="rounded-xl bg-muted/30 p-3">
            <RouteMap counters={counters} location={location} />
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Trip progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Live stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<MapPin className="h-4 w-4" />}
          label="Current counter"
          value={location?.currentCounterName ?? 'Not started'}
          sub={location?.status === 'AT_COUNTER' ? 'Bus is stopped here' : 'Last passed counter'}
        />
        <StatCard
          icon={<Flag className="h-4 w-4" />}
          label="Next stop"
          value={location?.nextCounterName ?? 'Final destination'}
          sub={location?.nextCounterName ? 'Bus heading here' : 'Trip ends at current stop'}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="ETA to next"
          value={location?.etaMinutes ? minutesToDuration(location.etaMinutes) : '—'}
          sub={location?.nextCounterName ? `to ${location.nextCounterName}` : ''}
        />
        <StatCard
          icon={<Gauge className="h-4 w-4" />}
          label="Current speed"
          value={location ? `${location.speed.toFixed(0)} km/h` : '—'}
          sub={location?.status === 'MOVING' ? 'On the move' : location?.status === 'AT_COUNTER' ? 'Boarding / alighting' : location?.status === 'ARRIVED' ? 'Trip complete' : 'Idle'}
        />
      </div>

      {/* Counter timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Route timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {counters.map((c: Counter, i: number) => {
              const counterProgress = counters.length > 1 ? (i / (counters.length - 1)) * 100 : 0
              const isPast = progress >= counterProgress
              const isCurrent = location?.currentCounterId === c.id
              const isNext = location?.nextCounterId === c.id
              return (
                <div
                  key={c.id}
                  className={classNames(
                    'flex items-center gap-3 rounded-lg p-2.5 transition-colors',
                    isCurrent ? 'bg-primary/10 border border-primary/30' : isNext ? 'bg-accent/10 border border-accent/30' : 'border border-transparent'
                  )}
                >
                  <div
                    className={classNames(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isNext
                          ? 'bg-accent text-accent-foreground'
                          : isPast
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm flex items-center gap-1.5">
                      {c.name}
                      {isCurrent && <Badge className="bg-primary text-primary-foreground text-[10px]">CURRENT</Badge>}
                      {isNext && <Badge className="bg-accent text-accent-foreground text-[10px]">NEXT</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.address ? `${c.address} · ` : ''}
                      {c.minutesFromStart === 0 ? 'Start' : `${Math.floor(c.minutesFromStart / 60)}h ${c.minutesFromStart % 60}m from start`}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-medium">
                      {formatTime(new Date(new Date(trip.departureTime).getTime() + c.minutesFromStart * 60000))}
                    </div>
                    <div className="text-muted-foreground">
                      {counterProgress <= progress ? 'passed' : 'upcoming'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          {icon}
          {label}
        </div>
        <div className="font-semibold text-base truncate" title={value}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// My bookings
// ============================================================================

function MyBookingsView({ go }: { go: (v: View) => void }) {
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const lookup = async () => {
    if (!email && !phone) return
    setLoading(true)
    const params = new URLSearchParams()
    if (email) params.set('email', email)
    if (phone) params.set('phone', phone)
    const res = await fetch(`/api/bookings/lookup?${params.toString()}`)
    const data = await res.json()
    setBookings(data as Booking[])
    setLoaded(true)
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Ticket className="h-6 w-6 text-primary" /> My bookings
      </h1>
      <p className="text-muted-foreground mb-6">Enter your email or phone to retrieve your bookings.</p>

      <Card className="mb-6">
        <CardContent className="p-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" />
          </div>
          <div className="flex items-end">
            <Button onClick={lookup} disabled={loading || (!email && !phone)} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
              Find
            </Button>
          </div>
        </CardContent>
      </Card>

      {!loaded ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Search for your bookings to see them here.
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <XCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
            No bookings found. Try a different email or phone.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} onTrack={() => b.trip && go({ name: 'track', tripId: b.trip.id })} />
          ))}
        </div>
      )}
    </div>
  )
}

function BookingRow({ booking, onTrack }: { booking: Booking; onTrack: () => void }) {
  const paid = booking.paymentStatus === 'PAID'
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={paid ? 'default' : 'destructive'} className={paid ? 'bg-primary text-primary-foreground' : ''}>
                {paid ? 'PAID' : booking.paymentStatus}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">#{booking.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="font-semibold">
              {booking.trip?.route?.origin} → {booking.trip?.route?.destination}
            </div>
            <div className="text-xs text-muted-foreground">
              {booking.trip ? formatDateTime(booking.trip.departureTime) : ''} · {booking.trip?.bus?.name}
            </div>
            <div className="text-xs mt-1">
              Seats: <span className="font-medium">{booking.seatNumbers}</span>
              {booking.boardingCounterName ? ` · Boarding: ${booking.boardingCounterName}` : ''}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{formatBDT(booking.totalAmount)}</div>
              <div className="text-xs text-muted-foreground">{booking.paymentMethod ?? '—'}</div>
            </div>
            {paid && booking.trip && (
              <Button size="sm" variant="outline" onClick={onTrack}>
                <Radio className="h-3.5 w-3.5" /> Track
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Admin dashboard
// ============================================================================

function AdminView({ go }: { go: (v: View) => void }) {
  const [tab, setTab] = React.useState('dashboard')
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Owner dashboard</h1>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto scroll-thin">
          <TabsTrigger value="dashboard"><Activity className="h-4 w-4 mr-1" /> Dashboard</TabsTrigger>
          <TabsTrigger value="trips"><Ticket className="h-4 w-4 mr-1" /> Trips</TabsTrigger>
          <TabsTrigger value="routes"><RouteIcon className="h-4 w-4 mr-1" /> Routes</TabsTrigger>
          <TabsTrigger value="buses"><BusIcon className="h-4 w-4 mr-1" /> Buses</TabsTrigger>
          <TabsTrigger value="tracking"><Navigation className="h-4 w-4 mr-1" /> Live tracking</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-4"><AdminDashboard /></TabsContent>
        <TabsContent value="trips" className="mt-4"><AdminTrips /></TabsContent>
        <TabsContent value="routes" className="mt-4"><AdminRoutes /></TabsContent>
        <TabsContent value="buses" className="mt-4"><AdminBuses /></TabsContent>
        <TabsContent value="tracking" className="mt-4"><AdminTracking go={go} /></TabsContent>
      </Tabs>
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = React.useState<{
    counts: { trips: number; buses: number; routes: number; bookings: number }
    revenue: number
    ticketsSold: number
    activeTrips: Array<{ id: string; status: string; departureTime: string; busName: string; routeName: string; origin: string; destination: string }>
    revenueByRoute: Array<{ routeName: string; revenue: number }>
  } | null>(null)

  React.useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats)
  }, [])

  if (!stats) {
    return <Card className="h-64 animate-pulse bg-muted/40" />
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<DollarSign />} label="Revenue" value={formatBDT(stats.revenue)} sub="from paid bookings" />
        <KpiCard icon={<Ticket />} label="Tickets sold" value={stats.ticketsSold.toString()} sub={`${stats.counts.bookings} bookings total`} />
        <KpiCard icon={<BusIcon />} label="Active buses" value={stats.activeTrips.length.toString()} sub="on the road now" />
        <KpiCard icon={<RouteIcon />} label="Routes" value={stats.counts.routes.toString()} sub={`${stats.counts.trips} trips scheduled`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active trips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary animate-pulse" /> Active trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.activeTrips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active trips right now.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto scroll-thin">
                {stats.activeTrips.map((t) => (
                  <div key={t.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]}>{STATUS_LABELS[t.status as keyof typeof STATUS_LABELS]}</Badge>
                      <span className="text-xs text-muted-foreground">{formatTime(t.departureTime)}</span>
                    </div>
                    <div className="font-medium">{t.origin} → {t.destination}</div>
                    <div className="text-xs text-muted-foreground">{t.busName} · {t.routeName}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by route */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Revenue by route
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenueByRoute.length === 0 ? (
              <p className="text-sm text-muted-foreground">No revenue data yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.revenueByRoute.map((r, idx) => {
                  const max = stats.revenueByRoute[0]?.revenue ?? 1
                  const pct = (r.revenue / max) * 100
                  return (
                    <div key={`${idx}-${r.routeName}`}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate pr-2">{r.routeName}</span>
                        <span className="font-semibold text-primary">{formatBDT(r.revenue)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase text-muted-foreground tracking-wide">{label}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
          </span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  )
}

// ---- Admin: trips ----
function AdminTrips() {
  const [trips, setTrips] = React.useState<Trip[]>([])
  const [buses, setBuses] = React.useState<Bus[]>([])
  const [routes, setRoutes] = React.useState<Route[]>([])
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()

  // form state
  const [busId, setBusId] = React.useState('')
  const [routeId, setRouteId] = React.useState('')
  const [departure, setDeparture] = React.useState('')
  const [arrival, setArrival] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [creating, setCreating] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/trips').then((r) => r.json()),
      fetch('/api/buses').then((r) => r.json()),
      fetch('/api/routes').then((r) => r.json()),
    ]).then(([t, b, r]) => {
      setTrips(t as Trip[])
      setBuses(b as Bus[])
      setRoutes(r as Route[])
      if ((b as Bus[]).length > 0) setBusId((b as Bus[])[0]!.id)
      if ((r as Route[]).length > 0) setRouteId((r as Route[])[0]!.id)
    }).finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!busId || !routeId || !departure || !arrival || !price) {
      toast({ title: 'Fill in all fields', variant: 'destructive' })
      return
    }
    setCreating(true)
    const res = await fetch('/api/admin/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ busId, routeId, departureTime: departure, arrivalTime: arrival, pricePerSeat: Number(price) }),
    })
    setCreating(false)
    if (res.ok) {
      toast({ title: 'Trip created' })
      setOpen(false)
      setDeparture('')
      setArrival('')
      setPrice('')
      load()
    } else {
      const j = await res.json().catch(() => ({}))
      toast({ title: 'Failed', description: j.error ?? 'Unknown error', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{trips.length} scheduled trips across {routes.length} routes and {buses.length} buses.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add trip</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule a new trip</DialogTitle>
              <DialogDescription>
                A trip is a bus running a route at a specific time. Passengers will see this as a bookable ticket.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Bus</Label>
                <Select value={busId} onValueChange={setBusId}>
                  <SelectTrigger><SelectValue placeholder="Select bus" /></SelectTrigger>
                  <SelectContent>
                    {buses.map((b) => <SelectItem key={b.id} value={b.id}>{b.name} · {b.plateNumber}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Route</Label>
                <Select value={routeId} onValueChange={setRouteId}>
                  <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Departure</Label>
                  <Input type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Arrival</Label>
                  <Input type="datetime-local" value={arrival} onChange={(e) => setArrival(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Price per seat (BDT)</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1200" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Create trip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="h-64 animate-pulse bg-muted/40" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{(t as Trip).route?.origin ?? '—'} → {(t as Trip).route?.destination ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{(t as Trip).route?.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{t.bus?.name}</div>
                      <div className="text-xs text-muted-foreground">{t.bus?.plateNumber}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDateTime(t.departureTime)}</div>
                    </TableCell>
                    <TableCell className="font-medium">{formatBDT(t.pricePerSeat)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]}>{STATUS_LABELS[t.status as keyof typeof STATUS_LABELS]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---- Admin: routes ----
function AdminRoutes() {
  const [routes, setRoutes] = React.useState<Route[]>([])
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()

  // form state
  const [name, setName] = React.useState('')
  const [origin, setOrigin] = React.useState('')
  const [destination, setDestination] = React.useState('')
  const [distance, setDistance] = React.useState('')
  const [estimated, setEstimated] = React.useState('')
  const [counters, setCounters] = React.useState('')

  const load = React.useCallback(() => {
    setLoading(true)
    fetch('/api/routes').then((r) => r.json()).then((data) => setRoutes(data as Route[])).finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!name || !origin || !destination || !distance || !estimated || !counters) {
      toast({ title: 'Fill in all fields', variant: 'destructive' })
      return
    }
    // Parse counters: one per line, format: Name | address | lat | lng | minutesFromStart
    const lines = counters.split('\n').map((l) => l.trim()).filter(Boolean)
    const parsed = lines.map((line, i) => {
      const parts = line.split('|').map((p) => p.trim())
      return {
        name: parts[0] ?? `Counter ${i + 1}`,
        address: parts[1] ?? '',
        lat: Number(parts[2] ?? 0),
        lng: Number(parts[3] ?? 0),
        sequence: i,
        minutesFromStart: Number(parts[4] ?? 0),
      }
    })
    if (parsed.length < 2) {
      toast({ title: 'Provide at least 2 counters', variant: 'destructive' })
      return
    }
    const res = await fetch('/api/admin/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, origin, destination,
        distanceKm: Number(distance),
        estimatedMinutes: Number(estimated),
        counters: parsed,
      }),
    })
    if (res.ok) {
      toast({ title: 'Route created' })
      setOpen(false)
      setName(''); setOrigin(''); setDestination(''); setDistance(''); setEstimated(''); setCounters('')
      load()
    } else {
      const j = await res.json().catch(() => ({}))
      toast({ title: 'Failed', description: j.error ?? 'Unknown error', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{routes.length} routes.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add route</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add a new route</DialogTitle>
              <DialogDescription>
                A route is the path the bus takes. Add counters in order — these are the stops the bus will pass through and where passengers can board.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Route name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dhaka – Chittagong Express" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Origin</Label>
                  <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Dhaka" />
                </div>
                <div className="space-y-1.5">
                  <Label>Destination</Label>
                  <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Chittagong" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Distance (km)</Label>
                  <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="264" />
                </div>
                <div className="space-y-1.5">
                  <Label>Estimated (minutes)</Label>
                  <Input type="number" value={estimated} onChange={(e) => setEstimated(e.target.value)} placeholder="360" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Counters (one per line)</Label>
                <Textarea
                  rows={6}
                  value={counters}
                  onChange={(e) => setCounters(e.target.value)}
                  placeholder={`Gabtoli Bus Terminal | Gabtoli, Dhaka | 23.76 | 90.34 | 0\nJatrabari Counter | Jatrabari, Dhaka | 23.70 | 90.42 | 25\nComilla Counter | Comilla | 23.46 | 91.18 | 150`}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Format per line: <code>Name | Address | Lat | Lng | MinutesFromStart</code>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-1" /> Create route</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="h-64 animate-pulse bg-muted/40" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {routes.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{r.name}</div>
                  <Badge variant="secondary">{r.counters?.length ?? 0} stops</Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {r.origin} → {r.destination} · {r.distanceKm} km · {minutesToDuration(r.estimatedMinutes)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.counters?.map((c) => (
                    <span key={c.id} className="text-[10px] rounded bg-muted px-1.5 py-0.5">
                      {c.sequence + 1}. {c.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Admin: buses ----
function AdminBuses() {
  const [buses, setBuses] = React.useState<Bus[]>([])
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()

  const [name, setName] = React.useState('')
  const [plate, setPlate] = React.useState('')
  const [seats, setSeats] = React.useState('')
  const [type, setType] = React.useState('AC Business')
  const [driver, setDriver] = React.useState('')
  const [phone, setPhone] = React.useState('')

  const load = React.useCallback(() => {
    setLoading(true)
    fetch('/api/buses').then((r) => r.json()).then((data) => setBuses(data as Bus[])).finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!name || !plate || !seats || !type) {
      toast({ title: 'Fill in all required fields', variant: 'destructive' })
      return
    }
    const res = await fetch('/api/admin/buses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, plateNumber: plate, totalSeats: Number(seats), type, driverName: driver, driverPhone: phone }),
    })
    if (res.ok) {
      toast({ title: 'Bus added' })
      setOpen(false)
      setName(''); setPlate(''); setSeats(''); setType('AC Business'); setDriver(''); setPhone('')
      load()
    } else {
      const j = await res.json().catch(() => ({}))
      toast({ title: 'Failed', description: j.error ?? 'Unknown error', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{buses.length} buses in fleet.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add bus</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a bus to your fleet</DialogTitle>
              <DialogDescription>
                Buses can be assigned to multiple trips. Each bus has a unique plate number and a fixed seat count.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Bus name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Green Line — GL-05" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Plate number</Label>
                  <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="DHA-11-5678" />
                </div>
                <div className="space-y-1.5">
                  <Label>Total seats</Label>
                  <Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} placeholder="36" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC Business">AC Business</SelectItem>
                    <SelectItem value="AC Sleeper">AC Sleeper</SelectItem>
                    <SelectItem value="Non-AC Chair">Non-AC Chair</SelectItem>
                    <SelectItem value="Volvo Multi-Axle">Volvo Multi-Axle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Driver name</Label>
                  <Input value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="Karim Uddin" />
                </div>
                <div className="space-y-1.5">
                  <Label>Driver phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-1" /> Add bus</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="h-64 animate-pulse bg-muted/40" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {buses.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BusIcon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary">{b.type}</Badge>
                </div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-xs text-muted-foreground">{b.plateNumber} · {b.totalSeats} seats</div>
                {b.driverName && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Driver: {b.driverName} {b.driverPhone ? `· ${b.driverPhone}` : ''}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Admin: live tracking control ----
function AdminTracking({ go }: { go: (v: View) => void }) {
  const [trips, setTrips] = React.useState<TripWithTracking[]>([])
  const [activeTripId, setActiveTripId] = React.useState<string>('')
  const [loading, setLoading] = React.useState(true)
  const [locations, setLocations] = React.useState<Record<string, BusLocation>>({})
  const [advancing, setAdvancing] = React.useState(false)
  const [progressInput, setProgressInput] = React.useState(0)
  const { toast } = useToast()

  const load = React.useCallback(() => {
    setLoading(true)
    fetch('/api/tracking')
      .then((r) => r.json())
      .then((data) => {
        const arr = data as TripWithTracking[]
        setTrips(arr)
        if (!activeTripId && arr.length > 0) setActiveTripId(arr[0]!.id)
        const map: Record<string, BusLocation> = {}
        for (const t of arr) if (t.location) map[t.id] = t.location
        setLocations(map)
      })
      .finally(() => setLoading(false))
  }, [activeTripId])

  React.useEffect(() => { load() }, [load])

  React.useEffect(() => {
    const sock = io('/?XTransformPort=3003', {
      transports: ['polling', 'websocket'],
      reconnection: true,
      path: '/',
    })
    sock.on('connect', () => sock.emit('subscribe', {}))
    sock.on('location-update', (loc: BusLocation) => {
      if (!loc.tripId) return
      setLocations((prev) => ({ ...prev, [loc.tripId]: loc }))
    })
    return () => { sock.disconnect() }
  }, [])

  const activeTrip = trips.find((t) => t.id === activeTripId)
  const activeLocation = activeTripId ? locations[activeTripId] : undefined

  React.useEffect(() => {
    if (activeLocation) setProgressInput(Math.round(activeLocation.progressPct))
  }, [activeLocation])

  const handleAdvance = async () => {
    if (!activeTripId || !activeTrip?.bus) return
    setAdvancing(true)
    const res = await fetch('/api/admin/bus-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: activeTripId, busId: activeTrip.bus.id, action: 'advance' }),
    })
    setAdvancing(false)
    if (res.ok) {
      toast({ title: 'Bus advanced to next counter' })
    } else {
      const j = await res.json().catch(() => ({}))
      toast({ title: 'Failed', description: j.error ?? 'Unknown error', variant: 'destructive' })
    }
  }

  const handleSetProgress = async () => {
    if (!activeTripId || !activeTrip?.bus) return
    setAdvancing(true)
    const res = await fetch('/api/admin/bus-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: activeTripId, busId: activeTrip.bus.id, action: 'set', progressPct: Number(progressInput) }),
    })
    setAdvancing(false)
    if (res.ok) toast({ title: `Bus position set to ${progressInput}%` })
  }

  if (loading) return <Card className="h-96 animate-pulse bg-muted/40" />

  return (
    <div className="space-y-4">
      <Card className="bg-accent/5 border-accent/30">
        <CardContent className="p-4 text-sm">
          <div className="flex items-start gap-3">
            <Navigation className="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Push live location updates to passengers</p>
              <p className="text-muted-foreground mt-1">
                Use <b>Advance to next counter</b> to move the bus forward by one stop. Use the slider for finer control — every change is broadcast live to anyone tracking this bus.
              </p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => go({ name: 'track', tripId: activeTripId || undefined })}>
                Open passenger tracking view <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1 px-1">Trackable trips</div>
          <div className="max-h-[560px] overflow-y-auto scroll-thin space-y-2 pr-1">
            {trips.length === 0 && <p className="text-sm text-muted-foreground p-3">No active trips.</p>}
            {trips.map((t) => {
              const loc = locations[t.id]
              const isActive = t.id === activeTripId
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTripId(t.id)}
                  className={classNames(
                    'w-full text-left rounded-lg border-2 p-3 transition-all',
                    isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground bg-card'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]}>
                      {STATUS_LABELS[t.status as keyof typeof STATUS_LABELS]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{formatTime(t.departureTime)}</span>
                  </div>
                  <div className="font-semibold text-sm">{t.route?.origin} → {t.route?.destination}</div>
                  <div className="text-xs text-muted-foreground">{t.bus?.name}</div>
                  {loc && <div className="text-xs text-primary mt-1">At: {loc.currentCounterName}</div>}
                </button>
              )
            })}
          </div>
        </div>

        {activeTrip && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Controlling bus for</div>
                    <div className="text-lg font-bold">{activeTrip.route?.origin} → {activeTrip.route?.destination}</div>
                    <div className="text-xs text-muted-foreground">{activeTrip.bus?.name} · {activeTrip.bus?.plateNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Current position</div>
                    <div className="text-lg font-bold text-primary">{(activeLocation?.progressPct ?? 0).toFixed(0)}%</div>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <RouteMap counters={activeTrip.route?.counters ?? []} location={activeLocation ?? null} progress={progressInput} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update bus position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label className="text-base">Fine-grained progress</Label>
                    <span className="font-semibold text-primary">{progressInput}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progressInput}
                    onChange={(e) => setProgressInput(Number(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                  <Button onClick={handleSetProgress} disabled={advancing} variant="outline" className="w-full">
                    {advancing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Navigation className="h-4 w-4 mr-1" />}
                    Set position to {progressInput}%
                  </Button>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-medium mb-2">Quick actions</div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleAdvance} disabled={advancing}>
                      {advancing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-1" />}
                      Advance to next counter
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Each click moves the bus to the next stop on the route, updates its ETA, and notifies all passengers currently tracking this bus.
                  </p>
                </div>

                {activeLocation && (
                  <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                    <div className="font-medium mb-1">Last update</div>
                    <div>Current counter: <b>{activeLocation.currentCounterName ?? '—'}</b></div>
                    <div>Next counter: <b>{activeLocation.nextCounterName ?? 'Final destination'}</b></div>
                    <div>Speed: <b>{activeLocation.speed.toFixed(0)} km/h</b> · Status: <b>{activeLocation.status}</b></div>
                    <div>ETA to next: <b>{activeLocation.etaMinutes} min</b></div>
                    <div>Last updated: <b>{new Date(activeLocation.lastUpdated).toLocaleString()}</b></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
