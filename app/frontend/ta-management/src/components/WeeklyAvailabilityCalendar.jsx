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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function convertProfileAvailabilityGridToKeys(availabilityObj) {
  const result = [];

  if (!availabilityObj) return result;

  // Case 1: Already in transformed array format (e.g., ["Monday-8-top"]) which is the case in ProfilePage
  if (Array.isArray(availabilityObj)) {
    const isAlreadyFormatted = availabilityObj.every(
      (key) => typeof key === "string" && /^[A-Z][a-z]+-\d{1,2}-(top|bottom)$/.test(key)
    );
    if (isAlreadyFormatted) {
      console.log("case 1: already formatted");
      return availabilityObj;
    }
    return result;
  }

  // Case 2: Check if it's inside an object as `availability_grid`
  const grid = availabilityObj.availability_grid;
  if (!grid) {
    console.log("case 2: does not have a grid");
    return result;
  }

  const isAlreadyFormatted = Array.isArray(grid) && grid.every(
    (key) => typeof key === "string" && /^[A-Z][a-z]+-\d{1,2}-(top|bottom)$/.test(key)
  );
  if (isAlreadyFormatted) return grid;

  for (const day in grid) {
    const slots = grid[day];
    const capitalizedDay = capitalize(day); // e.g., "monday" → "Monday"

    for (const time of slots) {
      const timeMatch = time.match(/^(\d+):(\d+)(am|pm)$/i);
      if (!timeMatch) continue;

      let [_, hourStr, minuteStr, period] = timeMatch;
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      if (period.toLowerCase() === "pm" && hour !== 12) {
        hour += 12;
      } else if (period.toLowerCase() === "am" && hour === 12) {
        hour = 0;
      }

      let suffix = "top"; // assume :00 = top, :30 = bottom
      if (minute === 30) suffix = "bottom";

      if (!isNaN(hour) && (suffix === "top" || suffix === "bottom")) {
        result.push(`${capitalizedDay}-${hour}-${suffix}`);
      }
    }
  }
  console.log("result from convertProfileAvailabilityGridToKeys is being returned as: ", result);
  return result;
}


// Converts a string like "MTh: 08:00–10:00" into keys like "Monday-8-top", "Thursday-8-top", etc.
function convertSlotRangeToKeys(slotString) {
  const dayMap = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    Th: "Thursday",
    F: "Friday",
  };

  // Handle "Th" before "T" to avoid overlap
  const dayAbbreviations = Object.keys(dayMap).sort((a, b) => b.length - a.length);

  // Split the slot string into day part and time range part
  const [dayPart, timeRange] = slotString.split(": ");
  if (!dayPart || !timeRange) return [];

  // Extract all matching day abbreviations from the dayPart string
  let remaining = dayPart;
  const matchedDays = [];
  for (const abbrev of dayAbbreviations) {
    if (remaining.includes(abbrev)) {
      matchedDays.push(dayMap[abbrev]);
      remaining = remaining.replace(abbrev, ""); // Remove matched abbrev
    }
  }

  if (matchedDays.length === 0) return [];

  // Extract start and end times
  const [startTime, endTime] = timeRange.split("–");
  if (!startTime || !endTime) return [];

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const result = [];

  // For each matched day, generate slot keys
  for (const day of matchedDays) {
    let hour = startHour;
    let half = startMin === 0 ? "top" : "bottom";

    while (hour < endHour || (hour === endHour && half === "top" && endMin > 0)) {
      result.push(`${day}-${hour}-${half}`);
      if (half === "top") {
        half = "bottom";
      } else {
        hour++;
        half = "top";
      }
    }
  }

  return result;
}


//converts M: 8:00-10:00 to Monday-8-top and so on
function convertTimeSlotsInfoToKeys(time_slots_info) {
  const result = []

  for (const slot of time_slots_info) {
    const day = capitalize(slot.day) // e.g., "tuesday" → "Tuesday"
    const [startHour, startMin] = slot.start_time.split(":").map(Number)
    const [endHour, endMin] = slot.end_time.split(":").map(Number)

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
  const [selectedSlots, setSelectedSlots] = useState(
    new Set(convertProfileAvailabilityGridToKeys(availability))
  )
  //const highlightedSet = new Set(highlightedSlots.flatMap(convertSlotRangeToKeys));
  console.log("highlightedSlots in WeeklyAvailabilityCalendar: ", highlightedSlots);
  const highlightedSet = new Set(
    highlightedSlots.flatMap(slot => {
      if (typeof slot === "string" && slot.includes(":")) {
        // Format like "M: 08:00–10:00"
        return convertSlotRangeToKeys(slot);
      } else if (typeof slot === "string") {
        // Already in "Monday-8-top" format
        return [slot];
      } else if (
        typeof slot === "object" &&
        slot.start_time &&
        slot.end_time &&
        slot.day
      ) {
        // It's a time_slots_info object
        return convertTimeSlotsInfoToKeys([slot]);
      } else {
        return [];
      }
    })
  );
  console.log("higlightedSet in WeeklyAvailabilityCalendar is: ", highlightedSet);
  
  // Sync internal state with incoming props
  useEffect(() => {
    setSelectedSlots(new Set(convertProfileAvailabilityGridToKeys(availability)))
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