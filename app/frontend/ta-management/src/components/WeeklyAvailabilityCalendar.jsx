import React, { useState } from "react"
import "./WeeklyAvailabilityCalendar.css"


const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const startHour = 8
const endHour = 21

// Generate 30-minute slots from each hour (e.g., 08:00 and 08:30)
const generateTimeSlots = () => {
  const slots = []
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`)
  }
  return slots
}

const WeeklyAvailabilityCalendar = () => {
  const [selectedSlots, setSelectedSlots] = useState(new Set())

  const toggleSlot = (day, hour, half) => {
    const key = `${day}-${hour}-${half}`
    const updated = new Set(selectedSlots)
    if (updated.has(key)) {
      updated.delete(key)
    } else {
      updated.add(key)
    }
    setSelectedSlots(updated)
  }

  const isSelected = (day, hour, half) =>
    selectedSlots.has(`${day}-${hour}-${half}`)

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
              <td className="border p-2">{hour}</td>
              {days.map((day) => {
                const hourNum = parseInt(hour.split(":")[0])
                return (
                  <td key={day} className="border p-0">
                    <div className="flex flex-col h-full">
                      {/* Top Half - :00 to :30 */}
                      <div
                        className={`h-5 cursor-pointer ${
                          isSelected(day, hourNum, "top") ? "bg-blue-400" : "hover:bg-blue-100"
                        } border-b`}
                        onClick={() => toggleSlot(day, hourNum, "top")}
                      />
                      {/* Bottom Half - :30 to :00 */}
                      <div
                        className={`h-5 cursor-pointer ${
                          isSelected(day, hourNum, "bottom") ? "bg-blue-400" : "hover:bg-blue-100"
                        }`}
                        onClick={() => toggleSlot(day, hourNum, "bottom")}
                      />
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
