import axios from "axios";

const COURSE_TERM_API_URL = 'http://localhost:8080/api/course-term-service';
const PROFILE_API_URL = 'http://localhost:8080/api/profile';
const ALLOCATIONS_API_URL = 'http://localhost:8080/api/allocations';

const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
  }
  return {};
};

export const parseTermCode = (termCode) => {
  if (!termCode) return null;
  
  const match = termCode.match(/^([WS])(\d{4})\s+(Term\s+(\d+)|Both\s+Terms)$/i);
  
  if (!match) return null;
  
  const seasonCode = match[1].toUpperCase();
  const year = parseInt(match[2]);
  const termPart = match[3];
  
  let term;
  if (termPart.toLowerCase().includes('both')) {
    term = 'Both';
  } else {
    const termMatch = termPart.match(/Term\s+(\d+)/);
    term = termMatch ? termMatch[1] : '1';
  }
  
  const season = seasonCode === 'W' ? 'Winter' : 'Summer';
  
  return {
    season,
    seasonCode,
    year,
    term,
    fullTerm: `${season} ${year} ${term === 'Both' ? 'Both Terms' : `Term ${term}`}`
  };
};

export const getAssignedStudents = async () => {
  const response = await axios.get(`${ALLOCATIONS_API_URL}/assignments/assigned_students/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getStudentAssignments = async (studentNumber) => {
  const response = await axios.get(`${ALLOCATIONS_API_URL}/assignments/by_student/`, {
    params: { student_number: studentNumber },
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getAllCoursesFullDetails = async () => {
  const response = await axios.get(`${COURSE_TERM_API_URL}/courses/all_full_details/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getTAsForCourseOffering = async (offeringId) => {
  const response = await axios.get(`${ALLOCATIONS_API_URL}/assignments/tas_by_offering/`, {
    params: { course_offering_id: offeringId },
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getTAsForSharedSession = async (sessionId) => {
  const response = await axios.get(`${ALLOCATIONS_API_URL}/assignments/tas_by_offering/`, {
    params: { shared_session_id: sessionId },
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getInstructors = async () => {
  const response = await axios.get(`${PROFILE_API_URL}/instructors/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getDepartments = async () => {
  const response = await axios.get(`${PROFILE_API_URL}/departments/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getSharedSessionDetails = async (sessionId) => {
  const response = await axios.get(`${COURSE_TERM_API_URL}/shared-sessions/${sessionId}/`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const convertTimeFormat = (timeString) => {
  if (!timeString) return '';
  
  const [startTime, endTime] = timeString.split(' - ');
  
  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    let hourNum = parseInt(hours, 10);
    
    if (modifier === 'AM' && hourNum === 12) {
      hourNum = 0;
    } else if (modifier === 'PM' && hourNum !== 12) {
      hourNum = hourNum + 12;
    }
    
    return `${hourNum.toString().padStart(2, '0')}:${minutes}`;
  };
  
  return `${convertTo24Hour(startTime)}-${convertTo24Hour(endTime)}`;
};

export const convertTo12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  const hour24 = parseInt(hours, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const modifier = hour24 >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${minutes} ${modifier}`;
};

export const calculateTimeSlotDuration = (timeString) => {
  if (!timeString) return 0;
  
  try {
    const converted = convertTimeFormat(timeString);
    const [startTime, endTime] = converted.split('-');
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const durationHours = durationMinutes / 60;
    
    return Math.round(durationHours * 10) / 10;
  } catch (error) {
    return 0;
  }
};

export const fetchAllStudentAssignments = async () => {
  try {
    const assignedStudents = await getAssignedStudents();

    const studentsWithAssignments = await Promise.all(
      assignedStudents.map(async (student) => {
        try {
          const assignments = await getStudentAssignments(student.student_number);
          
          return {
            ...student,
            assignments: assignments || []
          };
        } catch (error) {
          return {
            ...student,
            assignments: []
          };
        }
      })
    );

    return studentsWithAssignments;
  } catch (error) {
    throw error;
  }
};

export const transformStudentsToAssignmentFormat = (studentsData) => {
  return studentsData.map(student => {
    const totalWeeklyHours = student.assignments.reduce((total, assignment) => {
      return total + (assignment.weekly_hours || 0);
    }, 0);

    const yearlyAssignments = {};
    
    student.assignments.forEach(assignment => {
      let termCode, academicYear;
      
      if (assignment.course_offering && assignment.course_offering.academic_term) {
        termCode = assignment.course_offering.academic_term.code;
        academicYear = assignment.course_offering.academic_term.academicYear;
      } else if (assignment.shared_session && assignment.shared_session.academic_term) {
        termCode = assignment.shared_session.academic_term.code;
        academicYear = assignment.shared_session.academic_term.academicYear;
      } else {
        return;
      }

      const termData = parseTermCode(termCode);
      if (!termData) {
        return;
      }

      const year = termData.year.toString();
      
      if (!yearlyAssignments[year]) {
        yearlyAssignments[year] = {};
      }
      if (!yearlyAssignments[year][termCode]) {
        yearlyAssignments[year][termCode] = [];
      }

      let timeSlots = [{ day: 'TBD', startTime: 'TBD', endTime: 'TBD' }];
      
      if (assignment.time_slot) {
        timeSlots = [{
          day: assignment.time_slot.day,
          startTime: convertTo12Hour(assignment.time_slot.start_time + ':00'),
          endTime: convertTo12Hour(assignment.time_slot.end_time + ':00')
        }];
      }

      const assignmentEntry = {
        id: assignment.assignment_id,
        courseCode: assignment.course.course_number,
        courseName: assignment.course.course_name,
        section: assignment.course_offering ? assignment.course_offering.section_number : 
                assignment.shared_session ? assignment.shared_session.section_number : 'N/A',
        sectionType: assignment.shared_session ? 
          (assignment.shared_session.session_type ? 
            assignment.shared_session.session_type.charAt(0).toUpperCase() + assignment.shared_session.session_type.slice(1) : 'Lab') : 'Lecture',
        weekHours: assignment.weekly_hours || 0,
        instructor: assignment.course_offering ? assignment.course_offering.instructor : 
                   assignment.shared_session ? assignment.shared_session.instructor : 'Unknown',
        notes: assignment.notes,
        assignedDate: assignment.assigned_date,
        sharedSessionId: assignment.shared_session ? assignment.shared_session.shared_session_id : null,
        timeSlots: timeSlots
      };

      yearlyAssignments[year][termCode].push(assignmentEntry);
    });

    const transformedStudent = {
      id: student.id,
      studentId: student.student_number,
      studentName: student.name,
      email: student.email,
      studyLevel: student.study_level,
      totalWeeklyHours: totalWeeklyHours,
      maxHours: student.study_level === 'Graduate' ? 20 : 15,
      yearlyAssignments: yearlyAssignments,
      avatar: null
    };

    return transformedStudent;
  });
};

export const fetchAndEnrichStudentAssignments = async () => {
  try {
    const studentsData = await fetchAllStudentAssignments();
    
    const transformedStudents = transformStudentsToAssignmentFormat(studentsData);
    
    const enrichedStudents = await Promise.all(
      transformedStudents.map(async (student) => {
        const enrichedYearlyAssignments = {};
        
        for (const [year, yearData] of Object.entries(student.yearlyAssignments)) {
          enrichedYearlyAssignments[year] = {};
          
          for (const [termKey, assignments] of Object.entries(yearData)) {
            const enrichedAssignments = await Promise.all(
              assignments.map(async (assignment) => {
                if (assignment.sharedSessionId && 
                    assignment.timeSlots[0].day === 'TBD') {
                  try {
                    const sessionDetails = await getSharedSessionDetails(assignment.sharedSessionId);
                    
                    const timeSlot = sessionDetails.time_slots_info?.[0];
                    
                    if (timeSlot) {
                      return {
                        ...assignment,
                        timeSlots: [{
                          day: timeSlot.day_display,
                          startTime: convertTo12Hour(timeSlot.start_time.substring(0, 5)),
                          endTime: convertTo12Hour(timeSlot.end_time.substring(0, 5))
                        }]
                      };
                    }
                  } catch (error) {
                    // Continue with original assignment if error
                  }
                }
                
                return assignment;
              })
            );
            
            enrichedYearlyAssignments[year][termKey] = enrichedAssignments;
          }
        }
        
        return {
          ...student,
          yearlyAssignments: enrichedYearlyAssignments
        };
      })
    );
    
    return enrichedStudents;
  } catch (error) {
    throw error;
  }
};

export const fetchAllCourseAssignments = async () => {
  try {
    const allCourses = await getAllCoursesFullDetails();

    const instructors = await getInstructors();
    const instructorMap = new Map();
    instructors.forEach(instructor => {
      instructorMap.set(instructor.id, instructor.name);
    });

    const coursesWithAssignments = await Promise.all(
      allCourses.map(async (course) => {
        const offeringsWithTAs = await Promise.all(
          (course.offerings || []).map(async (offering) => {
            try {
              const taData = await getTAsForCourseOffering(offering.id);
              
              return {
                ...offering,
                assigned_tas: taData.assigned_tas || []
              };
            } catch (error) {
              return { ...offering, assigned_tas: [] };
            }
          })
        );

        const processedSharedSessions = {};
        
        for (const [termKey, termSessions] of Object.entries(course.sharedSessions || {})) {
          const processedTermSessions = { labs: [], tutorials: [], seminars: [], workshops: [] };
          
          for (const [sessionType, sessions] of Object.entries(termSessions)) {
            if (Array.isArray(sessions)) {
              const sessionsWithTAs = await Promise.all(
                sessions.map(async (session) => {
                  try {
                    const taData = await getTAsForSharedSession(session.id);
                    
                    return {
                      ...session,
                      assigned_tas: taData.assigned_tas || []
                    };
                  } catch (error) {
                    return { ...session, assigned_tas: [] };
                  }
                })
              );
              processedTermSessions[sessionType] = sessionsWithTAs;
            }
          }
          
          processedSharedSessions[termKey] = processedTermSessions;
        }

        return {
          ...course,
          offerings: offeringsWithTAs,
          sharedSessions: processedSharedSessions
        };
      })
    );

    return coursesWithAssignments;
  } catch (error) {
    throw error;
  }
};

export const transformCoursesToAssignmentFormat = (coursesData, instructors = []) => {
  const instructorMap = new Map();
  instructors.forEach(instructor => {
    instructorMap.set(instructor.id, instructor.name);
  });

  return coursesData.map(course => {
    const transformedCourse = {
      id: course.id,
      code: course.code,
      name: course.title,
      department: course.department,
      instructor: course.instructor || 'Unknown',
      yearlyOfferings: {}
    };

    (course.offerings || []).forEach(offering => {
      const termData = parseTermCode(offering.term);
      if (!termData) return;

      const year = termData.year.toString();
      const termKey = offering.term;

      if (!transformedCourse.yearlyOfferings[year]) {
        transformedCourse.yearlyOfferings[year] = {};
      }
      if (!transformedCourse.yearlyOfferings[year][termKey]) {
        transformedCourse.yearlyOfferings[year][termKey] = [];
      }

      (offering.time_slots || []).forEach((timeSlot, index) => {
        const calculatedHours = calculateTimeSlotDuration(timeSlot.time);
        
        const assignedTAsForTimeSlot = (offering.assigned_tas || []).filter(ta => {
          if (!ta.time_slot) return false;
          
          const taTimeConverted = convertTimeFormat(timeSlot.time);
          const [taStart, taEnd] = taTimeConverted.split('-');
          
          return (
            ta.time_slot.day === timeSlot.day &&
            ta.time_slot.start_time === taStart &&
            ta.time_slot.end_time === taEnd
          );
        });

        const timeSlotEntry = {
          id: `${offering.id}-slot-${index}`,
          type: "Lecture",
          section: `${offering.section} - ${timeSlot.day}`,
          sectionType: "Lecture",
          assignedTA: assignedTAsForTimeSlot.length > 0 ? assignedTAsForTimeSlot[0].student_name : null,
          studentId: assignedTAsForTimeSlot.length > 0 ? assignedTAsForTimeSlot[0].student_number : null,
          weekHours: assignedTAsForTimeSlot.length > 0 ? assignedTAsForTimeSlot[0].weekly_hours : calculatedHours,
          timeSlots: [{
            day: timeSlot.day,
            startTime: convertTo12Hour(convertTimeFormat(timeSlot.time).split('-')[0]),
            endTime: convertTo12Hour(convertTimeFormat(timeSlot.time).split('-')[1])
          }]
        };

        transformedCourse.yearlyOfferings[year][termKey].push(timeSlotEntry);
      });
    });

    Object.entries(course.sharedSessions || {}).forEach(([termKey, termSessions]) => {
      const termData = parseTermCode(termKey);
      if (!termData) return;

      const year = termData.year.toString();

      if (!transformedCourse.yearlyOfferings[year]) {
        transformedCourse.yearlyOfferings[year] = {};
      }
      if (!transformedCourse.yearlyOfferings[year][termKey]) {
        transformedCourse.yearlyOfferings[year][termKey] = [];
      }

      Object.entries(termSessions).forEach(([sessionType, sessions]) => {
        if (!Array.isArray(sessions)) return;

        sessions.forEach(session => {
          const sectionTypeMap = {
            'labs': 'Lab',
            'tutorials': 'Tutorial',
            'seminars': 'Seminar',
            'workshops': 'Workshop'
          };

          const assignedTAs = session.assigned_tas || [];
          
          const calculatedHours = calculateTimeSlotDuration(session.time);
          
          const sessionEntry = {
            id: session.id,
            type: sectionTypeMap[sessionType] || sessionType,
            section: session.section,
            sectionType: sectionTypeMap[sessionType] || sessionType,
            assignedTA: assignedTAs.length > 0 ? assignedTAs[0].student_name : null,
            studentId: assignedTAs.length > 0 ? assignedTAs[0].student_number : null,
            weekHours: assignedTAs.length > 0 ? assignedTAs[0].weekly_hours : calculatedHours,
            timeSlots: [{
              day: session.day,
              startTime: convertTo12Hour(convertTimeFormat(session.time).split('-')[0]),
              endTime: convertTo12Hour(convertTimeFormat(session.time).split('-')[1])
            }]
          };

          transformedCourse.yearlyOfferings[year][termKey].push(sessionEntry);
        });
      });
    });

    return transformedCourse;
  });
};

export const fetchAssignmentData = async () => {
  try {
    const [coursesData, instructors, departments] = await Promise.all([
      fetchAllCourseAssignments(),
      getInstructors(),
      getDepartments()
    ]);

    const enrichedStudents = await fetchAndEnrichStudentAssignments();

    const transformedCourses = transformCoursesToAssignmentFormat(coursesData, instructors);

    return {
      courses: transformedCourses,
      students: enrichedStudents,
      instructors,
      departments
    };
  } catch (error) {
    throw error;
  }
};

export const finalizeAllAllocations = async () => {
  try {
    const response = await axios.post(`${ALLOCATIONS_API_URL}/allocations-actions/finalize-all/`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};