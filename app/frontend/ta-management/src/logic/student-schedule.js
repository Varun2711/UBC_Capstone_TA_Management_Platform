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

// Fetch student assignments - now uses assignment data directly
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

    // The assignments now come with assignment_term included, so we don't need to fetch it separately
    if (response.data && response.data.assignments) {
      // Group assignments by course offering if they have the same course_offering_id
      const groupedAssignments = groupAssignmentsByCourseOffering(
        response.data.assignments
      );

      return {
        ...response.data,
        assignments: groupedAssignments,
      };
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw error;
  }
};

// Group assignments that have the same course_offering_id, OR same course + same term
const groupAssignmentsByCourseOffering = (assignments) => {
  const grouped = {};
  const result = [];

  assignments.forEach((assignment) => {
    // Create a unique key for grouping
    let groupKey;

    if (assignment.course_offering) {
      // First try to group by course offering ID
      groupKey = `course_offering_${assignment.course_offering.course_offering_id}`;
    } else {
      // For shared sessions or when no course offering, group by course + term
      const courseId = assignment.course?.id || "unknown_course";
      const termId = assignment.assignment_term?.id || "unknown_term";
      groupKey = `course_term_${courseId}_${termId}`;
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        ...assignment,
        grouped_assignments: [assignment],
        total_weekly_hours: assignment.weekly_hours || 0,
        all_time_slots: assignment.time_slots || [],
      };
    } else {
      // Merge time slots and update hours
      grouped[groupKey].grouped_assignments.push(assignment);
      grouped[groupKey].total_weekly_hours += assignment.weekly_hours || 0;
      grouped[groupKey].all_time_slots = [
        ...grouped[groupKey].all_time_slots,
        ...(assignment.time_slots || []),
      ];
    }
  });

  // Now do a second pass to group by course + term for better UX
  const regrouped = {};

  Object.values(grouped).forEach((group) => {
    // Create a key based on course + term for final grouping
    const courseId = group.course?.id || "unknown_course";
    const termId = group.assignment_term?.id || "unknown_term";
    const finalGroupKey = `final_${courseId}_${termId}`;

    if (!regrouped[finalGroupKey]) {
      regrouped[finalGroupKey] = {
        ...group,
        grouped_assignments: [...group.grouped_assignments],
        total_weekly_hours: group.total_weekly_hours,
        all_time_slots: [...group.all_time_slots],
      };
    } else {
      // Merge multiple groups that share the same course + term
      regrouped[finalGroupKey].grouped_assignments.push(
        ...group.grouped_assignments
      );
      regrouped[finalGroupKey].total_weekly_hours += group.total_weekly_hours;
      regrouped[finalGroupKey].all_time_slots.push(...group.all_time_slots);
    }
  });

  // Convert back to array
  Object.values(regrouped).forEach((group) => {
    result.push(group);
  });

  return result;
};

// Updated function to get term dates from assignment_term
const getTermDatesFromAssignment = async (assignment) => {
  if (assignment.assignment_term) {
    // If we have full date info in assignment_term, use it
    if (assignment.assignment_term.start && assignment.assignment_term.end) {
      return {
        termStartDate: new Date(assignment.assignment_term.start),
        termEndDate: new Date(assignment.assignment_term.end),
        termDescription:
          assignment.assignment_term.description ||
          assignment.assignment_term.code,
      };
    }

    // Otherwise, fetch from the term service using the term ID
    if (assignment.assignment_term.id) {
      try {
        const termDates = await fetchTermDates(assignment.assignment_term.id);
        return termDates;
      } catch (error) {
        console.error("Error fetching term dates:", error);
      }
    }

    return {
      termStartDate: new Date(),
      termEndDate: new Date(),
      termDescription:
        assignment.assignment_term.description ||
        assignment.assignment_term.code,
    };
  }

  return {
    termStartDate: new Date(),
    termEndDate: new Date(),
    termDescription: "Unknown Term",
  };
};

