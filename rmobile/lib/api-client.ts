import type { Trip, TripFormData } from "@/types/trip"

// Get the API URL from environment variables or use a fallback for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// For debugging
console.log("API URL:", API_BASE_URL)

// Authentication helper
const getAuthHeaders = () => {
  // For client-side only
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
  return {}
}

export async function calculateRoute(tripData: TripFormData): Promise<Trip> {
  try {
    console.log("Calculating route with data:", tripData)
    console.log("Sending request to:", `${API_BASE_URL}/trips/`)

    const response = await fetch(`${API_BASE_URL}/trips/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(tripData),
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      let errorMessage = "Failed to calculate route"
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.detail || errorMessage
      } catch (e) {
        // If we can't parse the JSON, just use the status text
        errorMessage = `${errorMessage}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("Route data received:", data)
    return data
  } catch (error) {
    console.error("API error:", error)
    throw error
  }
}

// Other API functions remain the same...
export async function getTrips(): Promise<Trip[]> {
  const response = await fetch(`${API_BASE_URL}/trips/`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch trips")
  }

  return response.json()
}

export async function getTripById(id: string): Promise<Trip> {
  const response = await fetch(`${API_BASE_URL}/trips/${id}/`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch trip details")
  }

  return response.json()
}

// Authentication functions
export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error("Login failed")
  }

  const data = await response.json()

  // Store token in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", data.access)
    localStorage.setItem("refresh_token", data.refresh)
  }

  return data
}

export async function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("refresh_token")
  }
}

