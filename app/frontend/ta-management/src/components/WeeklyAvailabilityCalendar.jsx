import React, { useEffect, useState } from "react"
import "./WeeklyAvailabilityCalendar.css"

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const startHour = 8
const endHour = 22

// Generate time slots per hour
const generateTimeSlots = () => {
  const slots = []
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`)
  }
  return slots
}

function convertSlotRangeToKeys(slotString) {
  const dayMap = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    R: "Thursday",
    F: "Friday",
  }

  // Example: "M: 08:00–10:00"
  const [dayAbbrev, timeRange] = slotString.split(": ")
  const [startTime, endTime] = timeRange.split("–")

  const day = dayMap[dayAbbrev]
  if (!day) return [] // Invalid day

  const [startHour, startMin] = startTime.split(":").map(Number)
  const [endHour, endMin] = endTime.split(":").map(Number)

  const result = []
  let hour = startHour
  let half = startMin === 0 ? "top" : "bottom"

  while (hour < endHour || (hour === endHour && (half === "top" && endMin > 0))) {
    result.push(`${day}-${hour}-${half}`)
    if (half === "top") {
      half = "bottom"
    } else {
      hour++
      half = "top"
    }
  }

  return result
}


const WeeklyAvailabilityCalendar = ({
  mode = "profile", // New prop: "profile" or "allocation"
  editable = false,
  availability = [],
  setAvailability = () => {},
  highlightedSlots = [], // New optional prop for red overlay
}) => {
  const [selectedSlots, setSelectedSlots] = useState(new Set(availability))
  const highlightedSet = new Set(highlightedSlots.flatMap(convertSlotRangeToKeys));
  console.log("higlightedSet in WeeklyAvailabilityCalendar is: ", highlightedSet);
  
  // Sync internal state with incoming props
  useEffect(() => {
    setSelectedSlots(new Set(availability))
  }, [availability])

  // Function to handle slot selection in editable mode
  const toggleSlot = (day, hour, half) => {
    const key = `${day}-${hour}-${half}`
    const updated = new Set(selectedSlots)
    if (updated.has(key)) {
      updated.delete(key)
    } else {
      updated.add(key)
    }
    setSelectedSlots(updated)
    setAvailability(Array.from(updated)) // Sync to parent
  }

  const isSelected = (day, hour, half) => selectedSlots.has(`${day}-${hour}-${half}`)
  const isHighlighted = (day, hour, half) => highlightedSet.has(`${day}-${hour}-${half}`)

  const timeSlots = generateTimeSlots()

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse w-full text-center text-sm">
        <thead>
          <tr>
            <th className="border p-2 w-20 text-center align-middle">Time</th>
            {days.map((day) => (
              <th key={day} className="border p-2">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((hour) => (
            <tr key={hour} className="h-10">
              <td className="border p-2 text-center align-middle">{hour}</td>
              {days.map((day) => {
                const hourNum = parseInt(hour.split(":")[0])
                return (
                  <td key={day} className="border p-0">
                    <div className="flex flex-col h-full">
                      {/* --- Top Half-Hour Slot --- */}
                      <div
                        className="relative h-5 border-b"
                        onClick={() => editable && toggleSlot(day, hourNum, "top")}
                      >
                        {/* Layer 1: Blue background for TA availability */}
                        {isSelected(day, hourNum, "top") && (
                          <div className="absolute inset-0 bg-blue-400"></div>
                        )}
                        {/* Layer 2: Red overlay for course schedule (Allocation Mode Only) */}
                        {mode === 'allocation' && isHighlighted(day, hourNum, "top") && (
                          <div className="absolute inset-0 bg-red-500 opacity-50"></div>
                        )}
                        {/* Layer 3: Hover effect (Profile/Editable Mode Only) */}
                        {editable && (
                          <div className="absolute inset-0 cursor-pointer hover:bg-blue-100"></div>
                        )}
                      </div>

                      {/* --- Bottom Half-Hour Slot --- */}
                      <div
                        className="relative h-5"
                        onClick={() => editable && toggleSlot(day, hourNum, "bottom")}
                      >
                        {/* Layer 1: Blue background for TA availability */}
                        {isSelected(day, hourNum, "bottom") && (
                          <div className="absolute inset-0 bg-blue-400"></div>
                        )}
                        {/* Layer 2: Red overlay for course schedule (Allocation Mode Only) */}
                        {mode === 'allocation' && isHighlighted(day, hourNum, "bottom") && (
                          <div className="absolute inset-0 bg-red-500 opacity-50"></div>
                        )}
                        {/* Layer 3: Hover effect (Profile/Editable Mode Only) */}
                        {editable && (
                          <div className="absolute inset-0 cursor-pointer hover:bg-blue-100"></div>
                        )}
                      </div>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default WeeklyAvailabilityCalendar