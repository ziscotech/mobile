"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"

interface LocationSearchProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function LocationSearch({ id, value, onChange, placeholder }: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Common US cities for demo purposes
  const commonLocations = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Phoenix, AZ",
    "Philadelphia, PA",
    "San Antonio, TX",
    "San Diego, CA",
    "Dallas, TX",
    "San Jose, CA",
    "Austin, TX",
    "Jacksonville, FL",
    "Fort Worth, TX",
    "Columbus, OH",
    "Charlotte, NC",
    "San Francisco, CA",
    "Indianapolis, IN",
    "Seattle, WA",
    "Denver, CO",
    "Washington, DC",
    "Boston, MA",
    "El Paso, TX",
    "Nashville, TN",
    "Detroit, MI",
    "Oklahoma City, OK",
    "Portland, OR",
    "Las Vegas, NV",
    "Memphis, TN",
    "Louisville, KY",
    "Baltimore, MD",
    "Milwaukee, WI",
    "Albuquerque, NM",
    "Tucson, AZ",
    "Fresno, CA",
    "Sacramento, CA",
    "Kansas City, MO",
    "Long Beach, CA",
    "Mesa, AZ",
    "Atlanta, GA",
    "Colorado Springs, CO",
    "Raleigh, NC",
    "Omaha, NE",
    "Miami, FL",
    "Oakland, CA",
    "Minneapolis, MN",
    "Tulsa, OK",
    "Cleveland, OH",
    "Wichita, KS",
    "Arlington, TX",
    "New Orleans, LA",
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    onChange(inputValue)

    if (inputValue.length > 1) {
      const filtered = commonLocations
        .filter((location) => location.toLowerCase().includes(inputValue.toLowerCase()))
        .slice(0, 5)

      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full"
        onFocus={() => value.length > 1 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />

      {showSuggestions && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

