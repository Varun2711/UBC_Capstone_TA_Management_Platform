import axios from "axios";

const API_URL = "http://localhost:8080/api";

// Create axios instance with base configuration
const instance = axios.create({
  baseURL: API_URL,
});

// Helper function to get the auth headers
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("accessToken");
  if (!token) {
    //console.warn("Access token not found in sessionStorage");
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

//helper function that returns the start and end dates for a term
const fetchTermDates = async (termId) => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(
      `/course-term-service/terms/${termId}`, // Fixed space in URL
      {
        headers,
      }
    );
    // console.log("Terms are here!", response.data);

    return {
      termStartDate: response.data.start,
      termEndDate: response.data.end,
      termDescription: response.data.description || response.data.name, // Add term description
    };

    // response.data.results;
  } catch (error) {
    console.error("Error fetching terms from API:", error);
    //console.log("Falling back to mock terms");
    return {
      termStartDate: new Date(),
      termEndDate: new Date(),
      termDescription: "Unknown Term",
    };
  }
};

// Fetch student assignments with term information
export const fetchStudentAssignments = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await instance.get(
      "/allocations/assignments/my_assignments/",
      {
        headers,
      }
    );
    console.log("Student assignments response:", response.data);

    // Enrich assignments with term information
    if (response.data && response.data.assignments) {
      const enrichedAssignments = await Promise.all(
        response.data.assignments.map(async (assignment) => {
          const termId = assignment.course_offering?.academic_term?.id;
          if (termId) {
            const termInfo = await fetchTermDates(termId);
            return {
              ...assignment,
              termInfo: termInfo,
            };
          }
          return assignment;
        })
      );

      return {
        ...response.data,
        assignments: enrichedAssignments,
      };
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw error;
  }
};

export const consolidateTimeSlots = (offerItem) => {
  const timeSlots =
    offerItem.all_time_slots ||
    (offerItem.time_slot ? [offerItem.time_slot] : []);

  if (timeSlots.length === 0) return [];

  // For shared sessions (labs/tutorials), consolidate multiple consecutive slots
  if (offerItem.item_type === "shared_session" && timeSlots.length > 1) {
    // Group slots by day
    const slotsByDay = timeSlots.reduce((acc, slot) => {
      const day = slot.day.toLowerCase();
      if (!acc[day]) acc[day] = [];
      acc[day].push(slot);
      return acc;
    }, {});

    const consolidatedSlots = [];

    // For each day, consolidate consecutive time slots
    Object.entries(slotsByDay).forEach(([day, daySlots]) => {
      if (daySlots.length === 1) {
        consolidatedSlots.push(daySlots[0]);
      } else {
        // Sort slots by start time
        const sortedSlots = daySlots.sort((a, b) =>
          a.start_time.localeCompare(b.start_time)
        );

        // Create consolidated slot with earliest start and latest end
        const consolidatedSlot = {
          ...sortedSlots[0], // Use first slot as base
          start_time: sortedSlots[0].start_time,
          end_time: sortedSlots[sortedSlots.length - 1].end_time,
          // Add indicator that this was consolidated
          _consolidated: true,
          _originalSlotCount: sortedSlots.length,
        };

        consolidatedSlots.push(consolidatedSlot);
      }
    });

    return consolidatedSlots;
  }

  // For course offerings, keep all time slots separate (e.g., MWF classes)
  return timeSlots;
};

