"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Home,
  Plus,
  Settings,
  Users,
  CheckCircle,
  Eye,
  Filter
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppSidebar } from "../../components/scheduler-sidebar"
import WeeklyAvailabilityCalendar from "@/components/WeeklyAvailabilityCalendar"
import AddedOffersTab from "@/components/scheduler/allocation-page/AddedOffersTab"
import App from "@/App"
import { fetchCourses, fetchOfferingsForCourse, fetchSharedSessionsForCourse, fetchShortlistedApplicants, fetchProfilesOfShortlistedApplicants, fetchOffers, createOffer, fetchCourseOfferingDetails, fetchSharedSessionDetails, deleteOffer } from "@/logic/coordinator-allocations-page";

// Mock data for TAs
let availableTAs = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@university.edu",
    studentId: "SJ2024001",
    major: "Computer Science",
    year: "Graduate",
    gpa: "3.85",
    maxHours: 20,
    currentHours: 10,
    skills: ["Python", "Java", "JavaScript"],
    experience: ["COSC 101", "COSC 201"],
    availability: [
      "Monday-9-top", "Monday-10-bottom",
      "Wednesday-13-top", "Wednesday-14-top",
      "Wednesday-14-bottom","Wednesday-15-top",
      "Wednesday-15-bottom", "Friday-11-top", 
      "Friday-12-bottom","Wednesday-15-top",
      "Wednesday-15-bottom",
    ],
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Partially Allocated",
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "michael.chen@university.edu",
    studentId: "MC2024002",
    major: "Computer Science",
    year: "PhD",
    gpa: "3.92",
    maxHours: 20,
    currentHours: 10,
    skills: ["C++", "Python", "Machine Learning"],
    experience: ["COSC 301", "COSC 401"],
    availability: [
      "Tuesday-10-top", "Tuesday-11-top",
      "Wednesday-14-top", "Wednesday-14-bottom",
      "Thursday-14-top", "Thursday-14-bottom"
    ],
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Partially Allocated",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@university.edu",
    studentId: "ER2024003",
    major: "Computer Science",
    year: "Graduate",
    gpa: "3.78",
    maxHours: 10,
    currentHours: 10,
    skills: ["JavaScript", "React", "Node.js"],
    experience: ["COSC 102", "COSC 250"],
    availability: [
      "Monday-9-bottom", "Tuesday-10-top", "Wednesday-15-bottom"
    ],
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Fully Allocated",
  },
  {
    id: 4,
    name: "Abraham Lincoln",
    email: "abraham.lincoln@university.edu",
    studentId: "AL2354021",
    major: "Data Science",
    year: "Undergraduate",
    gpa: "3.80",
    maxHours: 20,
    currentHours: 0,
    skills: ["Tableau", "Power BI", "Pandas"],
    experience: ["DATA 101", "DATA 224"],
    availability: [
      "Monday-8-top", "Monday-8-bottom", "Monday-9-top", "Monday-9-bottom", "Monday-14-top", "Monday-14-bottom", "Monday-15-top", "Monday-15-bottom", "Tuesday-10-top", "Tuesday-10-bottom", "Wednesday-8-top", "Wednesday-8-bottom", "Wednesday-9-top", "Wednesday-9-bottom", "Friday-8-top", "Friday-8-bottom", "Friday-9-top", "Friday-9-bottom"
    ],
    avatar: "/placeholder.svg?height=40&width=40",
    status: "Not Allocated",
  },
]

// Mock data for courses
const mockCourses = [
  {
    id: 1,
    course_number: "COSC 101",
    course_name: "Introduction to Programming",
    instructor: "Dr. Smith",
    semester: "W2025 Term 1",
    sections: [
      {
        id: 1,
        type: "Lecture",
        section: "001",
        slots: [
          "Monday-9-top",
          "Monday-9-bottom",
          "Wednesday-9-top",
          "Wednesday-9-bottom",
          "Friday-9-top",
          "Friday-9-bottom",
        ],
        weekHours: 3,
        enrollment: 120,
        taRequired: 2,
        taAssigned: 1,
      },
      {
        id: 2,
        type: "Lab",
        section: "L01",
        slots: [
          "Monday-14-top",
          "Monday-14-bottom",
          "Monday-15-top",
          "Monday-15-bottom",
        ],
        weekHours: 2,
        enrollment: 25,
        taRequired: 1,
        taAssigned: 0,
      },
      {
        id: 3,
        type: "Lab",
        section: "L02",
        slots: [
          "Wednesday-14-top",
          "Wednesday-14-bottom",
          "Wednesday-15-top",
          "Wednesday-15-bottom",
        ],
        weekHours: 2,
        enrollment: 25,
        taRequired: 1,
        taAssigned: 0,
      },
    ],
    totalTARequired: 4,
    totalTAAssigned: 1,
    priority: "High",
  },
  {
    id: 2,
    course_number: "COSC 201",
    course_name: "Data Structures",
    instructor: "Dr. Johnson",
    semester: "S2025",
    sections: [
      {
        id: 4,
        type: "Lecture",
        section: "001",
        slots: [
          "Tuesday-11-top",
          "Tuesday-11-bottom",
          "Tuesday-12-top",
          "Thursday-11-top",
          "Thursday-11-bottom",
          "Thursday-12-top",
        ],
        weekHours: 3,
        enrollment: 80,
        taRequired: 2,
        taAssigned: 2,
      },
      {
        id: 5,
        type: "Lab",
        section: "L01",
        slots: [
          "Tuesday-15-top",
          "Tuesday-15-bottom",
          "Tuesday-16-top",
          "Tuesday-16-bottom",
        ],
        weekHours: 2,
        enrollment: 20,
        taRequired: 1,
        taAssigned: 1,
      },
    ],
    totalTARequired: 3,
    totalTAAssigned: 3,
    priority: "Medium",
  },
  {
    id: 3,
    course_number: "DATA 105",
    course_name: "Introduction to Data Analytics",
    instructor: "Dr. Surrey",
    semester: "W2025 Term 2",
    sections: [
      {
        id: 6,
        type: "Lecture",
        section: "001",
        slots: [
          "Monday-11-top",
          "Monday-11-bottom",
          "Tuesday-11-top",
          "Tuesday-11-bottom",
          "Thursday-11-top",
          "Thursday-11-bottom",
        ],
        weekHours: 3,
        enrollment: 80,
        taRequired: 2,
        taAssigned: 0,
      },
    ],
    totalTARequired: 3,
    totalTAAssigned: 3,
    priority: "Medium",
  },
]

