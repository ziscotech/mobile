"use client"

import { useRef, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import type { LogSheet as LogSheetType } from "@/types/trip"

interface LogSheetProps {
  logData: LogSheetType
}

export default function LogSheet({ logData }: LogSheetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up dimensions
    const width = canvas.width
    const height = canvas.height
    const hourWidth = width / 24
    const statusHeight = height / 4

    // Draw grid
    ctx.strokeStyle = "#ddd"
    ctx.lineWidth = 1

    // Vertical lines (hours)
    for (let i = 0; i <= 24; i++) {
      const x = i * hourWidth
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()

      // Hour labels
      if (i < 24) {
        ctx.fillStyle = "#666"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.fillText(`${i}:00`, x + hourWidth / 2, height - 5)
      }
    }

    // Horizontal lines (status types)
    const statusTypes = ["Off Duty", "Sleeper", "Driving", "On Duty"]
    for (let i = 0; i <= 4; i++) {
      const y = i * statusHeight
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()

      // Status labels
      if (i < 4) {
        ctx.fillStyle = "#666"
        ctx.font = "10px Arial"
        ctx.textAlign = "left"
        ctx.fillText(statusTypes[i], 5, y + statusHeight / 2 + 3)
      }
    }

    // Draw log entries
    logData.entries.forEach((entry) => {
      // Parse times
      const startHour = parseTimeToHours(entry.start_time)
      const endHour = parseTimeToHours(entry.end_time)

      // Calculate positions
      const startX = startHour * hourWidth
      const endX = endHour * hourWidth

      // Determine y position based on status
      let statusIndex
      switch (entry.status) {
        case "off-duty":
          statusIndex = 0
          break
        case "sleeper":
          statusIndex = 1
          break
        case "driving":
          statusIndex = 2
          break
        case "on-duty":
          statusIndex = 3
          break
        default:
          statusIndex = 0
      }

      const y = statusIndex * statusHeight

      // Draw rectangle for the entry
      ctx.fillStyle = getStatusColor(entry.status)
      ctx.fillRect(startX, y, endX - startX, statusHeight)

      // Draw border
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 1
      ctx.strokeRect(startX, y, endX - startX, statusHeight)
    })

    // Draw summary at the bottom
    ctx.fillStyle = "#000"
    ctx.font = "bold 12px Arial"
    ctx.textAlign = "left"
    ctx.fillText(
      `Total Hours: Driving: ${logData.total_driving_hours}, On Duty: ${logData.total_on_duty_hours}, Off Duty: ${logData.total_off_duty_hours}, Sleeper: ${logData.total_sleeper_hours}`,
      10,
      height - 20,
    )
  }, [logData, mounted])

  // Helper function to convert time string to hours
  const parseTimeToHours = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours + minutes / 60
  }

  // Helper function to get color for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "driving":
        return "rgba(255, 99, 71, 0.7)" // Tomato
      case "on-duty":
        return "rgba(255, 165, 0, 0.7)" // Orange
      case "off-duty":
        return "rgba(144, 238, 144, 0.7)" // Light green
      case "sleeper":
        return "rgba(135, 206, 250, 0.7)" // Light sky blue
      default:
        return "rgba(200, 200, 200, 0.7)" // Light gray
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p>
            <strong>Driver:</strong> {logData.driver_name}
          </p>
          <p>
            <strong>Date:</strong> {logData.date}
          </p>
          <p>
            <strong>Truck #:</strong> {logData.truck_number}
          </p>
        </div>
        <div>
          <p>
            <strong>Starting Location:</strong> {logData.starting_location}
          </p>
          <p>
            <strong>Ending Location:</strong> {logData.ending_location}
          </p>
        </div>
      </div>

      <Card className="p-4">
        <canvas ref={canvasRef} width={800} height={200} className="w-full h-auto border border-gray-300" />
      </Card>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logData.entries.map((entry, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.start_time} - {entry.end_time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(entry.status)}`}>
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Helper function to get status class
function getStatusClass(status: string) {
  switch (status) {
    case "driving":
      return "bg-red-100 text-red-800"
    case "on-duty":
      return "bg-orange-100 text-orange-800"
    case "off-duty":
      return "bg-green-100 text-green-800"
    case "sleeper":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

