import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import clsx from "clsx"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const startHour = 8
const endHour = 21
const slotDurationMinutes = 30

function generateTimeSlots() {
  const slots = []
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`)
    slots.push(`${hour.toString().padStart(2, "0")}:30`)
  }
  return slots
}

const timeSlots = generateTimeSlots()

export default function WeeklyAvailabilityCalendar() {
  const [selectedSlots, setSelectedSlots] = useState(new Set())

  const toggleSlot = (day, time) => {
    const key = `${day}-${time}`
    const newSelected = new Set(selectedSlots)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedSlots(newSelected)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Availability</CardTitle>
        <Label>Select your available time slots</Label>
      </CardHeader>
      <CardContent className="overflow-auto">
        <div className="grid grid-cols-[80px_repeat(5,minmax(0,1fr))]">
          {/* Header Row */}
          <div></div>
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center font-medium border-b py-2">
              {day}
            </div>
          ))}

          {/* Time slots */}
          {timeSlots.map((time) => (
            <>
              <div
                key={time + "-label"}
                className="text-right pr-2 border-r py-1 text-sm text-muted-foreground"
              >
                {time}
              </div>
              {daysOfWeek.map((day) => {
                const slotKey = `${day}-${time}`
                const isSelected = selectedSlots.has(slotKey)
                return (
                  <div
                    key={slotKey}
                    className={clsx(
                      "h-8 border cursor-pointer hover:bg-gray-300",
                      isSelected ? "bg-blue-500" : "bg-gray-100"
                    )}
                    onClick={() => toggleSlot(day, time)}
                    title={`${day}, ${time}`}
                  ></div>
                )
              })}
            </>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
