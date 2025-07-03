"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, MapPin, Clock, Calendar, AlertCircle } from "lucide-react"
import LogSheet from "@/components/log-sheet"
import TripSummary from "@/components/trip-summary"
import LocationSearch from "@/components/location-search"
import { calculateRoute } from "@/lib/api-client"
import type { Trip } from "@/types/trip"
import dynamic from "next/dynamic"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>,
})

// Mock data for development/preview when API is not available
const MOCK_TRIP_DATA: Trip = {
  id: 1,
  current_location: "Chicago, IL",
  pickup_location: "Detroit, MI",
  dropoff_location: "Cleveland, OH",
  current_cycle_hours: 20,
  total_distance: 450,
  total_driving_time: 8.5,
  total_trip_time: 12,
  start_date: "2023-11-15T08:00:00Z",
  end_date: "2023-11-15T20:00:00Z",
  created_at: "2023-11-14T12:00:00Z",
  waypoints: [
    {
      id: 1,
      type: "start",
      location: "Chicago, IL",
      latitude: 41.8781,
      longitude: -87.6298,
      sequence: 1,
      departure_time: "08:00",
    },
    {
      id: 2,
      type: "pickup",
      location: "Detroit, MI",
      latitude: 42.3314,
      longitude: -83.0458,
      sequence: 2,
      arrival_time: "12:30",
      departure_time: "13:30",
      duration: 1,
    },
    {
      id: 3,
      type: "rest",
      location: "Toledo, OH",
      latitude: 41.6528,
      longitude: -83.5379,
      sequence: 3,
      arrival_time: "15:00",
      departure_time: "16:00",
      duration: 1,
    },
    {
      id: 4,
      type: "dropoff",
      location: "Cleveland, OH",
      latitude: 41.4993,
      longitude: -81.6944,
      sequence: 4,
      arrival_time: "18:00",
      departure_time: "19:00",
      duration: 1,
    },
    {
      id: 5,
      type: "end",
      location: "Cleveland, OH",
      latitude: 41.4993,
      longitude: -81.6944,
      sequence: 5,
      arrival_time: "20:00",
    },
  ],
  log_sheets: [
    {
      id: 1,
      date: "2023-11-15",
      driver_name: "John Doe",
      truck_number: "T-12345",
      starting_location: "Chicago, IL",
      ending_location: "Cleveland, OH",
      total_driving_hours: 8.5,
      total_on_duty_hours: 2,
      total_off_duty_hours: 1.5,
      total_sleeper_hours: 0,
      entries: [
        {
          id: 1,
          start_time: "08:00",
          end_time: "12:30",
          status: "driving",
          location: "Chicago to Detroit",
          remarks: "Regular driving",
        },
        {
          id: 2,
          start_time: "12:30",
          end_time: "13:30",
          status: "on-duty",
          location: "Detroit, MI",
          remarks: "Loading cargo",
        },
        {
          id: 3,
          start_time: "13:30",
          end_time: "15:00",
          status: "driving",
          location: "Detroit to Toledo",
          remarks: "Regular driving",
        },
        {
          id: 4,
          start_time: "15:00",
          end_time: "16:00",
          status: "off-duty",
          location: "Toledo, OH",
          remarks: "Mandatory break",
        },
        {
          id: 5,
          start_time: "16:00",
          end_time: "18:00",
          status: "driving",
          location: "Toledo to Cleveland",
          remarks: "Regular driving",
        },
        {
          id: 6,
          start_time: "18:00",
          end_time: "19:00",
          status: "on-duty",
          location: "Cleveland, OH",
          remarks: "Unloading cargo",
        },
        {
          id: 7,
          start_time: "19:00",
          end_time: "20:00",
          status: "driving",
          location: "Cleveland local",
          remarks: "Driving to parking",
        },
      ],
    },
  ],
}

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState("")
  const [pickupLocation, setPickupLocation] = useState("")
  const [dropoffLocation, setDropoffLocation] = useState("")
  const [currentCycleHours, setCurrentCycleHours] = useState("0")
  const [route, setRoute] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("input")
  const [useMockData, setUseMockData] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (!currentLocation || !pickupLocation || !dropoffLocation) {
        throw new Error("Please fill in all location fields")
      }

      // Call the backend API
      const tripData = {
        current_location: currentLocation,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        current_cycle_hours: Number.parseFloat(currentCycleHours) || 0,
      }

      let routeData: Trip

      try {
        // Try to get data from the API
        routeData = await calculateRoute(tripData)
      } catch (apiError) {
        console.error("API Error:", apiError)

        // If we're in development or preview, use mock data
        if (process.env.NODE_ENV !== "production" || window.location.hostname.includes("vercel.app")) {
          console.log("Using mock data for development/preview")
          setUseMockData(true)
          routeData = MOCK_TRIP_DATA
        } else {
          // In production, rethrow the error
          throw apiError
        }
      }

      setRoute(routeData)
      setActiveTab("map")
    } catch (err) {
      console.error("Error calculating route:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentLocation("")
    setPickupLocation("")
    setDropoffLocation("")
    setCurrentCycleHours("0")
    setRoute(null)
    setActiveTab("input")
    setUseMockData(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center space-x-3">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">ELD Trip Planner</h1>
          </div>
          <p className="text-gray-600 mt-2">Plan your trips with automatic ELD compliance and log generation</p>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {useMockData && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Using Demo Data</AlertTitle>
            <AlertDescription className="text-yellow-700">
              The backend API is not available. Showing demo data for preview purposes.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="input">Trip Details</TabsTrigger>
            <TabsTrigger value="map" disabled={!route}>
              Route Map
            </TabsTrigger>
            <TabsTrigger value="logs" disabled={!route}>
              ELD Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input">
            <Card>
              <CardHeader>
                <CardTitle>Enter Trip Details</CardTitle>
                <CardDescription>
                  Provide your current location, pickup and dropoff points, and current cycle hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentLocation" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Current Location
                      </Label>
                      <LocationSearch
                        id="currentLocation"
                        value={currentLocation}
                        onChange={setCurrentLocation}
                        placeholder="Enter your current location"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pickupLocation" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Pickup Location
                      </Label>
                      <LocationSearch
                        id="pickupLocation"
                        value={pickupLocation}
                        onChange={setPickupLocation}
                        placeholder="Enter pickup location"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dropoffLocation" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Dropoff Location
                      </Label>
                      <LocationSearch
                        id="dropoffLocation"
                        value={dropoffLocation}
                        onChange={setDropoffLocation}
                        placeholder="Enter dropoff location"
                      />
                    </div>

                    <div>
                      <Label htmlFor="currentCycleHours" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Current Cycle Hours Used
                      </Label>
                      <Input
                        id="currentCycleHours"
                        type="number"
                        min="0"
                        max="70"
                        step="0.5"
                        value={currentCycleHours}
                        onChange={(e) => setCurrentCycleHours(e.target.value)}
                        placeholder="Enter hours used in current cycle (0-70)"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Calculating..." : "Calculate Route & Generate Logs"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            {route && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Route Map</CardTitle>
                    <CardDescription>Your route with required stops for rest, fuel, and ELD compliance</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">{route && <MapComponent route={route} />}</CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Trip Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TripSummary route={route} />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleReset}>
                      New Trip
                    </Button>
                    <Button onClick={() => setActiveTab("logs")}>View ELD Logs</Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs">
            {route && route.log_sheets && route.log_sheets.length > 0 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Electronic Logging Device (ELD) Records</CardTitle>
                    <CardDescription>Generated log sheets for your trip based on HOS regulations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {route.log_sheets.map((log, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Day {index + 1}: {log.date}
                          </h3>
                          <LogSheet logData={log} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("map")}>
                      Back to Map
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      New Trip
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

