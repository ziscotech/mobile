"use client"

import { useEffect, useState } from "react"
import type { Trip } from "@/types/trip"

export default function MapWithLeaflet({ route }: { route: Trip }) {
  const [error, setError] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Only run this on the client
    if (typeof window === "undefined") return

    const loadMap = async () => {
      try {
        // Dynamically import Leaflet and React-Leaflet
        const L = (await import("leaflet")).default
        const { MapContainer, TileLayer, Marker, Popup, Polyline } = await import("react-leaflet")

        // Fix Leaflet default icon
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        })

        setMapLoaded(true)
      } catch (e) {
        console.error("Error loading map libraries:", e)
        setError("Failed to load map libraries")
      }
    }

    loadMap()

    // Load Leaflet CSS
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  if (error) {
    return (
      <div className="h-[500px] w-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-red-500 font-semibold">{error}</p>
          <p className="mt-2">Please try again later or contact support.</p>
        </div>
      </div>
    )
  }

  if (!mapLoaded) {
    return (
      <div className="h-[500px] w-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading map...</p>
        </div>
      </div>
    )
  }

  // This is a placeholder - the actual map rendering will happen after dynamic imports
  // The component will re-render once mapLoaded is true
  return (
    <div className="h-[500px] w-full bg-gray-100 flex items-center justify-center">
      <p>Map should appear here...</p>
    </div>
  )
}

