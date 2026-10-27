// Seed the database with realistic bus ticketing data.
// Routes are roughly modeled on intercity routes in Bangladesh (Dhaka <-> Chittagong, etc.)
// Coordinates are approximate (lat,lng) and ordered along each route.

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean up
  await db.busLocation.deleteMany()
  await db.booking.deleteMany()
  await db.trip.deleteMany()
  await db.counter.deleteMany()
  await db.route.deleteMany()
  await db.bus.deleteMany()

  // ===== Route 1: Dhaka -> Chittagong =====
  const route1 = await db.route.create({
    data: {
      name: 'Dhaka – Chittagong Express',
      origin: 'Dhaka',
      destination: 'Chittagong',
      distanceKm: 264,
      estimatedMinutes: 360,
    },
  })

  const counters1 = [
    { name: 'Gabtoli Bus Terminal', address: 'Gabtoli, Dhaka', lat: 23.7605, lng: 90.3492, sequence: 0, minutesFromStart: 0 },
    { name: 'Jatrabari Counter', address: 'Jatrabari, Dhaka', lat: 23.7005, lng: 90.4287, sequence: 1, minutesFromStart: 25 },
    { name: 'Comilla Counter', address: 'Comilla Cantonment', lat: 23.4618, lng: 91.1805, sequence: 2, minutesFromStart: 150 },
    { name: 'Feni Counter', address: 'Feni Bus Stand', lat: 23.0159, lng: 91.3973, sequence: 3, minutesFromStart: 230 },
    { name: 'Chittagong Kaptai Counter', address: 'Kaptai Rasta, Chittagong', lat: 22.3593, lng: 91.8214, sequence: 4, minutesFromStart: 330 },
    { name: 'Chittagong Central Terminal', address: 'Oxygen Square, Chittagong', lat: 22.3615, lng: 91.7817, sequence: 5, minutesFromStart: 360 },
  ]
  for (const c of counters1) {
    await db.counter.create({ data: { ...c, routeId: route1.id } })
  }

  // ===== Route 2: Dhaka -> Sylhet =====
  const route2 = await db.route.create({
    data: {
      name: 'Dhaka – Sylhet Highway',
      origin: 'Dhaka',
      destination: 'Sylhet',
      distanceKm: 240,
      estimatedMinutes: 330,
    },
  })

  const counters2 = [
    { name: 'Mohakhali Bus Terminal', address: 'Mohakhali, Dhaka', lat: 23.7805, lng: 90.4032, sequence: 0, minutesFromStart: 0 },
    { name: 'Tongi Counter', address: 'Tongi, Gazipur', lat: 23.8915, lng: 90.4023, sequence: 1, minutesFromStart: 35 },
    { name: 'Mymensingh Counter', address: 'Gouripur Bus Stand', lat: 24.7471, lng: 90.4203, sequence: 2, minutesFromStart: 120 },
    { name: 'Sreemangal Counter', address: 'Sreemangal Bazaar', lat: 24.3065, lng: 91.7296, sequence: 3, minutesFromStart: 220 },
    { name: 'Habiganj Counter', address: 'Habiganj Bus Stand', lat: 24.3749, lng: 91.4155, sequence: 4, minutesFromStart: 270 },
    { name: 'Sylhet Central Terminal', address: 'Kadamtali, Sylhet', lat: 24.8917, lng: 91.8679, sequence: 5, minutesFromStart: 330 },
  ]
  for (const c of counters2) {
    await db.counter.create({ data: { ...c, routeId: route2.id } })
  }

  // ===== Route 3: Dhaka -> Khulna =====
  const route3 = await db.route.create({
    data: {
      name: 'Dhaka – Khulna Route',
      origin: 'Dhaka',
      destination: 'Khulna',
      distanceKm: 335,
      estimatedMinutes: 420,
    },
  })

  const counters3 = [
    { name: 'Gabtoli Bus Terminal', address: 'Gabtoli, Dhaka', lat: 23.7605, lng: 90.3492, sequence: 0, minutesFromStart: 0 },
    { name: 'Paturia Counter', address: 'Paturia Ghat', lat: 23.9635, lng: 89.8421, sequence: 1, minutesFromStart: 90 },
    { name: 'Faridpur Counter', address: 'Faridpur Bus Stand', lat: 23.6027, lng: 89.8336, sequence: 2, minutesFromStart: 150 },
    { name: 'Jessore Counter', address: 'Jessore New Bus Stand', lat: 23.1707, lng: 89.2133, sequence: 3, minutesFromStart: 320 },
    { name: 'Khulna Central Terminal', address: 'Sonadanga, Khulna', lat: 22.8456, lng: 89.5403, sequence: 4, minutesFromStart: 420 },
  ]
  for (const c of counters3) {
    await db.counter.create({ data: { ...c, routeId: route3.id } })
  }

  // ===== Buses =====
  const bus1 = await db.bus.create({
    data: { name: 'Green Line Paribahan — GL-01', plateNumber: 'DHA-11-1234', totalSeats: 36, type: 'AC Business', driverName: 'Karim Uddin', driverPhone: '+8801711000001' },
  })
  const bus2 = await db.bus.create({
    data: { name: 'Shohagh Paribahan — SP-02', plateNumber: 'DHA-11-2233', totalSeats: 40, type: 'AC Sleeper', driverName: 'Abdul Hamid', driverPhone: '+8801711000002' },
  })
  const bus3 = await db.bus.create({
    data: { name: 'Hanif Enterprise — HE-03', plateNumber: 'DHA-11-3344', totalSeats: 32, type: 'Non-AC Chair', driverName: 'Jashim Uddin', driverPhone: '+8801711000003' },
  })
  const bus4 = await db.bus.create({
    data: { name: 'Saintmartin Transport — ST-04', plateNumber: 'DHA-11-4455', totalSeats: 36, type: 'AC Business', driverName: 'Rafiqul Islam', driverPhone: '+8801711000004' },
  })

  // ===== Trips (today + tomorrow) =====
  const now = new Date()
  const todayAt = (h: number, m: number) => {
    const d = new Date(now)
    d.setHours(h, m, 0, 0)
    return d
  }
  const tomorrowAt = (h: number, m: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    d.setHours(h, m, 0, 0)
    return d
  }
  const addMinutes = (date: Date, min: number) => new Date(date.getTime() + min * 60000)

  const trip1 = await db.trip.create({
    data: {
      busId: bus1.id,
      routeId: route1.id,
      departureTime: todayAt(7, 30),
      arrivalTime: addMinutes(todayAt(7, 30), route1.estimatedMinutes),
      pricePerSeat: 1200,
      status: 'DEPARTED',
    },
  })

  const trip2 = await db.trip.create({
    data: {
      busId: bus2.id,
      routeId: route1.id,
      departureTime: todayAt(22, 0),
      arrivalTime: addMinutes(todayAt(22, 0), route1.estimatedMinutes),
      pricePerSeat: 1500,
      status: 'SCHEDULED',
    },
  })

  const trip3 = await db.trip.create({
    data: {
      busId: bus3.id,
      routeId: route2.id,
      departureTime: todayAt(8, 0),
      arrivalTime: addMinutes(todayAt(8, 0), route2.estimatedMinutes),
      pricePerSeat: 900,
      status: 'DEPARTED',
    },
  })

  const trip4 = await db.trip.create({
    data: {
      busId: bus4.id,
      routeId: route2.id,
      departureTime: tomorrowAt(9, 15),
      arrivalTime: addMinutes(tomorrowAt(9, 15), route2.estimatedMinutes),
      pricePerSeat: 1100,
      status: 'SCHEDULED',
    },
  })

  const trip5 = await db.trip.create({
    data: {
      busId: bus1.id,
      routeId: route3.id,
      departureTime: tomorrowAt(6, 45),
      arrivalTime: addMinutes(tomorrowAt(6, 45), route3.estimatedMinutes),
      pricePerSeat: 1350,
      status: 'SCHEDULED',
    },
  })

  const trip6 = await db.trip.create({
    data: {
      busId: bus3.id,
      routeId: route3.id,
      departureTime: todayAt(21, 30),
      arrivalTime: addMinutes(todayAt(21, 30), route3.estimatedMinutes),
      pricePerSeat: 850,
      status: 'BOARDING',
    },
  })

  // ===== Sample booking (a few seats taken on trip1) =====
  await db.booking.create({
    data: {
      tripId: trip1.id,
      passengerName: 'Rahim Ahmed',
      passengerEmail: 'rahim@example.com',
      passengerPhone: '+8801712345678',
      seatNumbers: 'A1,A2',
      boardingCounterId: null,
      boardingCounterName: 'Gabtoli Bus Terminal',
      totalAmount: 2400,
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      paymentRef: 'PAY-DEMO-0001',
      status: 'CONFIRMED',
    },
  })
  await db.booking.create({
    data: {
      tripId: trip1.id,
      passengerName: 'Karim Hossain',
      passengerEmail: 'karim@example.com',
      passengerPhone: '+8801712345679',
      seatNumbers: 'B3',
      boardingCounterId: null,
      boardingCounterName: 'Jatrabari Counter',
      totalAmount: 1200,
      paymentStatus: 'PAID',
      paymentMethod: 'BKASH',
      paymentRef: 'PAY-DEMO-0002',
      status: 'CONFIRMED',
    },
  })
  await db.booking.create({
    data: {
      tripId: trip2.id,
      passengerName: 'Sadia Islam',
      passengerEmail: 'sadia@example.com',
      passengerPhone: '+8801712345680',
      seatNumbers: 'A4',
      boardingCounterId: null,
      boardingCounterName: 'Gabtoli Bus Terminal',
      totalAmount: 1500,
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      paymentRef: 'PAY-DEMO-0003',
      status: 'CONFIRMED',
    },
  })

  // ===== Initial bus locations =====
  // trip1 has DEPARTED — bus1 is currently somewhere between Jatrabari and Comilla
  const counters1List = await db.counter.findMany({ where: { routeId: route1.id }, orderBy: { sequence: 'asc' } })
  const startCounter1 = counters1List[0]
  const nextCounter1 = counters1List[1]
  await db.busLocation.create({
    data: {
      busId: bus1.id,
      tripId: trip1.id,
      lat: 23.7305, // somewhere between Jatrabari and Comilla
      lng: 90.3880,
      currentCounterId: startCounter1.id,
      currentCounterName: startCounter1.name,
      nextCounterId: nextCounter1.id,
      nextCounterName: nextCounter1.name,
      speed: 65,
      heading: 95,
      status: 'MOVING',
      progressPct: 8,
      etaMinutes: 22,
      lastUpdated: new Date(),
    },
  })

  // trip3 has DEPARTED — bus3 is somewhere on Sylhet route
  const counters2List = await db.counter.findMany({ where: { routeId: route2.id }, orderBy: { sequence: 'asc' } })
  const startCounter2 = counters2List[0]
  const nextCounter2 = counters2List[1]
  await db.busLocation.create({
    data: {
      busId: bus3.id,
      tripId: trip3.id,
      lat: 23.8360, // near Tongi
      lng: 90.4028,
      currentCounterId: startCounter2.id,
      currentCounterName: startCounter2.name,
      nextCounterId: nextCounter2.id,
      nextCounterName: nextCounter2.name,
      speed: 55,
      heading: 10,
      status: 'MOVING',
      progressPct: 12,
      etaMinutes: 28,
      lastUpdated: new Date(),
    },
  })

  // trip6 is BOARDING — bus3 at the terminal (Khulna route)
  // (bus3 reused — for demo we'll show its second location)
  const counters3List = await db.counter.findMany({ where: { routeId: route3.id }, orderBy: { sequence: 'asc' } })
  await db.busLocation.create({
    data: {
      busId: bus3.id,
      tripId: trip6.id,
      lat: counters3List[0].lat,
      lng: counters3List[0].lng,
      currentCounterId: counters3List[0].id,
      currentCounterName: counters3List[0].name,
      nextCounterId: counters3List[1]?.id ?? null,
      nextCounterName: counters3List[1]?.name ?? null,
      speed: 0,
      heading: 0,
      status: 'AT_COUNTER',
      progressPct: 0,
      etaMinutes: 0,
      lastUpdated: new Date(),
    },
  })

  console.log('Seed complete.')
  console.log('Routes:', await db.route.count())
  console.log('Counters:', await db.counter.count())
  console.log('Buses:', await db.bus.count())
  console.log('Trips:', await db.trip.count())
  console.log('Bookings:', await db.booking.count())
  console.log('BusLocations:', await db.busLocation.count())
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
