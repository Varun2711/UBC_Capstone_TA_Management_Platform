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
    console.warn("Access token not found in sessionStorage");
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Fetch student assignments
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
    return response.data;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw error;
  }
};

// Helper function to transform assignment data for calendar display
export const transformAssignmentsToCalendarEvents = (assignments) => {
  if (!assignments || !Array.isArray(assignments)) {
    return [];
  }

  const events = [];

  assignments.forEach((assignment) => {
    // Get offer items from the assignment's offer details
    const offerItems = assignment.offer_details?.offer_items || [];

    console.log("We're here in assignment mapper", offerItems);

    // Process each offer item (since one assignment can have multiple time slots)
    offerItems.forEach((offerItem, index) => {
      const timeSlot = offerItem.time_slot;

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
          const [endHour, endMinute] = timeSlot.end_time.split(":").map(Number);

          // Determine course information from offer item
          let courseInfo = "";
          let sessionType = "";

          if (offerItem.item_type === "course_offering") {
            courseInfo = `${offerItem.course_number} - ${offerItem.section_number}`;
            sessionType = "Course";
          } else if (offerItem.item_type === "shared_session") {
            courseInfo = `${offerItem.course_number} - ${offerItem.section_number}`;
            sessionType = "Lab";
          }

          //console.log("Course info", courseInfo);
          //console.log("sessionType", sessionType);

          // Create recurring events for the assignment period
          // Start from the assignment date and go for a reasonable academic period
          //this needs be updated to the term span or atleast teaching time span
          const assignmentStartDate = new Date(assignment.assigned_date);
          const today = new Date();

          // Create events for a range that covers past, present, and future
          // Go back 4 months and forward 8 months to cover academic terms
          const startRange = new Date(
            Math.min(
              assignmentStartDate.getTime(),
              today.getTime() - 2 * 30 * 24 * 60 * 60 * 1000
            )
          );
          const endRange = new Date(
            today.getTime() + 2 * 30 * 24 * 60 * 60 * 1000
          );

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
            // Limit to 2 years max
            // Only create events if the assignment is active or if it's within a reasonable range
            const eventDate = new Date(currentDate);

            const startTime = new Date(eventDate);
            startTime.setHours(startHour, startMinute, 0, 0);

            const endTime = new Date(eventDate);
            endTime.setHours(endHour, endMinute, 0, 0);

            events.push({
              id: `${assignment.assignment_id}-${index}-${eventDate.getTime()}`, // Unique ID for each occurrence
              title: `${courseInfo}`,
              sessionType: `${sessionType}`,
              start: startTime,
              end: endTime,
              resource: {
                assignment: assignment,
                offerItem: offerItem,
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

// Format assignment for display
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

      // Collect time slots
      if (item.time_slot) {
        timeSlots.push(item.time_slot);
      }
    });

    courseInfo = Array.from(courseNumbers).join(", ");
    sectionNumber = Array.from(sectionNumbers).join(", ");
    sessionType = Array.from(sessionTypes).join(" + ");
  }

  // Fallback to assignment level data if offer items not available
  if (!courseInfo && assignment.course) {
    courseInfo = assignment.course.course_number;
    totalHours = assignment.weekly_hours || 0;

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

  return {
    courseCode: courseInfo,
    courseName: assignment.course?.course_name || "Unknown Course",
    sectionNumber,
    sessionType,
    timeSlots, // Array of time slot objects
    instructor,
    weeklyHours: totalHours,
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
};
