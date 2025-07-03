// This file simulates the backend logic that would normally be in Django
// In a real application, these calculations would be performed on the backend

import { addDays, format, addHours, differenceInHours } from "date-fns"

// ELD regulations
const MAX_DRIVING_HOURS_PER_DAY = 11
const MAX_ON_DUTY_HOURS_PER_DAY = 14
const REQUIRED_BREAK_AFTER_HOURS = 8
const BREAK_DURATION = 0.5 // 30 minutes
const REQUIRED_REST_DURATION = 10 // 10 hours
const MAX_CYCLE_HOURS = 70 // 70 hours in 8 days

// Constants for calculations
const AVG_DRIVING_SPEED = 55 // mph
const FUEL_STOP_DURATION = 1 // hour
const FUEL_EFFICIENCY = 6.5 // mpg
const FUEL_TANK_CAPACITY = 150 // gallons
const MAX_DISTANCE_PER_TANK = FUEL_TANK_CAPACITY * FUEL_EFFICIENCY

// Calculate route with all necessary stops
export async function calculateRoute(
  currentLocation: string,
  pickupLocation: string,
  dropoffLocation: string,
  currentCycleHours: number,
) {
  // In a real app, this would call mapping APIs to get actual routes and distances

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock distance calculations
  const distanceToPickup = calculateMockDistance(currentLocation, pickupLocation)
  const distanceToDropoff = calculateMockDistance(pickupLocation, dropoffLocation)
  const totalDistance = distanceToPickup + distanceToDropoff

  // Calculate driving times
  const drivingTimeToPickup = distanceToPickup / AVG_DRIVING_SPEED
  const drivingTimeToDropoff = distanceToDropoff / AVG_DRIVING_SPEED
  const totalDrivingTime = drivingTimeToPickup + drivingTimeToDropoff

  // Calculate required fuel stops
  const fuelStopsToPickup = Math.floor(distanceToPickup / MAX_DISTANCE_PER_TANK)
  const fuelStopsToDropoff = Math.floor(distanceToDropoff / MAX_DISTANCE_PER_TANK)
  const totalFuelStops = fuelStopsToPickup + fuelStopsToDropoff

  // Calculate required rest stops based on ELD regulations
  const { restStops, totalTripTime } = calculateRestStops(totalDrivingTime, currentCycleHours, totalFuelStops)

  // Generate waypoints
  const waypoints = generateWaypoints(
    currentLocation,
    pickupLocation,
    dropoffLocation,
    drivingTimeToPickup,
    drivingTimeToDropoff,
    fuelStopsToPickup,
    fuelStopsToDropoff,
    restStops,
  )

  // Calculate dates
  const startDate = new Date()
  const endDate = addHours(startDate, totalTripTime)

  return {
    totalDistance,
    totalDrivingTime,
    totalTripTime,
    waypoints,
    startDate: format(startDate, "MMM dd, yyyy"),
    endDate: format(endDate, "MMM dd, yyyy"),
    fuelStops: totalFuelStops,
    restStops: restStops.length,
  }
}