// Updated consolidateTimeSlots to work with assignment time_slots and handle contiguous slots
export const consolidateTimeSlots = (assignment) => {
  const timeSlots = assignment.all_time_slots || assignment.time_slots || [];

  if (timeSlots.length === 0) return [];

  // Group slots by day first
  const slotsByDay = timeSlots.reduce((acc, slot) => {
    const day = (slot.day_code || slot.day || "").toLowerCase();
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  const consolidatedSlots = [];

  // For each day, consolidate consecutive time slots
  Object.entries(slotsByDay).forEach(([day, daySlots]) => {
    if (daySlots.length === 1) {
      // Single slot, no consolidation needed
      consolidatedSlots.push(daySlots[0]);
    } else {
      // Multiple slots on the same day - check if they're consecutive
      // Sort slots by start time
      const sortedSlots = daySlots.sort((a, b) => {
        const aTime = a.start_time.replace(":", "");
        const bTime = b.start_time.replace(":", "");
        return parseInt(aTime) - parseInt(bTime);
      });

      // Group consecutive slots
      const consecutiveGroups = [];
      let currentGroup = [sortedSlots[0]];

      for (let i = 1; i < sortedSlots.length; i++) {
        const currentSlot = sortedSlots[i];
        const previousSlot = currentGroup[currentGroup.length - 1];

        // Check if current slot starts when previous slot ends (consecutive)
        const previousEndTime = previousSlot.end_time;
        const currentStartTime = currentSlot.start_time;

        if (previousEndTime === currentStartTime) {
          // Consecutive - add to current group
          currentGroup.push(currentSlot);
        } else {
          // Not consecutive - start new group
          consecutiveGroups.push(currentGroup);
          currentGroup = [currentSlot];
        }
      }

      // Don't forget the last group
      consecutiveGroups.push(currentGroup);

      // Create consolidated slots for each group
      consecutiveGroups.forEach((group) => {
        if (group.length === 1) {
          // Single slot in group
          consolidatedSlots.push(group[0]);
        } else {
          // Multiple consecutive slots - consolidate them
          const consolidatedSlot = {
            ...group[0], // Use first slot as base
            start_time: group[0].start_time,
            end_time: group[group.length - 1].end_time,
            day: group[0].day || day.charAt(0).toUpperCase() + day.slice(1),
            day_code: group[0].day_code || day,
            // Add indicator that this was consolidated
            _consolidated: true,
            _originalSlotCount: group.length,
          };
          consolidatedSlots.push(consolidatedSlot);
        }
      });
    }
  });

  return consolidatedSlots;
};

// Helper function to transform assignment data for calendar display
export const transformAssignmentsToCalendarEvents = async (assignments) => {
  if (!assignments || !Array.isArray(assignments)) {
    return [];
  }

  const events = [];

  for (const assignment of assignments) {
    // Get term dates from assignment_term (now async)
    const termDates = await getTermDatesFromAssignment(assignment);

    // Get time slots from the assignment directly - handle both grouped and single assignments
    let timeSlots = [];

    if (
      assignment.grouped_assignments &&
      assignment.grouped_assignments.length > 0
    ) {
      // For grouped assignments, process each assignment separately but consolidate their time slots
      assignment.grouped_assignments.forEach((groupedAssignment) => {
        // Use consolidateTimeSlots to merge consecutive slots for each assignment
        const consolidatedSlots = consolidateTimeSlots(groupedAssignment);
        timeSlots.push(...consolidatedSlots);
      });
    } else {
      // For single assignments, consolidate their time slots
      timeSlots = consolidateTimeSlots(assignment);
    }

    console.log(
      "Processing assignment:",
      assignment.assignment_id,
      "Consolidated time slots:",
      timeSlots
    );

    // Process each consolidated time slot for this assignment
    timeSlots.forEach((timeSlot, slotIndex) => {
      if (
        timeSlot &&
        (timeSlot.day || timeSlot.day_code) &&
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

        const dayCode = (timeSlot.day_code || timeSlot.day || "").toLowerCase();
        const dayNumber = dayMap[dayCode];

        console.log(
          "Processing time slot:",
          timeSlot,
          "Day code:",
          dayCode,
          "Day number:",
          dayNumber
        );

        if (dayNumber !== undefined) {
          // Parse start and end times - handle both HH:MM and HH:MM:SS formats
          const startTimeParts = timeSlot.start_time.split(":").map(Number);
          const endTimeParts = timeSlot.end_time.split(":").map(Number);

          const startHour = startTimeParts[0];
          const startMinute = startTimeParts[1] || 0;
          const endHour = endTimeParts[0];
          const endMinute = endTimeParts[1] || 0;

          // Determine course information from assignment
          let courseInfo = "";
          let sessionType = "";

          if (assignment.course_offering) {
            courseInfo = `${assignment.course.course_number} - ${assignment.course_offering.section_number}`;
            sessionType = "Course";
          } else if (assignment.shared_session) {
            courseInfo = `${assignment.course.course_number} - ${assignment.shared_session.section_number}`;
            sessionType = assignment.shared_session.section_number.startsWith(
              "L"
            )
              ? "Lab"
              : "Tutorial";
          }

          // Use proper term start and end dates for event generation
          const startRange = new Date(termDates.termStartDate);
          const endRange = new Date(termDates.termEndDate);

          console.log("Term range:", startRange, "to", endRange);

          // Generate events for each week in the range
          let currentDate = new Date(startRange);

          // Find the first occurrence of the target day within the term
          while (
            currentDate.getDay() !== dayNumber &&
            currentDate <= endRange
          ) {
            currentDate.setDate(currentDate.getDate() + 1);
          }

          console.log("First occurrence of", dayCode, "is:", currentDate);

          let weekCount = 0;
          const maxWeeks = 26; // Academic term is typically ~16-20 weeks, 26 is safe upper bound

          while (currentDate <= endRange && weekCount < maxWeeks) {
            const eventDate = new Date(currentDate);

            const startTime = new Date(eventDate);
            startTime.setHours(startHour, startMinute, 0, 0);

            const endTime = new Date(eventDate);
            endTime.setHours(endHour, endMinute, 0, 0);

            // Only create events that are within the term range
            if (eventDate >= startRange && eventDate <= endRange) {
              // Create unique ID that accounts for consolidated slots
              const eventId = timeSlot._consolidated
                ? `${
                    assignment.assignment_id
                  }-consolidated-${slotIndex}-${eventDate.getTime()}`
                : `${
                    assignment.assignment_id
                  }-${slotIndex}-${eventDate.getTime()}`;

              events.push({
                id: eventId,
                title: `${courseInfo}`,
                sessionType: `${sessionType}`,
                start: startTime,
                end: endTime,
                resource: {
                  assignment: assignment,
                  timeSlot: timeSlot,
                  hours: assignment.weekly_hours,
                  role: assignment.role,
                  location: timeSlot.location || "TBD",
                  isActive: assignment.is_active,
                  isConsolidated: timeSlot._consolidated || false,
                  originalSlotCount: timeSlot._originalSlotCount || 1,
                },
              });
            }

            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
            weekCount++;
          }
        } else {
          console.warn(
            "Invalid day code:",
            dayCode,
            "for time slot:",
            timeSlot
          );
        }
      } else {
        console.warn("Invalid time slot data:", timeSlot);
      }
    });
  }

  console.log("Generated", events.length, "calendar events");
  return events;
};

// Get assignment status and formatting
export const getAssignmentStatus = (assignment) => {
  if (!assignment.is_active) {
    return { status: "Inactive", variant: "secondary" };
  }

  return { status: "Active", variant: "default" };
};

// Updated format assignment display to use assignment data directly
export const formatAssignmentDisplay = (assignment) => {
  let courseInfo = "";
  let sessionType = "";
  let sectionNumber = "";
  let timeSlots = [];
  let instructor = "";
  let totalHours =
    assignment.total_weekly_hours || assignment.weekly_hours || 0;

  // Get basic course information from assignment
  if (assignment.course) {
    courseInfo = assignment.course.course_number;
  }

  // For grouped assignments, we'll show the course info from the main assignment
  // but collect instructors from all assignments
  const instructors = new Set();

  if (
    assignment.grouped_assignments &&
    assignment.grouped_assignments.length > 0
  ) {
    // Collect instructors from all grouped assignments
    assignment.grouped_assignments.forEach((groupedAssignment) => {
      if (groupedAssignment.course_offering?.instructor) {
        instructors.add(groupedAssignment.course_offering.instructor);
      }
      if (groupedAssignment.shared_session?.instructor) {
        instructors.add(groupedAssignment.shared_session.instructor);
      }
    });

    // Collect time slots from all grouped assignments
    assignment.grouped_assignments.forEach((groupedAssignment) => {
      const slots = groupedAssignment.time_slots || [];
      timeSlots.push(...slots);
    });
  } else {
    // For single assignments
    if (assignment.course_offering?.instructor) {
      instructors.add(assignment.course_offering.instructor);
    }
    if (assignment.shared_session?.instructor) {
      instructors.add(assignment.shared_session.instructor);
    }
    timeSlots = assignment.all_time_slots || assignment.time_slots || [];
  }

  // Get section and instructor information from the main assignment
  if (assignment.course_offering) {
    sectionNumber = assignment.course_offering.section_number;
    sessionType = "Course";
  } else if (assignment.shared_session) {
    sectionNumber = assignment.shared_session.section_number;
    sessionType =
      assignment.shared_session.session_type === "lab" ? "Lab" : "Tutorial";
  }

  instructor = Array.from(instructors).join(", ");

  // Get term information from assignment_term
  const termInfo = assignment.assignment_term || {};

  return {
    courseCode: courseInfo,
    courseName: assignment.course?.course_name || "Unknown Course",
    sectionNumber,
    sessionType,
    timeSlots,
    instructor,
    weeklyHours: totalHours,
    term: termInfo.description || termInfo.code || "Unknown Term",
    term_start: termInfo.start || new Date(),
    term_end: termInfo.end || new Date(),
    role: assignment.role,
    assignedDate: assignment.assigned_date,
    isActive: assignment.is_active,
    notes: assignment.notes,
    groupedAssignments: assignment.grouped_assignments || [assignment],
  };
};

export default {
  fetchStudentAssignments,
  transformAssignmentsToCalendarEvents,
  getAssignmentStatus,
  formatAssignmentDisplay,
  consolidateTimeSlots,
};