// Helper function to transform assignment data for calendar display
export const transformAssignmentsToCalendarEvents = async (assignments) => {
  if (!assignments || !Array.isArray(assignments)) {
    return [];
  }

  const events = [];

  for (const assignment of assignments) {
    // Get offer items from the assignment's offer details
    const offerItems = assignment.offer_details?.offer_items || [];

    // console.log(
    //   "Here's the term id",
    //   assignment.course_offering.academic_term.id
    // );

    // Use the termInfo if it's already attached to the assignment, otherwise fetch it
    let termDates;
    if (assignment.termInfo) {
      termDates = assignment.termInfo;
    } else {
      termDates = await fetchTermDates(
        assignment.course_offering.academic_term.id
      );
    }

    //console.log("Here's the term info", termDates);
    // console.log("We're here in assignment mapper", offerItems);

    // Process each offer item (since one assignment can have multiple time slots)
    offerItems.forEach((offerItem, offerIndex) => {
      // Use all_time_slots instead of just time_slot

      const timeSlots = consolidateTimeSlots(offerItem);

      // Process each time slot for this offer item
      timeSlots.forEach((timeSlot, slotIndex) => {
        if (
          timeSlot &&
          timeSlot.day &&
          timeSlot.start_time &&
          timeSlot.end_time
        ) {
          // Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
          const dayMap = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6,
          };

          const dayNumber = dayMap[timeSlot.day.toLowerCase()];

          if (dayNumber !== undefined) {
            // Parse start and end times
            const [startHour, startMinute] = timeSlot.start_time
              .split(":")
              .map(Number);
            const [endHour, endMinute] = timeSlot.end_time
              .split(":")
              .map(Number);

            // Determine course information from offer item
            let courseInfo = "";
            let sessionType = "";

            if (offerItem.item_type === "course_offering") {
              courseInfo = `${offerItem.course_number} - ${offerItem.section_number}`;
              sessionType = "Course";
            } else if (offerItem.item_type === "shared_session") {
              courseInfo = `${offerItem.course_number} - ${offerItem.section_number}`;
              sessionType = offerItem.section_number.startsWith("L")
                ? "Lab"
                : "Tutorial";
            }

            //console.log("Course info", courseInfo);
            //console.log("sessionType", sessionType);

            // Create recurring events for the assignment period
            // Start from the assignment date
            const assignmentStartDate = new Date(assignment.assigned_date);
            const today = new Date();

            // Create events for a range that covers past, present, and future
            // Go back 2 months and forward 2 months to cover academic terms
            const startRange = new Date(termDates.termStartDate);
            const endRange = new Date(termDates.termEndDate);

            // Generate events for each week in the range
            let currentDate = new Date(startRange);

            // Find the first occurrence of the target day
            while (
              currentDate.getDay() !== dayNumber &&
              currentDate <= endRange
            ) {
              currentDate.setDate(currentDate.getDate() + 1);
            }

            let weekCount = 0;
            while (currentDate <= endRange && weekCount < 104) {
              const eventDate = new Date(currentDate);

              const startTime = new Date(eventDate);
              startTime.setHours(startHour, startMinute, 0, 0);

              const endTime = new Date(eventDate);
              endTime.setHours(endHour, endMinute, 0, 0);

              events.push({
                id: `${
                  assignment.assignment_id
                }-${offerIndex}-${slotIndex}-${eventDate.getTime()}`, // Updated unique ID
                title: `${courseInfo}`,
                sessionType: `${sessionType}`,
                start: startTime,
                end: endTime,
                resource: {
                  assignment: assignment,
                  offerItem: offerItem,
                  timeSlot: timeSlot, // Include the specific time slot
                  hours: offerItem.weekly_hours,
                  role: assignment.role,
                  location: timeSlot.location || "TBD",
                  isActive: assignment.is_active,
                },
              });

              // Move to next week
              currentDate.setDate(currentDate.getDate() + 7);
              weekCount++;
            }
          }
        }
      });
    });
  }
  //console.log(events);
  return events;
};

// Get assignment status and formatting
export const getAssignmentStatus = (assignment) => {
  if (!assignment.is_active) {
    return { status: "Inactive", variant: "secondary" };
  }

  return { status: "Active", variant: "default" };
};

// Format assignment for display - now synchronous since term info is pre-loaded
export const formatAssignmentDisplay = (assignment) => {
  let courseInfo = "";
  let sessionType = "";
  let sectionNumber = "";
  let timeSlots = [];
  let instructor = "";
  let totalHours = 0;

  // Get information from offer_details.offer_items
  const offerItems = assignment.offer_details?.offer_items || [];

  if (offerItems.length > 0) {
    // For multi-item assignments, we'll show combined info
    const courseNumbers = new Set();
    const sectionNumbers = new Set();
    const sessionTypes = new Set();

    offerItems.forEach((item) => {
      courseNumbers.add(item.course_number);
      sectionNumbers.add(item.section_number);
      totalHours += item.weekly_hours || 0;

      if (item.item_type === "course_offering") {
        sessionTypes.add("Course");
      } else if (item.item_type === "shared_session") {
        sessionTypes.add("Lab");
      }

      // Collect ALL time slots from all_time_slots
      if (item.all_time_slots && Array.isArray(item.all_time_slots)) {
        timeSlots.push(...item.all_time_slots);
      } else if (item.time_slot) {
        // Fallback to single time_slot if all_time_slots not available
        timeSlots.push(item.time_slot);
      }
    });

    courseInfo = Array.from(courseNumbers).join(", ");
    sectionNumber = Array.from(sectionNumbers).join(", ");
    sessionType = Array.from(sessionTypes).join(" + ");
  }

  instructor = assignment.course_offering?.instructor || "";

  // Fallback to assignment level data if offer items not available
  if (!courseInfo && assignment.course) {
    courseInfo = assignment.course.course_number;
    totalHours = assignment.weekly_hours || 0;
    //

    if (assignment.course_offering) {
      sectionNumber = assignment.course_offering.section_number;
      sessionType = "Course";
      instructor = assignment.course_offering.instructor || "";
    } else if (assignment.shared_session) {
      sectionNumber = assignment.shared_session.section_number;
      sessionType = assignment.shared_session.session_type || "Lab";
      instructor = assignment.shared_session.instructor || "";
    }
  }

  // Use the pre-loaded term information
  const termInfo = assignment.termInfo || {};

  return {
    courseCode: courseInfo,
    courseName: assignment.course?.course_name || "Unknown Course",
    sectionNumber,
    sessionType,
    timeSlots, // Now contains ALL time slots from all offer items
    instructor,
    weeklyHours: totalHours,
    term:
      assignment.course_offering?.academic_term?.description ||
      termInfo.termDescription,
    term_start: termInfo.termStartDate,
    term_end: termInfo.termEndDate,
    role: assignment.role,
    assignedDate: assignment.assigned_date,
    isActive: assignment.is_active,
    notes: assignment.notes,
    offerItems: offerItems, // Include original offer items for detailed display
  };
};

export default {
  fetchStudentAssignments,
  transformAssignmentsToCalendarEvents,
  getAssignmentStatus,
  formatAssignmentDisplay,
  consolidateTimeSlots,
};