// Generate ELD log sheets for the trip
export function generateLogSheets(route) {
  const logSheets = []
  const startDate = new Date()

  // Create a log sheet for each day of the trip
  const tripDays = Math.ceil(route.totalTripTime / 24)

  for (let day = 0; day < tripDays; day++) {
    const currentDate = addDays(startDate, day)
    const formattedDate = format(currentDate, "MMM dd, yyyy")

    // Filter waypoints for this day
    const dayStart = addHours(startDate, day * 24)
    const dayEnd = addHours(startDate, (day + 1) * 24)

    // Generate log entries for this day
    const entries = generateLogEntriesForDay(route.waypoints, dayStart, dayEnd, day)

    // Calculate totals
    const totalDrivingHours = entries
      .filter((entry) => entry.status === "driving")
      .reduce((total, entry) => {
        const start = parseTimeToHours(entry.startTime)
        const end = parseTimeToHours(entry.endTime)
        return total + (end - start)
      }, 0)

    const totalOnDutyHours = entries
      .filter((entry) => entry.status === "on-duty")
      .reduce((total, entry) => {
        const start = parseTimeToHours(entry.startTime)
        const end = parseTimeToHours(entry.endTime)
        return total + (end - start)
      }, 0)

    const totalOffDutyHours = entries
      .filter((entry) => entry.status === "off-duty")
      .reduce((total, entry) => {
        const start = parseTimeToHours(entry.startTime)
        const end = parseTimeToHours(entry.endTime)
        return total + (end - start)
      }, 0)

    const totalSleeperHours = entries
      .filter((entry) => entry.status === "sleeper")
      .reduce((total, entry) => {
        const start = parseTimeToHours(entry.startTime)
        const end = parseTimeToHours(entry.endTime)
        return total + (end - start)
      }, 0)

    // Create log sheet
    logSheets.push({
      date: formattedDate,
      driverName: "John Doe",
      truckNumber: "TR-12345",
      startingLocation: entries.length > 0 ? entries[0].location : route.waypoints[0].location,
      endingLocation: entries.length > 0 ? entries[entries.length - 1].location : route.waypoints[0].location,
      entries,
      totalDrivingHours: Math.round(totalDrivingHours * 10) / 10,
      totalOnDutyHours: Math.round(totalOnDutyHours * 10) / 10,
      totalOffDutyHours: Math.round(totalOffDutyHours * 10) / 10,
      totalSleeperHours: Math.round(totalSleeperHours * 10) / 10,
    })
  }

  return logSheets
}

// Helper functions

function calculateMockDistance(from: string, to: string) {
  // In a real app, this would use a mapping API
  // For demo, generate a realistic distance based on string lengths
  const base = 100 + from.length * to.length
  const variation = Math.random() * 400
  return Math.round(base + variation)
}

function calculateRestStops(totalDrivingTime: number, currentCycleHours: number, fuelStops: number) {
  const restStops = []
  let remainingDrivingTime = totalDrivingTime
  let currentDayDrivingTime = 0
  let currentDayOnDutyTime = 0
  let timeUntilBreak = REQUIRED_BREAK_AFTER_HOURS
  let cycleHoursUsed = currentCycleHours

  // Account for fuel stops as on-duty time
  const totalOnDutyTimeForFuel = fuelStops * FUEL_STOP_DURATION

  let totalTripTime = totalDrivingTime + totalOnDutyTimeForFuel

  while (remainingDrivingTime > 0) {
    // Check if we need a 30-minute break
    if (timeUntilBreak <= 0) {
      restStops.push({ type: "break", duration: BREAK_DURATION })
      timeUntilBreak = REQUIRED_BREAK_AFTER_HOURS
      totalTripTime += BREAK_DURATION
      currentDayOnDutyTime += BREAK_DURATION
    }

    // Check if we've hit daily driving limit
    if (currentDayDrivingTime >= MAX_DRIVING_HOURS_PER_DAY) {
      restStops.push({ type: "rest", duration: REQUIRED_REST_DURATION })
      totalTripTime += REQUIRED_REST_DURATION
      currentDayDrivingTime = 0
      currentDayOnDutyTime = 0
      timeUntilBreak = REQUIRED_BREAK_AFTER_HOURS
    }

    // Check if we've hit daily on-duty limit
    if (currentDayOnDutyTime >= MAX_ON_DUTY_HOURS_PER_DAY) {
      restStops.push({ type: "rest", duration: REQUIRED_REST_DURATION })
      totalTripTime += REQUIRED_REST_DURATION
      currentDayDrivingTime = 0
      currentDayOnDutyTime = 0
      timeUntilBreak = REQUIRED_BREAK_AFTER_HOURS
    }

    // Check if we've hit cycle hours limit
    if (cycleHoursUsed >= MAX_CYCLE_HOURS) {
      restStops.push({ type: "reset", duration: 34 }) // 34-hour reset
      totalTripTime += 34
      cycleHoursUsed = 0
      currentDayDrivingTime = 0
      currentDayOnDutyTime = 0
      timeUntilBreak = REQUIRED_BREAK_AFTER_HOURS
    }

    // Drive for 1 hour or remaining time, whichever is less
    const hoursToDrive = Math.min(1, remainingDrivingTime)
    remainingDrivingTime -= hoursToDrive
    currentDayDrivingTime += hoursToDrive
    currentDayOnDutyTime += hoursToDrive
    timeUntilBreak -= hoursToDrive
    cycleHoursUsed += hoursToDrive
  }

  return { restStops, totalTripTime }
}