function getStatusBadge(status) {
  switch (status) {
    case "Available":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
    case "Partially Allocated":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partially Allocated</Badge>
    case "Fully Allocated":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Fully Allocated</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getPriorityBadge(priority) {
  switch (priority) {
    case "High":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High Priority</Badge>
    case "Medium":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Priority</Badge>
    case "Low":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low Priority</Badge>
    default:
      return <Badge variant="secondary">{priority}</Badge>
  }
}
 
//converts Monday start time end time to Monday-8-top and so on
function convertTimeSlotsInfoToKeys(time_slots_info) {
  //console.log("time_slots_info in convertTimeSlotsInfoToKeys: ", time_slots_info);
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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
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
  //console.log("result from convertProfileAvailabilityGridToKeys is being returned as: ", result);
  return result;
}


export default function TAAllocationPage() {
  const [selectedTAId, setSelectedTAId] = useState(null)
  const [courses, setCourses] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all")
  const [courseFilterStatus, setCourseFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchTermForCourse, setSearchTermForCourse] = useState("")
  const [assignments, setAssignments] = useState([])
  const [taList, setTaList] = useState(availableTAs)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState(null)
  const [offers, setOffers] = useState([])
  const [offerSlotTimes, setOfferSlotTimes] = useState([]);
  const [addedOffers, setAddedOffers] = useState([])
  const [activeOffers, setActiveOffers] = useState([])
  const [showRescindModal, setShowRescindModal] = useState(false)
  const [offerToRescind, setOfferToRescind] = useState(null)
  const [filters, setFilters] = useState({
    discipline: "",
    term_code: "",
  });
  const [courseOfferings, setCourseOfferings] = useState({});
  const [sharedSessions, setSharedSessions] = useState({});
  const [fetchedOfferings, setFetchedOfferings] = useState({});
  const [shortlistedApplicants, setShortlistedApplicants] = useState([])
  const [profilesOfShortlistedApplicants, setProfilesOfShortlistedApplicants] = useState([])

  const [selectedCourseOfferings, setSelectedCourseOfferings] = useState([]);
  const [selectedSharedSessions, setSelectedSharedSessions] = useState([]);

  const [selectedApplication, setSelectedApplication] = useState([]);
  const [selectedTAProfile, setSelectedTAProfile ] = useState([]);
  const [studentCurrentHours, setStudentCurrentHours] = useState({});


  const selectedTA = shortlistedApplicants.find((item) => item.application.student.id === selectedTAId)
  //console.log("selectedTA main variable is: ", selectedTA);

  const handleAddTAtoAddedOfferTab = (selectedTA, selectedSections) => {
    setAddedOffers((prevOffers) => {
      const existingTA = prevOffers.find(
        (o) => o.taStudentId === selectedTA.application.student.id
      );

      const newOffers = selectedSections.map((section) => {
        const needsConversion = section.time_slots_info.some(slot => slot.includes(":"));

        return {
          course_number: section.course_number,
          course_name: section.course_name,
          sectionId: section.sectionId,
          section_number: section.section_number,
          section_type_display: section.section_type_display,
          slots: needsConversion
            ? convertTimeSlotsInfoToKeys(section.time_slots_info)
            : section.time_slots_info,
        };
      });

      if (existingTA) {
        const uniqueNewOffers = newOffers.filter(
          (newOffer) =>
            !existingTA.offers.some(
              (offer) =>
                offer.course_number === newOffer.course_number &&
                offer.sectionId === newOffer.sectionId
            )
        );
        if (uniqueNewOffers.length === 0) return prevOffers;

        return prevOffers.map((o) =>
          o.taStudentId === selectedTA.application.student.id
            ? { ...o, offers: [...o.offers, ...uniqueNewOffers] }
            : o
        );
      } else {
        return [
          ...prevOffers,
          {
            taName: selectedTA.application.student.name,
            taStudentId: selectedTA.application.student.id,
            offers: newOffers,
          },
        ];
      }
    });
  };


  const handleRescindOffer = async (offer_id) => {
    console.log("enter handleRescindOffer");
    console.log("about to delete offer with offer id ", offer_id);
    await deleteOffer(offer_id);
    console.log("deleteOffer has finished ");

    // Add a small delay (e.g., 500ms or 1000ms)
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second


    console.log("await fetchAndSetOffers is about to be called after rescinding");
    await fetchAndSetOffers();
    console.log("await fetchAndSetOffers has finished being called after rescinding");
  }

  const handleDeleteAssignment = (assignmentToDelete) => {
    setAssignments((prevAssignments) =>
      prevAssignments.filter(
        (a) =>
          !(
            a.taStudentId === assignmentToDelete.taStudentId &&
            a.course_number === assignmentToDelete.course_number &&
            a.section === assignmentToDelete.section
          )
      )
    )
    
    setAddedOffers((prevOffers) =>
    prevOffers.filter(
      (a) =>
        !(
          a.taStudentId === assignmentToDelete.taStudentId &&
          a.course_number === assignmentToDelete.course_number &&
          a.section === assignmentToDelete.section
        )
      )
    )

    // Update TA hours and status
    const ta = taList.find((ta) => ta.studentId === assignmentToDelete.taStudentId)
    const course = mockCourses.find((c) => c.course_number === assignmentToDelete.course_number)
    const section = course?.sections.find((s) => s.section === assignmentToDelete.section)

    if (ta && section) {
      const updatedTA = {
        ...ta,
        currentHours: Math.max(0, ta.currentHours - section.weekHours),
        status:
          Math.max(0, ta.currentHours - section.weekHours) === 0
            ? "Not Allocated"
            : "Partially Allocated",
      }

      setTaList((prevTAs) =>
        prevTAs.map((t) => (t.id === updatedTA.id ? updatedTA : t))
      )
    }
  }

  /*
  const isSectionAlreadyOfferedToTA = (taStudentId, sectionId) => {
    const taOffer = addedOffers.find((o) => o.taStudentId === taStudentId)
    //const taOffer = offers.find((o) => o.taStudentId === taStudentId)
    if (!taOffer) return false

    return taOffer.offers.some((offer) => String(offer.sectionId) === String(sectionId))
  }
  */

  const isSectionAlreadyOfferedToTA = (taStudentId, sectionId) => {
    //console.log("Offers in isSectionAlreadyOfferedToTA:", offers);
    const taOffer = offers.find((o) => o.student.id === taStudentId);
    if (!taOffer) return false;

    //console.log("taOffer in isSectionAlreadyOfferedToTA: ", taOffer);
    if (taOffer.status === "cancelled") return false;
    return taOffer.offer_items.some(
      (offerItem) =>
        String(offerItem.course_offering_id ?? offerItem.shared_session_id) === String(sectionId)
    );
  };


  //Adding emily to the list of assignments since she is already assigned to a course
  useEffect(() => {
    setAssignments((prevAssignments) => {
      const hasEmily = prevAssignments.some(
        (a) => a.taStudentId === "ER2024003"
      )
      if (hasEmily) return prevAssignments
      
      return [
      ...prevAssignments,
      {
        taName: "Emily Rodriguez",
        taStudentId: "ER2024003",
        course_number: "CS 201",
        course_name: "Data Structures",
        section: "L01",
        instructor: "Dr. Johnson",
        semester: "Spring 2024",
        type: "Lab",
        time: "T 3:00-5:00",
      },
      {
        taName: "Emily Rodriguez",
        taStudentId: "ER2024003",
        course_number: "CS 201",
        course_name: "Data Structures",
        section: "001",
        instructor: "Dr. Johnson",
        semester: "Spring 2024",
        type: "Lecture",
        time: "TTh 11:00-12:30",
      },
      {
        taName: "Emily Rodriguez",
        taStudentId: "ER2024003",
        course_number: "CS 101",
        course_name: "Introduction to Programming",
        section: "001",
        instructor: "Dr. Smith",
        semester: "Spring 2024",
        type: "Lecture",
        time: "MWF 9:00-10:00",
      },
      {
        taName: "Emily Rodriguez",
        taStudentId: "ER2024003",
        course_number: "CS 101",
        course_name: "Introduction to Programming",
        section: "L01",
        instructor: "Dr. Smith",
        semester: "Spring 2024",
        type: "Lab",
        time: "M 2:00-4:00",
      },
      ]
    })
  }, [])


  async function getAssignedAndOfferedSlotsForTA(taStudentId) {
    // Collect slots from assignments
    const assignmentSlots = assignments
      .filter(a => a.taStudentId === taStudentId)
      .flatMap(a => a.slots || []);

    // Collect slots from offers (fetch details for each offer item)
    const taOffers = offers.filter(o => o.student.id === taStudentId && o.status !== "cancelled");
    let offerSlots = [];

    for (const offer of taOffers) {
      for (const item of offer.offer_items) {
        if (item.course_offering_id) {
          const details = await fetchCourseOfferingDetails(item.course_offering_id);
          offerSlots.push(...(details?.time_slots_info ? convertTimeSlotsInfoToKeys(details.time_slots_info) : []));
        } else if (item.shared_session_id) {
          const details = await fetchSharedSessionDetails(item.shared_session_id);
          offerSlots.push(...(details?.time_slots_info ? convertTimeSlotsInfoToKeys(details.time_slots_info) : []));
        }
      }
    }
    // Combine all slots
    return [...assignmentSlots, ...offerSlots];
  }
  // Helper function to check for scheduling conflicts
  const checkForConflicts = async (availability, courseSlots, taStudentId) => {
    //console.log("In checkForConflicts, availability_grid: ", availability);
    //console.log("In checkForConflicts, courseSlots: ", courseSlots);
    const availabilitySet = new Set(convertProfileAvailabilityGridToKeys(availability));
    
    // Check if courseSlots are already in key format
    const needsConversion = courseSlots.some(slot => slot.includes(":"));
    //console.log("In checkForConflicts, needsConversion: ", needsConversion);
    
    const formattedTimeSlotsInfoToKeys = needsConversion
      ? convertTimeSlotsInfoToKeys(courseSlots)
      : courseSlots;

    // Get all slots already assigned to this TA
    const assignedAndOfferedSlots = new Set(await getAssignedAndOfferedSlotsForTA(taStudentId));

    //console.log("In checkForConflicts, availabilitySet: ", availabilitySet);
    //console.log("In checkForConflicts, selected courses's formattedTimeSlotsInfoToKeys: ", formattedTimeSlotsInfoToKeys);

    for (const slot of formattedTimeSlotsInfoToKeys) {
      if (availabilitySet.has(slot)) {
        return { conflict: true, type: "availability", slot }; // ❗️Conflict: TA not available at this time
      }

      if (assignedAndOfferedSlots.has(slot)) {
        return { conflict: true, type: "assignment", slot };
      }
    }

    return { conflict: false }; // ✅ All course slots are within TA availability and assignedAndOfferedSlots
  }

  const checkForConflictsWithinSelectedSections = (selectedSections) => {
    // For each section, get its slots and check against all other sections' slots
    for (let i = 0; i < selectedSections.length; i++) {
      const currentSection = selectedSections[i];
      const currentSlots = currentSection.time_slots_info || [];

      // Convert current section's slots if needed
      const needsConversion = currentSlots.some(slot => slot.includes(":"));
      const currentFormattedSlots = needsConversion 
        ? convertTimeSlotsInfoToKeys(currentSlots)
        : currentSlots;

      // Convert to Set for O(1) lookup
      const currentSlotsSet = new Set(currentFormattedSlots);

      // Check against all other sections
      for (let j = i + 1; j < selectedSections.length; j++) {
        const otherSection = selectedSections[j];
        const otherSlots = otherSection.time_slots_info || [];

        // Convert other section's slots if needed
        const otherNeedsConversion = otherSlots.some(slot => slot.includes(":"));
        const otherFormattedSlots = otherNeedsConversion
          ? convertTimeSlotsInfoToKeys(otherSlots)
          : otherSlots;

        // Check for any overlapping slots
        for (const slot of otherFormattedSlots) {
          if (currentSlotsSet.has(slot)) {
            return {
              conflict: true,
              sections: {
                section1: {
                  course_number: currentSection.course_number,
                  section_number: currentSection.section_number,
                  section_type_display: currentSection.section_type_display
                },
                section2: {
                  course_number: otherSection.course_number,
                  section_number: otherSection.section_number,
                  section_type_display: otherSection.section_type_display
                }
              },
              slot
            };
          }
        }
      }
    }

    return { conflict: false };
  };

  // Function to update TA hours after assignment
  const updateHours = (ta, course) => {
    const newHours = ta.currentHours + course.weekHours
    const newStatus = newHours >= ta.maxHours ? "Fully Allocated" : "Partially Allocated"

    const updatedTA = {
      ...ta,
      currentHours: newHours,
      status: newStatus,
    }

    setTaList((prevTAs) =>
      prevTAs.map((t) => (t.id === ta.id ? updatedTA : t))
    )

    setSelectedTAId(ta.id)
  }

  const dayAbbreviations = {
    monday: "M",
    tuesday: "T",
    wednesday: "W",
    thursday: "Th",
    friday: "F",
  }

  const timeStrToMinutes = (timeStr) => {
    const [hour, minute] = timeStr.split(":").map(Number);
    return hour * 60 + minute;
  };

  const minutesToTime = (mins) => {
    const hour = Math.floor(mins / 60).toString().padStart(2, "0");
    const minute = (mins % 60).toString().padStart(2, "0");
    return `${hour}:${minute}`;
  };

  //Converting backend time_slots_info to MW 8:00-10:00 for display in Course Selection Card
  const formatSlotsFromTimeInfo = (timeSlots = []) => {
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) return "No scheduled time";

    const groupedByDay = {};

    for (const slot of timeSlots) {
      const { day, start_time, end_time } = slot;
      if (!groupedByDay[day]) groupedByDay[day] = [];

      // Convert "08:00:00" → 480 minutes
      const startMins = timeStrToMinutes(start_time);
      const endMins = timeStrToMinutes(end_time);

      groupedByDay[day].push({ start: startMins, end: endMins });
    }

    // Sort each day's slots
    Object.values(groupedByDay).forEach(slots =>
      slots.sort((a, b) => a.start - b.start)
    );

    const dayLabels = Object.keys(groupedByDay).map(
      (day) => dayAbbreviations[day] || day
    );

    const allTimeRanges = Object.values(groupedByDay).map((slots) => {
      return [slots[0].start, slots[slots.length - 1].end];
    });

    const allSameTime =
      allTimeRanges.every(
        ([start, end]) =>
          start === allTimeRanges[0][0] && end === allTimeRanges[0][1]
      );

    if (allSameTime && dayLabels.length > 1) {
      const [startMins, endMins] = allTimeRanges[0];
      return `${dayLabels.join("")}: ${minutesToTime(startMins)}–${minutesToTime(endMins)}`;
    }

    // Fallback: day-by-day format
    return Object.keys(groupedByDay)
      .map((day) => {
        const slots = groupedByDay[day];
        const start = minutesToTime(slots[0].start);
        const end = minutesToTime(slots[slots.length - 1].end);
        return `${dayAbbreviations[day] || day}: ${start}–${end}`;
      })
      .join(" | ");
  };

  /*
  function getTotalHoursFromSlotString(slotString) {
    console.log("slotString in getTotalHoursFromSlotString: ", slotString);
    // Normalize en dash to regular dash
    slotString = slotString.replace(/–/g, "-");

    // Split only at the first colon
    const firstColonIndex = slotString.indexOf(":");

    if (firstColonIndex === -1) return 0;

    const dayPart = slotString.slice(0, firstColonIndex).trim(); // e.g., "MTh"
    const timeRange = slotString.slice(firstColonIndex + 1).trim(); // e.g., "08:00-10:00"

    // Handle day abbreviations including "Th"
    const days = [];
    for (let i = 0; i < dayPart.length; i++) {
      if (dayPart[i] === "T" && dayPart[i + 1] === "h") {
        days.push("Th");
        i++; // skip 'h'
      } else {
        days.push(dayPart[i]);
      }
    }

    const [startTime, endTime] = timeRange.split("-");

    if (!startTime || !endTime) return 0;

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const durationInMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const durationPerDay = durationInMinutes / 60;

    const total = days.length * durationPerDay;
    //console.log("result of getTotalHoursFromSlotString: ", total);
    return total;
  }
  */

  // Function to get assignments for a specific TA
  function getAssignmentsForTA(taName) {
  return assignments.filter((assignment) => assignment.taName === taName)
  }
  

  function getTotalHoursFromSlotArray(slotArray) {
    if (!Array.isArray(slotArray)) return 0;

    // Each slot like "Monday-8-top" is 30 minutes
    const slotDurationHours = 0.5;

    // Filter valid slot strings
    const validSlots = slotArray.filter(slot =>
      typeof slot === "string" && slot.match(/^[A-Za-z]+-\d+-(top|bottom)$/)
    );

    const totalHours = validSlots.length * slotDurationHours;
    return totalHours;
  }


  const filteredTAs = taList.filter((ta) => {
    const matchesSearch =
      ta.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ta.experience.some((exp) => exp.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ta.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ta.availability.some((day) => day.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ta.year.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || ta.status.toLowerCase().includes(filterStatus.toLowerCase())
    return matchesSearch && matchesFilter
  })

  const filteredShortlistedApplicants = shortlistedApplicants.filter((item) => {
    //console.log("In filteredShortlistedApplicants, shortlistedApplicants item from backend is: ", item);
    const matchesSearch =
      item.application.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.application.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.application.student.study_level.toLowerCase().includes(searchTerm.toLowerCase()) 
      //application.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
      //application.experience.some((exp) => exp.toLowerCase().includes(searchTerm.toLowerCase())) ||
      //application.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      //application.availability.some((day) => day.toLowerCase().includes(searchTerm.toLowerCase())) ||
      //application.year.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || ta.status.toLowerCase().includes(filterStatus.toLowerCase())
    return matchesSearch && matchesFilter
  })

  const totalTAs = taList.length
  const availableTACount = taList.filter((ta) => ta.status === "Available").length
  const totalCourses = mockCourses.length

  // Choose data source: use fetched courses if available, otherwise use mockCourses
  const courseDataToFilter = courses && courses.length > 0 ? courses : mockCourses;

  const filteredCourses = courseDataToFilter.filter((course) => {
    
    const matchesSearch =
      course.course_number.toLowerCase().includes(searchTermForCourse.toLowerCase()) ||
      course.course_name.toLowerCase().includes(searchTermForCourse.toLowerCase()) ||
      course.department_name.toLowerCase().includes(searchTermForCourse.toLowerCase()) 

    // Discipline filter logic
    const matchesDiscipline = filters.discipline
      ? course.course_number.startsWith(filters.discipline)
      : true;
      
    // ✅ Check offerings for matching term
    const courseOfferings = fetchedOfferings[course.id] || [];

    const matchesTerm = filters.term_code
      ? courseOfferings.some((offering) =>
          offering.term_info.toLowerCase().includes(filters.term_code.toLowerCase())
        )
      : true;
    
    return matchesSearch && matchesDiscipline && matchesTerm
  })

  // Function to handle changes in filter dropdowns
  const handleFilterChange = (filterName, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value,
    }));
  };

  // Function to clear all active filters
  const clearFilters = () => {
    setFilters({
      discipline: "",
      term_code: "",
    });
    setSearchTermForCourse("");
  };

  const termCodeOptions = [
    { value: "", label: "Select Term" },
    { value: "S2025", label: "S2025" },
    { value: "W2025 Term 1", label: "W2025 Term 1" },
    { value: "W2025 Term 2", label: "W2025 Term 2" },
  ];

  const disciplineOptions = [
    { value: "", label: "Select Discipline" },
    { value: "ASTR", label: "ASTR" },
    { value: "COSC", label: "COSC" },
    { value: "DATA", label: "DATA" },
    { value: "MATH", label: "MATH" },
    { value: "PHYS", label: "PHYS" },
    { value: "STAT", label: "STAT" },
  ];

  const getCourseOfferings = async (courseId) => {
    if (fetchedOfferings[courseId]) return; // already fetched

    try {
      const data = await fetchOfferingsForCourse(courseId);
      console.log(`fetchOfferingsforCourse called for course id ${courseId} is having data: `, data);
      setFetchedOfferings((prev) => ({
        ...prev,
        [courseId]: data,
      }));
    } catch (error) {
      console.error(`Failed to fetch offerings for course ${courseId}:`, error);
    }
  };

  /* 
    useEffect for getting course offerings for filtered courses. the getCourseOfferings functions
    stores the offerings in the fetchedOfferings state variable.
  */
  useEffect(() => {
    filteredCourses.forEach((course) => {
      getCourseOfferings(course.id);
    });
  }, [filteredCourses]);

  const fetchAndSetOffers = async () => {
    try {
      console.log("Refetching offers...");
      const fetchedOffers = await fetchOffers();
      console.log("fetchedOffers from backend are: ", fetchedOffers);
      setOffers(fetchedOffers || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Using Promise.all to run independent fetches concurrently
        await Promise.all([
          (async () => {
            const data = await fetchCourses();
            const fetchedCourses = data.results;
            //console.log("fetchedCourses from backend are: ", fetchedCourses);
            setCourses(fetchedCourses);

            // Fetch related data for each course
            for (const course of fetchedCourses) {
              const courseId = course.id;
              try {
                const [offerings, sharedSessions] = await Promise.all([
                  fetchOfferingsForCourse(courseId),
                  fetchSharedSessionsForCourse(courseId),
                ]);
                setCourseOfferings((prev) => ({ ...prev, [courseId]: offerings }));
                setSharedSessions((prev) => ({ ...prev, [courseId]: sharedSessions }));
              } catch (err) {
                console.error(`Error fetching data for course ${courseId}:`, err);
              }
            }
          })(),
          (async () => {
            const fetchedShortlistedApplicants = await fetchShortlistedApplicants();
            //console.log("fetchedShortlistedApplicants from backend are: ", fetchedShortlistedApplicants);
            setShortlistedApplicants(fetchedShortlistedApplicants);

            const profiles = await Promise.all(
              fetchedShortlistedApplicants.map(item =>
                fetchProfilesOfShortlistedApplicants(item.application.student.student_number)
                  .catch(err => {
                    console.error(`Error fetching profile for student ${item.application.student.student_number}:`, err);
                    return null; // Avoid crashing the whole process
                  })
              )
            );
            setProfilesOfShortlistedApplicants(profiles.filter(p => p !== null));
          })(),
          // offers
          fetchAndSetOffers(),
        ]);
      } catch (error) {
        console.error("Error loading initial page data:", error);
        // Fallback to mock data if needed
        setCourses(mockCourses);
        setShortlistedApplicants(availableTAs);
      }
    };

    loadInitialData();
  }, []);

  const selectedSections = [...selectedCourseOfferings, ...selectedSharedSessions];
  console.log("selectedSections got updated to: ", selectedSections);
  //When a new applicant is selected, the selected sections become unselected
  useEffect(() => {
    setSelectedCourseOfferings([]); 
    setSelectedSharedSessions([]);
  }, [selectedTA]);

  console.log("offers state variable RIGHT BEFORE fetchOfferSlotTimes useEffect is called: ", offers);
  console.log("selectedApplication RIGHT BEFORE fetchOfferSlotTimes useEffect is called: ", selectedApplication);
  useEffect(() => {
    const fetchOfferSlotTimes = async () => {
      console.log("fetchOfferSlotTimes has begun");
      if (!selectedApplication) {
        console.log("No selected application to fetch offer slot times for.");
        return;
      }

      const relevantOffers = offers.filter(
        (offer) => offer.student.id === selectedApplication?.application?.student?.id &&
        offer.status !== "cancelled"
      );
      console.log("relevantOffers for TA:", selectedApplication?.application?.student?.id, "are: ", relevantOffers);
      //console.log("Filtered Offers for TA:", relevantOffers);

      if (relevantOffers.length === 0) {
        setOfferSlotTimes([]); // No offers → clear times
        return;
      }

      const slotPromises = relevantOffers.flatMap((offer) =>
        offer.offer_items.map(async (item) => {
          //console.log("offer item in fetchOfferSlotTimes: ", item);
          //console.log("item.course_offering_id in fetchOfferSlotTimes: ", item.course_offering_id);
          //console.log("item.shared_session_id in fetchOfferSlotTimes: ", item.shared_session_id);
          try {
            if (item.course_offering_id || item.course_offering_id !== null) {
              const details = await fetchCourseOfferingDetails(item.course_offering_id);
              return details?.time_slots_info || [];
            } else if (item.shared_session_id) {
              const details = await fetchSharedSessionDetails(item.shared_session_id);
              return details?.time_slots_info || [];
            }
            return [];
          } catch (error) {
            console.error("Failed to fetch offer item slot info:", error);
            return [];
          }
        })
      );

      const allSlots = await Promise.all(slotPromises);
      const flattened = allSlots.flat();
      setOfferSlotTimes(flattened);
    };

    fetchOfferSlotTimes();
  }, [selectedTA, selectedApplication, offers]);

  const application = filteredShortlistedApplicants.find(
    (item) => item.application.student?.id === selectedTA?.id
  );

  const TAProfile = profilesOfShortlistedApplicants.find(
    (item) => item.id === selectedTA?.id
  );

  console.log("selectedApplication in CardContent: ", selectedApplication);
  //console.log("selectedTAProfile in CardContent: ", selectedTAProfile);
  console.log("selectedSections before highlightedSlots is updated: ", selectedSections);
  
  console.log("offerSlotTimes before highlightedSlots is updated: ", offerSlotTimes);
  console.log("selectedSections before highlightedSlots is updated: ", selectedSections);
  console.log("assignments before highlightedSlots is updated: ", assignments);
  console.log("activeOffers before highlightedSlots is updated: ", activeOffers);
  const highlightedSlots = selectedTA ? [
                  // Include slots from the currently selected course section (red highlight for potential offer)
                  ...(selectedSections.length > 0
                    ? selectedSections.flatMap(course => course.time_slots_info || [])
                    : []),
                  // Include slots from accepted assignments for this TA (persistent red highlight)
                  ...assignments
                      .filter(a => a.taStudentId === selectedTA.application.student.id)
                      .flatMap(a => a.slots || []),
                  // Include slots from added offers for this TA (persistent red highlight)
                  //...addedOffers
                    //.filter(o => o.taStudentId === selectedTA.application.student.id)
                    //.flatMap(o =>
                      //o.offers?.flatMap(offer => offer.slots || []) || []
                    //),
                  //...activeOffers
                   //.filter(o => o.taStudentId === selectedTA.application.student.id)
                    //.flatMap(o =>
                      //o.offers?.flatMap(offer => offer.slots || []) || []
                    //),
                  ...offerSlotTimes,
                ]
              : [];
  console.log("highlightedSlots just now got declared again. it is with selectedTA: ", selectedTA)
  console.log("highlightedSlots: ", highlightedSlots);

  console.log("Offers state variable is: ", offers);

  const totalWeeklyHoursForSelectedTA = selectedTA ? (() => {
    const taOffers = offers.filter(
      offer => offer.student.id === selectedTA.application.student.id && offer.status !== "cancelled"
    );

    if (taOffers.length === 0) return 0;

    return taOffers.reduce(
      (sum, offer) => sum + (offer.total_weekly_hours || 0),
      0
    );
  })() : 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activePage="Allocations"/>
        <div className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">TA Allocation Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 space-y-6 p-6">
            {/* Main Allocation Interface */}
            <Tabs defaultValue="allocate" className="space-y-4">
              <div className="p-4 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-800">
                Select an applicant, then select one or more course sections
                you want to send them an offer for. In the availability calendar, 
                <span className="font-bold text-blue-600"> blue </span> 
                boxes are time slots when the applicant is available. When you select a course section,
                the slots it takes up will turn 
                <span className="font-bold text-purple-600"> purple </span> 
                if no conflicts with the applicant's availability and 
                <span className="font-bold text-red-600"> red </span> 
                if there are conflicts.
              </div>
              <TabsList>
                <TabsTrigger value="allocate">Allocate TAs</TabsTrigger>
                <TabsTrigger value="added-offers">Added Offers</TabsTrigger>
                <TabsTrigger value="pending-offers">Pending Offers</TabsTrigger>
                <TabsTrigger value="rejected-offers">Rejected Offers</TabsTrigger>

              </TabsList>

              {/* Allocate Tab */}
              <TabsContent value="allocate" className="space-y-4">
                <div className="flex gap-4 h-[700px]">
                  {/* Shortlisted Applicants Selection */}
                  <Card className="flex flex-col flex-1">
                    <CardHeader>
                      <CardTitle>Select Shortlisted Applicant</CardTitle>
                      <CardDescription>
                        {selectedTA ? "Shortlisted Applicant Details" : "Choose a shortlisted applicant to assign to a course section"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 overflow-hidden">
                      <div className="flex-grow overflow-y-auto pr-2">
                        {selectedTA && selectedApplication && selectedTAProfile ? (
                          // ✅ Shortlisted Applicant DETAIL VIEW
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={"/placeholder.svg"} alt={selectedApplication.application.student.name} />
                                <AvatarFallback>
                                  {selectedApplication.application.student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-lg font-semibold">{selectedApplication.application.student.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {totalWeeklyHoursForSelectedTA}{" "}/{" "}{selectedApplication.application.workload} hours • {selectedApplication.application.student.study_level}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-4 flex justify-between">
                              {/* Left Column */}
                              <div className="flex flex-col">
                                <p className="text-sm font-medium mb-2">
                                  Email: {selectedApplication.application.student.email}
                                </p>
                                <p className="text-sm font-medium mb-2">
                                  Student number: {selectedApplication.application.student.student_number}
                                </p>
                              </div>

                              {/* Right Column */}
                              <div className="flex flex-col">
                                <p className="text-sm font-medium mb-2">
                                  Year standing: {selectedTAProfile.student_info.year_standing}
                                </p>
                                <p className="text-sm font-medium mb-2">
                                  Major: {selectedTAProfile.student_info.program}
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-between w-full">
                              <div className="mr-4">
                                <h4 className="text-sm font-medium mb-2">Skills</h4>

                                {/* Technical Skills */}
                                <div className="mb-2">
                                  <p className="text-xs font-semibold mb-1">Technical Skills</p>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedTAProfile.skills
                                      .filter((skill) => skill.skill_type === "technical")
                                      .map((skill, index) => (
                                        <Badge key={`technical-${index}`} variant="outline">
                                          {skill.name}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>

                                {/* Soft Skills */}
                                <div>
                                  <p className="text-xs font-semibold mb-1">Soft Skills</p>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedTAProfile.skills
                                      .filter((skill) => skill.skill_type === "soft")
                                      .map((skill, index) => (
                                        <Badge key={`soft-${index}`} variant="outline">
                                          {skill.name}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              </div>


                              <div>
                                <h4 className="text-sm font-medium mb-2">Course Preferences</h4>
                                {selectedTAProfile.course_preferences.map((preference, index) => (
                                  <div key={preference.id} className="text-sm font-medium mb-2">
                                    {index + 1}. {preference.course_code.toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-2">Experience</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedTAProfile.experiences.map((experience, index) => (
                                  <div key={index} className="border rounded-xl p-4 mb-4 shadow-sm bg-white">
                                    <Badge key={index} variant="outline" className="absolute top-1 left-1 text-xs">
                                      Experience {index + 1}
                                    </Badge>
                                    <h3 className="text-md font-semibold">{experience.position_title}</h3>
                                    <p className="text-sm font-medium mb-2">Professor: {experience.organization}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <div>
                                <h4 className="text-sm font-medium mb-2">Availability</h4>
                                {/*console.log("addedOffers right before WeeklyAvailabilityCalendar is called is: ", addedOffers)*/}
                                {/*console.log("selectedTAProfile right before WeeklyAvailabilityCalendar is called is: ", selectedTAProfile)*/}
                                <WeeklyAvailabilityCalendar
                                  mode={"allocation"}
                                  editable={false}
                                  availability={selectedTAProfile.availability}
                                  // Calculate highlightedSlots from assigned courses for the selected TA
                                  highlightedSlots={highlightedSlots}
                                />
                              </div>

                            </div>

                            {/* ✅ Go Back Button */}
                            <Button variant="outline" onClick={() => {
                              setSelectedTAId(null)
                              setSelectedApplication(null);
                            }}
                            >
                              ← Go Back
                            </Button>
                          </div>
                        ) : (
                          // ✅ Shortlisted Applicants LIST VIEW
                          <>
                            {/* ✅ Search Bar */}
                            <input
                              type="text"
                              placeholder="Search Shortlisted Applicants by name, email, ID, major, and other details..."
                              className="w-full mb-4 p-2 border border-gray-300 rounded-md"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            
                            <div className="space-y-3">
                              {filteredShortlistedApplicants
                                .map((item) => {
                                  const currentStudent = item.application.student;
                                  const currentStudentApplicationId = item.application.application_id;
                                  const currentStudentId = item.application.student.id;
                                  
                                  return(
                                    <div
                                      key={currentStudentApplicationId}
                                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                        selectedTA?.id === currentStudentId ? "border-blue-500 bg-blue-50" : "hover:bg-muted/50"
                                      }`}
                                      onClick={() => {
                                        setSelectedTAId(currentStudentId)
                                        setSelectedApplication(item);
                                        setSelectedTAProfile(profilesOfShortlistedApplicants.find((profile) => profile.id === currentStudentId));
                                        //console.log(" On clicking the applicant, selectedTAId: ", selectedTAId);
                                        //console.log(" On clicking the applicant, selectedApplication: ", selectedApplication);
                                        //console.log(" On clicking the applicant, selectedTAProfile: ", selectedTAProfile);
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={"/placeholder.svg"} alt={currentStudent.name} />
                                            <AvatarFallback>
                                              {currentStudent.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="font-medium">{currentStudent.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                              {item.application.workload} hours • {currentStudent.study_level}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <div className="mt-2 flex flex-wrap gap-1">
                                          {/* Example: Use discipline rankings as tags */}
                                          {Object.values(item.application.disciplineRankings)
                                            .slice(0, 3)
                                            .map((rank, index) => (
                                              <Badge key={index} variant="outline" className="text-xs">
                                                {rank}
                                              </Badge>
                                            ))}
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                          <button
                                            className="inline-flex items-center text-blue-600 hover:text-blue-900 p-1 rounded"
                                          >
                                            Select Applicant <Eye className="h-4 w-4 ml-1" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              }
                              {filteredShortlistedApplicants.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center">No TAs match your search.</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Course Section Selection */}
                  <Card className="flex flex-col flex-1">
                    <CardHeader>
                      <CardTitle>Select Course Section</CardTitle>
                      <CardDescription>Choose a course section that needs a TA</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 overflow-hidden">

                      {/* ✅ Search Bar */}
                      <input
                        type="text"
                        placeholder="Search Courses by name, code, instructor, and semester"
                        className="w-full mb-4 p-2 border border-gray-300 rounded-md"
                        value={searchTermForCourse}
                        onChange={(e) => setSearchTermForCourse(e.target.value)}
                      />

                      {/* ✅ Filters */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Filter className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-medium text-gray-900">Filters & Search</h3>
                      </div>

                      {/* Filter Controls */}
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
                        <select
                          value={filters.discipline}
                          onChange={(e) => handleFilterChange("discipline", e.target.value)}
                          className="px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                        >
                          {disciplineOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={filters.term_code}
                          onChange={(e) => handleFilterChange("term_code", e.target.value)}
                          className="px-2 py-2 border text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                        >
                          {termCodeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        
                        <div className="md:col-span-2">
                          <button
                            onClick={clearFilters}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Clear Filters
                          </button>
                        </div>
                      </div>

                      {/* Courses and their Sections displayed below */}
                      <div className="flex-grow overflow-y-auto pr-2">
                        <div className="space-y-4">
                          {filteredCourses.map((course) => {
                            const availableOfferings = fetchedOfferings[course.id] || []
                            const availableSections = sharedSessions[course.id] || []
                            return (
                              <div key={course.id}>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">
                                    {course.course_number} - {course.course_name}
                                  </h4>
                                </div>

                                <div className="space-y-2">

                                  {/* Offerings (e.g. Lecture Sections) */}
                                  {availableOfferings.length > 0 && (
                                    <div className=" mb-2 ">
                                      <div className="space-y-2 mt-1">
                                        {availableOfferings.map((offering) => {
                                          //console.log("selectedApplication in availableOfferings map: ", selectedApplication);
                                          //console.log("offering in availableOfferings map: ", offering);
                                          const isSelected = selectedCourseOfferings.some((s) => s.sectionId === offering.course_offering_id);
                                          const studentId = selectedApplication?.application?.student?.id;
                                          //console.log("studentId in availableOfferings map: ", studentId);
                                          //console.log("about to call isSectionAlreadyOfferedToTA for student: ", studentId);
                                          console.log("studentId is: ", studentId);
                                          const isOffered = selectedApplication?.application?.student?.id && isSectionAlreadyOfferedToTA(studentId, offering.course_offering_id);
                                          //console.log(`current offering in availableOfferings in course with course id ${course.id} is: ${offering}`);
                                          return (
                                            <div
                                              key={`${course.id}-offering-${offering.course_offering_id}`}
                                              className={`p-3 border rounded-lg transition-colors ${
                                                isOffered
                                                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                  : isSelected
                                                  ? "border-blue-500 bg-blue-50 cursor-pointer"
                                                  : "hover:bg-muted/50 cursor-pointer"
                                              }`}
                                              onClick={() => {
                                                if (isOffered) return;

                                                const selected = {
                                                  ...offering,
                                                  item_type: "course_offering",
                                                  course_name: course.course_name,
                                                  course_number: course.course_number,
                                                  sectionId: offering.course_offering_id,
                                                  time_slots_info: convertTimeSlotsInfoToKeys(offering.time_slots_info),
                                                  weeklyDuration: getTotalHoursFromSlotArray(convertTimeSlotsInfoToKeys(offering.time_slots_info)),
                                                };

                                                setSelectedCourseOfferings((prev) => {
                                                  const alreadySelected = prev.some((s) => s.sectionId === selected.sectionId);
                                                  return alreadySelected
                                                    ? prev.filter((s) => s.sectionId !== selected.sectionId)
                                                    : [...prev, selected];
                                                });
                                              }}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <p className="font-medium">
                                                    {"Lecture"} - Section {offering.section_number}
                                                  </p>
                                                  <p className="text-sm text-muted-foreground">
                                                    {formatSlotsFromTimeInfo(offering.time_slots_info)}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Shared Sessions (e.g. Lecture Sections) */}
                                  {availableSections.map((section) => {
                                    const isSelected = selectedSections.some((s) => s.sectionId === section.shared_session_id);
                                    const studentId = selectedApplication?.application?.student?.id;
                                    const isOffered = selectedApplication?.application?.student?.id && isSectionAlreadyOfferedToTA(studentId, section.shared_session_id);
                                    //console.log("Checking section ID:", section.id)
                                    //console.log("selectedCourses:", selectedCourses.map(s => s.sectionId))
                                    //console.log("activeOffers:", activeOffers)
                                    //console.log("isSelected:", isSelected, "isOffered:", isOffered)
                                    return (
                                      <div
                                        key={`${course.id}-${section.shared_session_id}`}
                                        className={`p-3 border rounded-lg transition-colors ${
                                          isOffered
                                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                            : isSelected
                                            ? "border-blue-500 bg-blue-50 cursor-pointer"
                                            : "hover:bg-muted/50 cursor-pointer"
                                        }`}
                                        onClick={() => {
                                          if (isOffered) return;

                                          const selected = {
                                            ...section,
                                            item_type: "shared_session",
                                            course_name: course.course_name,
                                            course_number: course.course_number,
                                            sectionId: section.shared_session_id,
                                            section_type_display: section.session_type_display,
                                            section_number: section.section_number,
                                            time_slots_info: convertTimeSlotsInfoToKeys(section.time_slots_info),
                                            weeklyDuration: getTotalHoursFromSlotArray(convertTimeSlotsInfoToKeys(section.time_slots_info)),
                                          };
                                          //console.log("selected is having the following after clicking a lab/tutorial: ", selected);
                                          setSelectedSharedSessions((prev) => {
                                            const alreadySelected = prev.some((s) => s.sectionId === selected.sectionId);
                                            return alreadySelected
                                              ? prev.filter((s) => s.sectionId !== selected.sectionId)
                                              : [...prev, selected];
                                          });
                                        }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="font-medium">
                                              {section.session_type_display} - Section {section.section_number}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              {formatSlotsFromTimeInfo(section.time_slots_info)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Add Offer Action */}
                {selectedTA && selectedSections.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle> Add Offer </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div data-testid="add-offer-section">
                          <p className="font-medium">
                            Add to offer of <span className="text-blue-600">{selectedTA.application.student.name}</span>:
                          </p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                            {selectedSections.map((c, idx) => {
                              const hours = c.weekHours ?? c.weeklyDuration ?? 0;
                              //console.log("c in selectedSections.map in Send offer card is: ", c);
                              //console.log("hours in selectedSections.map in Send offer card is: ", hours);
                              return (
                                <li key={idx}>
                                  {c.course_number} - {c.course_name} - {c.section_type_display} Section {c.section_number} ({hours} hrs)
                                </li>
                              );
                            })}
                          </ul>
                          <p className="text-sm text-muted-foreground mt-2">
                            New workload:{" "}
                            <span className="font-medium">
                              {totalWeeklyHoursForSelectedTA} / {selectedApplication.application.workload} hours
                            </span>{" "}
                            →{" "}
                            <span className="font-medium">
                              {
                                (totalWeeklyHoursForSelectedTA) +
                                selectedSections.reduce(
                                  (sum, c) => sum + (c.weekHours ?? c.weeklyDuration ?? 0),
                                  0
                                )
                              }{" "}/{" "}{selectedApplication.application.workload}{" "}hours
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedTAId(null)
                              setSelectedCourseOfferings([])
                              setSelectedSharedSessions([])

                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={async () => {
                              const studentId = selectedTA.application.student.id;
                              const maxWorkload = selectedApplication.application.workload;
                              const existingHours = totalWeeklyHoursForSelectedTA;

                              // Calculate total hours of selected sections
                              const addedHours = selectedSections.reduce(
                                (sum, c) => sum + (c.weekHours ?? c.weeklyDuration ?? 0),
                                0
                              );

                              if (existingHours >= maxWorkload) {
                                alert("Cannot add offer. Student has already reached their maximum workload.");
                                return;
                              }

                              if (existingHours + addedHours > maxWorkload) {
                                alert(
                                  `Cannot add offer. Adding these sections would exceed the student's workload limit of ${maxWorkload} hours.`
                                );
                                return;
                              }

                              // First check for conflicts between selected sections
                              const sectionConflict = checkForConflictsWithinSelectedSections(selectedSections);
                              if (sectionConflict.conflict) {
                                alert(
                                  `Time conflict detected between ${sectionConflict.sections.section1.course_number} ${sectionConflict.sections.section1.section_type_display} ${sectionConflict.sections.section1.section_number} and ${sectionConflict.sections.section2.course_number} ${sectionConflict.sections.section2.section_type_display} ${sectionConflict.sections.section2.section_number}`
                                );
                                return;
                              }


                              for (const course of selectedSections) {
                                //console.log("course in selectedSections after pressing send offer button: ", course);
                                const result = await checkForConflicts(
                                  selectedTAProfile.availability,
                                  course.time_slots_info,
                                  selectedApplication.application.student.id
                                );
                                if (result.conflict) {
                                  alert(
                                    result.type === "availability"
                                      ? `Conflict with TA's availability in ${course.course_number} ${course.section_number} `
                                      : `Conflict with previously assigned section in ${course.course_number} ${course.section_number}`
                                  );
                                  return;
                                }
                              }



                              try {
                                // Send to backend
                                console.log("in try block of add offer button, selectedApplication is: ", selectedApplication);
                                await createOffer(selectedApplication.application.application_id, selectedSections);

                                await fetchAndSetOffers();
                                // Update frontend state
                                handleAddTAtoAddedOfferTab(selectedTA, selectedSections);

                                setStudentCurrentHours((prev) => ({
                                  ...prev,
                                  [studentId]: existingHours + addedHours,
                                }));

                                setSelectedTAId(null);
                                setSelectedApplication(null);
                                setSelectedCourseOfferings([]);
                                setSelectedSharedSessions([]);
                              } catch (err) {
                                console.error("Failed to create offer:", err);
                                alert("An error occurred while creating the offer.");
                              }
                            }}
                          >
                            Add Offer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Added Offers Tab */}
              <TabsContent value="added-offers">
                <AddedOffersTab 
                  offers={offers}
                  setOffers={setOffers}
                  fetchOffers={fetchOffers}
                  activeOffers={activeOffers}
                  setActiveOffers={setActiveOffers}
                  studentCurrentHours={studentCurrentHours}
                  setStudentCurrentHours={setStudentCurrentHours}
                />
              </TabsContent>

              {/* Pending Offers Tab */}
              <TabsContent value="pending-offers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending TA Offers</CardTitle>
                    <CardDescription>
                      These are the TA assignments that have been sent as offers to the students.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Filter offers for "pending" status and check if any exist */}
                    {/* Create a filtered array first */}
                    {(() => { // Using an IIFE (Immediately Invoked Function Expression) to declare filteredOffers
                      const filteredOffers = offers.filter(offer => offer.status === "pending" && offer.offer_items.length > 0);

                      // You can console.log the filtered offers here if you want to inspect them
                      //console.log("Filtered Pending Offers:", filteredOffers);

                      return filteredOffers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">
                          No active offers at the moment.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {filteredOffers.map((pendingOffer) => (
                            <div key={pendingOffer.offer_id} className="p-3 border rounded-lg"> {/* Use offer_id as key */}
                              <p className="font-medium mb-2">{pendingOffer.student.name}</p> {/* Access student name */}
                              <ul className="ml-4 list-disc text-sm text-muted-foreground">
                                {pendingOffer.offer_items.map((item, i) => (
                                  <li key={i}>
                                    {item.course_number} - {item.course_name} - {item.section_type_display} Section {item.section_number} {/* Access correct properties */}
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-4 flex justify-end">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    // Ensure setTaToRescind expects the 'pendingOffer' structure
                                    setOfferToRescind(pendingOffer);
                                    setShowRescindModal(true);
                                  }}
                                >
                                  Rescind Offer
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rejected Offers Tab */}
              <TabsContent value="rejected-offers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rejected TA Offers</CardTitle>
                    <CardDescription>
                      These are the offers that were rejected by students.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Filter offers for "rejected" status and check if any exist */}
                    {/* Create a filtered array first */}
                    {(() => { // Using an IIFE (Immediately Invoked Function Expression) to declare rejectedOffers
                      const rejectedOffers = offers.filter(offer => offer.status === "rejected" && offer.offer_items.length > 0);

                      // You can console.log the filtered offers here if you want to inspect them
                      //console.log("Filtered Pending Offers:", filteredOffers);

                      return rejectedOffers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">
                          No rejected offers at the moment.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {rejectedOffers.map((rejectedOffer) => (
                            <div key={rejectedOffer.offer_id} className="p-3 border rounded-lg"> {/* Use offer_id as key */}
                              <p className="font-medium mb-2">{rejectedOffer.student.name}</p> {/* Access student name */}
                              <ul className="ml-4 list-disc text-sm text-muted-foreground">
                                {rejectedOffer.offer_items.map((item, i) => (
                                  <li key={i}>
                                    {item.course_number} - {item.course_name} - {item.section_type_display} Section {item.section_number} {/* Access correct properties */}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              {showDeleteModal && assignmentToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
                    <p className="text-sm mb-6">
                      Are you sure you want to delete the assignment of{" "}
                      <strong>{assignmentToDelete.taName}</strong> to{" "}
                      <strong>
                        {assignmentToDelete.course_number} - {assignmentToDelete.section}
                      </strong>?
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteModal(false)
                          setAssignmentToDelete(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleDeleteAssignment(assignmentToDelete)
                          setShowDeleteModal(false)
                          setAssignmentToDelete(null)
                        }}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Rescind modal */}
              {showRescindModal && offerToRescind && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <h2 className="text-lg font-semibold mb-4">Confirm Rescind</h2>
                    <p className="text-sm mb-6">
                      Are you sure you want to rescind all offers made to{" "}
                      <strong>{offerToRescind.student.name}</strong>?
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRescindModal(false)
                          setOfferToRescind(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={ async () => {
                          console.log("offerToRescind is: ", offerToRescind);
                          handleRescindOffer(offerToRescind.offer_id)
                          console.log("offers after rescinding and doing fetchAndSetOffers: ", offers);
                          setShowRescindModal(false)
                          setOfferToRescind(null)
                        }}
                      >
                        Yes, Rescind
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
