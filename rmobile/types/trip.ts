export interface Coordinates {
  lat: number
  lng: number
}

export interface Waypoint {
  id: number
  type: "start" | "pickup" | "dropoff" | "fuel" | "rest" | "break" | "end"
  location: string
  latitude: number
  longitude: number
  duration?: number
  arrival_time?: string
  departure_time?: string
  sequence: number
}

export interface LogEntry {
  id: number
  start_time: string
  end_time: string
  status: "driving" | "on-duty" | "off-duty" | "sleeper"
  location: string
  remarks: string
}

export interface LogSheet {
  id: number
  date: string
  driver_name: string
  truck_number: string
  starting_location: string
  ending_location: string
  total_driving_hours: number
  total_on_duty_hours: number
  total_off_duty_hours: number
  total_sleeper_hours: number
  entries: LogEntry[]
}

export interface Trip {
  id: number
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_hours: number
  total_distance: number
  total_driving_time: number
  total_trip_time: number
  start_date: string
  end_date: string
  created_at: string
  waypoints: Waypoint[]
  log_sheets: LogSheet[]
}

export interface TripFormData {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_hours: number
}