function generateWaypoints(
  currentLocation: string,
  pickupLocation: string,
  dropoffLocation: string,
  drivingTimeToPickup: number,
  drivingTimeToDropoff: number,
  fuelStopsToPickup: number,
  fuelStopsToDropoff: number,
  restStops: any[],
) {
  const waypoints = []
  const startDate = new Date()
  let currentTime = startDate
  let currentCoordinates = generateMockCoordinates(currentLocation)

  // Starting point
  waypoints.push({
    type: "start",
    location: currentLocation,
    coordinates: currentCoordinates,
    departureTime: format(currentTime, "h:mm a"),
  })

  // Generate waypoints to pickup
  const pickupCoordinates = generateMockCoordinates(pickupLocation)
  const pickupSegmentDistance = calculateMockDistance(currentLocation, pickupLocation)

  // Add fuel stops to pickup
  for (let i = 0; i < fuelStopsToPickup; i++) {
    const progress = (i + 1) / (fuelStopsToPickup + 1)
    const fuelStopCoordinates = interpolateCoordinates(currentCoordinates, pickupCoordinates, progress)

    // Add driving segment
    const segmentDrivingTime = drivingTimeToPickup / (fuelStopsToPickup + 1)
    currentTime = addHours(currentTime, segmentDrivingTime)

    waypoints.push({
      type: "fuel",
      location: `Fuel Stop ${i + 1}`,
      coordinates: fuelStopCoordinates,
      duration: FUEL_STOP_DURATION,
      arrivalTime: format(currentTime, "h:mm a"),
    })

    // Add fuel stop duration
    currentTime = addHours(currentTime, FUEL_STOP_DURATION)
    waypoints[waypoints.length - 1].departureTime = format(currentTime, "h:mm a")
  }

  // Add rest stops as needed before pickup
  const restStopsBeforePickup = Math.floor(
    restStops.length * (drivingTimeToPickup / (drivingTimeToPickup + drivingTimeToDropoff)),
  )

  for (let i = 0; i < restStopsBeforePickup; i++) {
    const progress = (i + 1) / (restStopsBeforePickup + 1)
    const restStopCoordinates = interpolateCoordinates(currentCoordinates, pickupCoordinates, progress)

    // Add driving segment
    const segmentDrivingTime = drivingTimeToPickup / (restStopsBeforePickup + 1)
    currentTime = addHours(currentTime, segmentDrivingTime)

    waypoints.push({
      type: restStops[i].type === "break" ? "break" : "rest",
      location: `${restStops[i].type === "break" ? "Break" : "Rest"} Stop ${i + 1}`,
      coordinates: restStopCoordinates,
      duration: restStops[i].duration,
      arrivalTime: format(currentTime, "h:mm a"),
    })

    // Add rest duration
    currentTime = addHours(currentTime, restStops[i].duration)
    waypoints[waypoints.length - 1].departureTime = format(currentTime, "h:mm a")
  }

  // Final segment to pickup
  const remainingDrivingTimeToPickup =
    drivingTimeToPickup -
    fuelStopsToPickup * (drivingTimeToPickup / (fuelStopsToPickup + 1)) -
    restStopsBeforePickup * (drivingTimeToPickup / (restStopsBeforePickup + 1))

  currentTime = addHours(currentTime, remainingDrivingTimeToPickup)

  // Pickup location
  waypoints.push({
    type: "pickup",
    location: pickupLocation,
    coordinates: pickupCoordinates,
    duration: 1, // 1 hour for pickup
    arrivalTime: format(currentTime, "h:mm a"),
  })

  // Add pickup duration
  currentTime = addHours(currentTime, 1)
  waypoints[waypoints.length - 1].departureTime = format(currentTime, "h:mm a")

  // Update current coordinates
  currentCoordinates = pickupCoordinates

  // Generate waypoints to dropoff
  const dropoffCoordinates = generateMockCoordinates(dropoffLocation)

  // Add fuel stops to dropoff
  for (let i = 0; i < fuelStopsToDropoff; i++) {
    const progress = (i + 1) / (fuelStopsToDropoff + 1)
    const fuelStopCoordinates = interpolateCoordinates(currentCoordinates, dropoffCoordinates, progress)

    // Add driving segment
    const segmentDrivingTime = drivingTimeToDropoff / (fuelStopsToDropoff + 1)
    currentTime = addHours(currentTime, segmentDrivingTime)

    waypoints.push({
      type: "fuel",
      location: `Fuel Stop ${fuelStopsToPickup + i + 1}`,
      coordinates: fuelStopCoordinates,
      duration: FUEL_STOP_DURATION,
      arrivalTime: format(currentTime, "h:mm a"),
    })

    // Add fuel stop duration
    currentTime = addHours(currentTime, FUEL_STOP_DURATION)
    waypoints[waypoints.length - 1].departureTime = format(currentTime, "h:mm a")
  }

  // Add remaining rest stops
  for (let i = restStopsBeforePickup; i < restStops.length; i++) {
    const progress = (i - restStopsBeforePickup + 1) / (restStops.length - restStopsBeforePickup + 1)
    const restStopCoordinates = interpolateCoordinates(currentCoordinates, dropoffCoordinates, progress)

    // Add driving segment
    const segmentDrivingTime = drivingTimeToDropoff / (restStops.length - restStopsBeforePickup + 1)
    currentTime = addHours(currentTime, segmentDrivingTime)

    waypoints.push({
      type: restStops[i].type === "break" ? "break" : "rest",
      location: `${restStops[i].type === "break" ? "Break" : "Rest"} Stop ${i + 1}`,
      coordinates: restStopCoordinates,
      duration: restStops[i].duration,
      arrivalTime: format(currentTime, "h:mm a"),
    })

    // Add rest duration
    currentTime = addHours(currentTime, restStops[i].duration)
    waypoints[waypoints.length - 1].departureTime = format(currentTime, "h:mm a")
  }

  // Final segment to dropoff
  const remainingDrivingTimeToDropoff =
    drivingTimeToDropoff -
    fuelStopsToDropoff * (drivingTimeToDropoff / (fuelStopsToDropoff + 1)) -
    (restStops.length - restStopsBeforePickup) * (drivingTimeToDropoff / (restStops.length - restStopsBeforePickup + 1))

  currentTime = addHours(currentTime, remainingDrivingTimeToDropoff)

  // Dropoff location
  waypoints.push({
    type: "dropoff",
    location: dropoffLocation,
    coordinates: dropoffCoordinates,
    duration: 1, // 1 hour for dropoff
    arrivalTime: format(currentTime, "h:mm a"),
  })

  // Add dropoff duration
  currentTime = addHours(currentTime, 1)
  waypoints[waypoints.length - 1].departureTime = format(currentTime, "h:mm a")

  // End point (same as dropoff)
  waypoints.push({
    type: "end",
    location: dropoffLocation,
    coordinates: dropoffCoordinates,
    arrivalTime: format(currentTime, "h:mm a"),
  })

  return waypoints
}

