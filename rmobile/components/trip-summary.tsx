import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin, Fuel, Calendar, AlertTriangle } from "lucide-react"
import type { Trip } from "@/types/trip"

interface TripSummaryProps {
  route: Trip
}

export default function TripSummary({ route }: TripSummaryProps) {
  // Find key waypoints
  const startWaypoint = route.waypoints.find((wp) => wp.type === "start")
  const pickupWaypoint = route.waypoints.find((wp) => wp.type === "pickup")
  const dropoffWaypoint = route.waypoints.find((wp) => wp.type === "dropoff")
  const endWaypoint = route.waypoints.find((wp) => wp.type === "end")

  // Count fuel and rest stops
  const fuelStops = route.waypoints.filter((wp) => wp.type === "fuel").length
  const restStops = route.waypoints.filter((wp) => wp.type === "rest" || wp.type === "break").length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-500">Total Distance</p>
                <p className="font-semibold">{route.total_distance.toLocaleString()} miles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-500">Driving Time</p>
                <p className="font-semibold">{route.total_driving_time} hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-gray-500">Trip Duration</p>
              <p className="font-semibold">
                {new Date(route.start_date).toLocaleDateString()} to {new Date(route.end_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">Total: {route.total_trip_time} hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-500">Fuel Stops</p>
                <p className="font-semibold">{fuelStops}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-500">Required Rest Stops</p>
                <p className="font-semibold">{restStops}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Key Locations</h3>
        <div className="space-y-2">
          {route.waypoints
            .filter((wp) => ["start", "pickup", "dropoff", "end"].includes(wp.type))
            .map((waypoint, index) => (
              <div key={index} className="flex items-start gap-2 p-2 border-b">
                <MapPin className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="font-medium capitalize">{waypoint.type}</p>
                  <p className="text-sm text-gray-600">{waypoint.location}</p>
                  {waypoint.arrival_time && <p className="text-xs text-gray-500">Arrival: {waypoint.arrival_time}</p>}
                  {waypoint.departure_time && (
                    <p className="text-xs text-gray-500">Departure: {waypoint.departure_time}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

