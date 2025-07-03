"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { Trip } from "@/types/trip"

// Dynamically import the Leaflet map component with no SSR
const MapWithLeaflet = dynamic(() => import("./map-with-leaflet"), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>,
})

// Fallback map component that doesn't use Leaflet
function FallbackMap({ route }: { route: Trip }) {
  return (
    <div className="h-[500px] w-full bg-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-lg font-semibold mb-2">Map Visualization</p>
          <p className="text-gray-600 mb-4">Interactive map not available in preview mode</p>

          <div className="bg-white p-4 rounded-lg shadow-md max-w-md mx-auto">
            <h3 className="font-bold text-lg mb-2">Route Summary</h3>
            <p>
              <strong>From:</strong> {route.current_location}
            </p>
            <p>
              <strong>To:</strong> {route.dropoff_location}
            </p>
            <p>
              <strong>Via:</strong> {route.pickup_location}
            </p>
            <p>
              <strong>Distance:</strong> {route.total_distance} miles
            </p>
            <p>
              <strong>Driving Time:</strong> {route.total_driving_time} hours
            </p>

            <div className="mt-4">
              <h4 className="font-semibold">Waypoints:</h4>
              <ul className="list-disc pl-5 mt-2">
                {route.waypoints.map((waypoint, index) => (
                  <li key={index} className="mb-1">
                    <span className="capitalize">{waypoint.type}</span>: {waypoint.location}
                    {waypoint.arrival_time && ` (Arrival: ${waypoint.arrival_time})`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MapComponent({ route }: { route: Trip }) {
  const [isClient, setIsClient] = useState(false)
  const [useLeaflet, setUseLeaflet] = useState(true)

  useEffect(() => {
    setIsClient(true)

    // Check if we can use Leaflet
    try {
      // This is a simple test to see if we're in an environment where Leaflet might work
      if (typeof window !== "undefined" && window.navigator) {
        setUseLeaflet(true)
      } else {
        setUseLeaflet(false)
      }
    } catch (e) {
      console.error("Error checking for Leaflet compatibility:", e)
      setUseLeaflet(false)
    }
  }, [])

  // If we're not on the client yet, show a loading state
  if (!isClient) {
    return <div className="h-[500px] w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
  }

  // If we can use Leaflet, use the dynamic import
  if (useLeaflet) {
    try {
      return <MapWithLeaflet route={route} />
    } catch (e) {
      console.error("Error rendering Leaflet map:", e)
      return <FallbackMap route={route} />
    }
  }

  // Otherwise, use the fallback
  return <FallbackMap route={route} />
}