function generateMockCoordinates(location: string) {
  // In a real app, this would use a geocoding API
  // For demo, generate coordinates based on string hash
  const hash = location.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

  // Generate coordinates roughly within continental US
  const lat = 35 + (hash % 10) + Math.random() * 5
  const lng = -100 + (hash % 30) + Math.random() * 10

  return [lat, lng] as [number, number]
}

function interpolateCoordinates(start: [number, number], end: [number, number], progress: number) {
  return [start[0] + (end[0] - start[0]) * progress, start[1] + (end[1] - start[1]) * progress] as [number, number]
}

function generateLogEntriesForDay(waypoints, dayStart, dayEnd, dayIndex) {
  const entries = []
  const startHour = dayIndex === 0 ? 0 : 0 // Start at midnight except first day
  let currentHour = startHour

  // Simplified log generation for demo
  // In a real app, this would be based on the actual waypoints and times

  if (dayIndex === 0) {
    // First day typically starts with pre-trip inspection
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + 0.5),
      status: "on-duty",
      location: waypoints[0].location,
      remarks: "Pre-trip inspection",
    })

    currentHour += 0.5

    // Start driving
    const drivingDuration = Math.min(4, 24 - currentHour)
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + drivingDuration),
      status: "driving",
      location: `En route to ${waypoints.find((wp) => wp.type === "pickup")?.location || "destination"}`,
      remarks: "Driving",
    })

    currentHour += drivingDuration

    // Break
    if (currentHour < 24) {
      entries.push({
        startTime: formatHour(currentHour),
        endTime: formatHour(currentHour + 0.5),
        status: "off-duty",
        location: "Rest area",
        remarks: "Required 30-minute break",
      })

      currentHour += 0.5
    }

    // More driving if time permits
    if (currentHour < 24) {
      const remainingDriving = Math.min(6, 24 - currentHour)
      entries.push({
        startTime: formatHour(currentHour),
        endTime: formatHour(currentHour + remainingDriving),
        status: "driving",
        location: `En route to ${waypoints.find((wp) => wp.type === "pickup")?.location || "destination"}`,
        remarks: "Driving",
      })

      currentHour += remainingDriving
    }

    // Rest for remainder of day
    if (currentHour < 24) {
      entries.push({
        startTime: formatHour(currentHour),
        endTime: "24:00",
        status: "sleeper",
        location: "Truck stop",
        remarks: "Rest period",
      })
    }
  } else if (dayIndex === Math.ceil(differenceInHours(dayEnd, dayStart) / 24) - 1) {
    // Last day

    // Start with sleeper berth
    entries.push({
      startTime: "00:00",
      endTime: formatHour(2),
      status: "sleeper",
      location: "Truck stop",
      remarks: "Rest period",
    })

    currentHour = 2

    // Pre-trip inspection
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + 0.5),
      status: "on-duty",
      location: "Truck stop",
      remarks: "Pre-trip inspection",
    })

    currentHour += 0.5

    // Driving to final destination
    const finalDriving = Math.min(5, 24 - currentHour)
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + finalDriving),
      status: "driving",
      location: `En route to ${waypoints.find((wp) => wp.type === "dropoff")?.location || "destination"}`,
      remarks: "Driving",
    })

    currentHour += finalDriving

    // Delivery
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + 1),
      status: "on-duty",
      location: waypoints.find((wp) => wp.type === "dropoff")?.location || "destination",
      remarks: "Unloading/delivery",
    })

    currentHour += 1

    // Post-trip
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + 0.5),
      status: "on-duty",
      location: waypoints.find((wp) => wp.type === "dropoff")?.location || "destination",
      remarks: "Post-trip inspection",
    })

    currentHour += 0.5

    // Off duty for remainder
    if (currentHour < 24) {
      entries.push({
        startTime: formatHour(currentHour),
        endTime: "24:00",
        status: "off-duty",
        location: waypoints.find((wp) => wp.type === "dropoff")?.location || "destination",
        remarks: "Off duty",
      })
    }
  } else {
    // Middle days - typical driving day

    // Start with sleeper berth
    entries.push({
      startTime: "00:00",
      endTime: formatHour(6),
      status: "sleeper",
      location: "Truck stop",
      remarks: "Rest period",
    })

    currentHour = 6

    // Pre-trip inspection
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + 0.5),
      status: "on-duty",
      location: "Truck stop",
      remarks: "Pre-trip inspection",
    })

    currentHour += 0.5

    // First driving segment
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + 5),
      status: "driving",
      location: "En route",
      remarks: "Driving",
    })

    currentHour += 5

    // Fuel stop
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + 0.5),
      status: "on-duty",
      location: "Fuel station",
      remarks: "Fueling",
    })

    currentHour += 0.5

    // Break
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + 0.5),
      status: "off-duty",
      location: "Fuel station",
      remarks: "Required 30-minute break",
    })

    currentHour += 0.5

    // Second driving segment
    const remainingDriving = Math.min(5, 24 - currentHour)
    entries.push({
      startTime: formatHour(currentHour),
      endTime: formatHour(currentHour + remainingDriving),
      status: "driving",
      location: "En route",
      remarks: "Driving",
    })

    currentHour += remainingDriving

    // Rest for remainder of day
    if (currentHour < 24) {
      entries.push({
        startTime: formatHour(currentHour),
        endTime: "24:00",
        status: "sleeper",
        location: "Truck stop",
        remarks: "Rest period",
      })
    }
  }

  return entries
}

function formatHour(hour: number) {
  const hours = Math.floor(hour)
  const minutes = Math.round((hour - hours) * 60)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

function parseTimeToHours(timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours + minutes / 60
}

