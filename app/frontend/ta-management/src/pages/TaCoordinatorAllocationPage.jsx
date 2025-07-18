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
import { AppSidebar } from "../components/scheduler-sidebar"
import WeeklyAvailabilityCalendar from "@/components/WeeklyAvailabilityCalendar"
import App from "@/App"
import { fetchCourses, fetchOfferingsForCourse, fetchSharedSessionsForCourse } from "@/logic/coordinator-allocations-page";


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
 
//converts M: 8:00-10:00 to Monday-8-top and so on
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
  const [activeOffers, setActiveOffers] = useState([])
  const [showRescindModal, setShowRescindModal] = useState(false)
  const [taToRescind, setTaToRescind] = useState(null)
  const [filters, setFilters] = useState({
    discipline: "",
    term_code: "",
  });
  const [courseOfferings, setCourseOfferings] = useState({});
  const [sharedSessions, setSharedSessions] = useState({});
  const [fetchedOfferings, setFetchedOfferings] = useState({});

  const [selectedCourseOfferings, setSelectedCourseOfferings] = useState([]);
  const [selectedSharedSessions, setSelectedSharedSessions] = useState([]);


  const selectedTA = taList.find((ta) => ta.id === selectedTAId)

  // Function to store the offer of a TA to a course
  const handleAddTAtoActiveOfferTab = (selectedTA, selectedCourse) => {
    setActiveOffers((prevOffers) => {
      const existingTA = prevOffers.find(
        (o) => o.taStudentId === selectedTA.studentId
      )

      console.log("selectedCourse.time_slots_info in handleAddTAtoActiveOfferTab: ", selectedCourse.time_slots_info);
      const newOffer = {
        course_number: selectedCourse.course_number,
        course_name: selectedCourse.course_name,
        section: selectedCourse.section,
        sectionId: selectedCourse.sectionId, // ✅ Correct
        instructor: selectedCourse.instructor,
        semester: selectedCourse.semester,
        type: selectedCourse.type,
        slots: convertSlotRangeToKeys(formatSlotsFromTimeInfo(selectedCourse.time_slots_info)),
      }

      if (existingTA) {
        // Avoid duplicates
        const alreadyAdded = existingTA.offers.some(
          (offer) =>
            offer.course_number === newOffer.course_number &&
            offer.section === newOffer.section
        )
        if (alreadyAdded) return prevOffers

        return prevOffers.map((o) =>
          o.taStudentId === selectedTA.studentId
            ? { ...o, offers: [...o.offers, newOffer] }
            : o
        )
      } else {
        // First offer for this TA
        return [
          ...prevOffers,
          {
            taName: selectedTA.name,
            taStudentId: selectedTA.studentId,
            offers: [newOffer],
          },
        ]
      }
    })
  }

  const handleRescindOffer = (taStudentId) => {
    setActiveOffers((prevOffers) =>
      prevOffers.filter((offer) => offer.taStudentId !== taStudentId)
    )
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
    
    setActiveOffers((prevOffers) =>
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

  const isSectionAlreadyOfferedToTA = (taStudentId, sectionId) => {
    const taOffer = activeOffers.find((o) => o.taStudentId === taStudentId)
    if (!taOffer) return false

    return taOffer.offers.some((offer) => String(offer.sectionId) === String(sectionId))
  }


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

  // Helper function to check for scheduling conflicts
  const checkForConflicts = (taAvailability, courseSlots) => {
    const availabilitySet = new Set(taAvailability)
    const formattedCourseSlotsToDaysAndTime = formatSlotsFromTimeInfo(courseSlots);
    const formattedDaysAndTimeToCalendarFormat = convertSlotRangeToKeys(formattedCourseSlotsToDaysAndTime);
    console.log("formattedCourseSlots in checkForConflicts: ", formattedDaysAndTimeToCalendarFormat);
    for (const slot of formattedDaysAndTimeToCalendarFormat) {
      if (!availabilitySet.has(slot)) {
        return true // ❗️Conflict: TA not available at this time
      }
    }

    return false // ✅ All course slots are within TA availability
  }

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
      return `${dayLabels.join("")} ${minutesToTime(startMins)}–${minutesToTime(endMins)}`;
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


  // Function to get assignments for a specific TA
  function getAssignmentsForTA(taName) {
  return assignments.filter((assignment) => assignment.taName === taName)
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

  const totalTAs = taList.length
  const availableTACount = taList.filter((ta) => ta.status === "Available").length
  const totalCourses = mockCourses.length

  // Choose data source: use fetched courses if available, otherwise use mockCourses
  const courseDataToFilter = courses && courses.length > 0 ? courses : mockCourses;

  const filteredCourses = courseDataToFilter.filter((course) => {
    
    const matchesSearch =
      course.course_number.toLowerCase().includes(searchTermForCourse.toLowerCase()) ||
      course.course_name.toLowerCase().includes(searchTermForCourse.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTermForCourse.toLowerCase()) ||
      course.semester.toLowerCase().includes(searchTermForCourse.toLowerCase())

    // Discipline filter logic
    const matchesDiscipline = filters.discipline
      ? course.course_number.startsWith(filters.discipline)
      : true;

    // Term filter logic (assuming semester format is "Term Year")
    const matchesTerm = filters.term_code
      ? course.semester.toLowerCase().includes(filters.term_code.toLowerCase())
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


  useEffect(() => {
    const loadCoursesAndRelatedData = async () => {
      try {
        const data = await fetchCourses();
        const fetchedCourses = data.results;
        console.log("fetchedCourses are: ", fetchedCourses);
        setCourses(fetchedCourses);

        // Loop through each course to fetch offerings and shared sessions
        for (const course of fetchedCourses) {
          const courseId = course.id;

          try {
            const [offerings, sharedSessions] = await Promise.all([
              fetchOfferingsForCourse(courseId),
              fetchSharedSessionsForCourse(courseId),
            ]);

            console.log(`Offerings for course ${courseId}:`, offerings);
            console.log(`Shared sessions for course ${courseId}:`, sharedSessions);

            setCourseOfferings((prev) => ({
              ...prev,
              [courseId]: offerings,
            }));

            setSharedSessions((prev) => ({
              ...prev,
              [courseId]: sharedSessions,
            }));
          } catch (err) {
            console.error(`Error fetching data for course ${courseId}:`, err);
          }
        }
      } catch (error) {
        console.error("Error loading courses:", error);
        setCourses(mockCourses);
      }
    };

    loadCoursesAndRelatedData();
  }, []);

  const selectedSections = [...selectedCourseOfferings, ...selectedSharedSessions];

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
                <TabsTrigger value="active-offers">Active Offers</TabsTrigger>
                <TabsTrigger value="allocated">Allocated TAs</TabsTrigger>

              </TabsList>

              {/* Allocate Tab */}
              <TabsContent value="allocate" className="space-y-4">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* TA Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select TA</CardTitle>
                      <CardDescription>
                        {selectedTA ? "TA Details" : "Choose a TA to assign to a course section"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {selectedTA ? (
                        // ✅ TA DETAIL VIEW
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={selectedTA.avatar || "/placeholder.svg"} alt={selectedTA.name} />
                              <AvatarFallback>
                                {selectedTA.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-lg font-semibold">{selectedTA.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedTA.currentHours}/{selectedTA.maxHours} hours • {selectedTA.major}
                              </p>
                              <p className="text-sm text-muted-foreground">Status: {selectedTA.status}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Email: {selectedTA.email}</p>
                            <p className="text-sm font-medium mb-2">Student ID: {selectedTA.studentId}</p>
                            <p className="text-sm font-medium mb-2">Academic level: {selectedTA.year}</p>
                            <p className="text-sm font-medium mb-2">Major: {selectedTA.major}</p>
                            <p className="text-sm font-medium mb-2">GPA: {selectedTA.gpa}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Experience</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedTA.experience.map((experience, index) => (
                                <Badge key={index} variant="outline">
                                  {experience}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedTA.skills.map((skill, index) => (
                                <Badge key={index} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div>
                              <h4 className="text-sm font-medium mb-2">Availability</h4>
                              {console.log("activeOffers right before WeeklyAvailabilityCalendar is: ", activeOffers)}
                              <WeeklyAvailabilityCalendar
                                mode={"allocation"}
                                editable={false}
                                availability={selectedTA.availability}
                                // Calculate highlightedSlots from assigned courses for the selected TA
                                highlightedSlots={
                                  selectedTA
                                    ? [
                                        // Include slots from the currently selected course section (red highlight for potential offer)
                                        ...(selectedSections.length > 0
                                          ? selectedSections.flatMap(course => formatSlotsFromTimeInfo(course.time_slots_info) || [])
                                          : []),
                                        // Include slots from accepted assignments for this TA (persistent red highlight)
                                        ...assignments
                                            .filter(a => a.taStudentId === selectedTA.studentId)
                                            .flatMap(a => a.slots || []),
                                        // Include slots from active (pending) offers for this TA (persistent red highlight)
                                        ...activeOffers
                                          .filter(o => o.taStudentId === selectedTA.studentId)
                                          .flatMap(o =>
                                            o.offers?.flatMap(offer => offer.slots || []) || []
                                          ),
                                      ]
                                    : []
                                }
                              />
                            </div>

                          </div>

                          {/* ✅ Go Back Button */}
                          <Button variant="outline" onClick={() => setSelectedTAId(null)}>
                            ← Go Back
                          </Button>
                        </div>
                      ) : (
                        // ✅ TA LIST VIEW
                        <>
                          {/* ✅ Search Bar */}
                          <input
                            type="text"
                            placeholder="Search TAs by name, email, ID, major, and other details..."
                            className="w-full mb-4 p-2 border border-gray-300 rounded-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          
                          <div className="space-y-3">
                            {filteredTAs
                              .filter((ta) => ta.status !== "Fully Allocated")
                              .map((ta) => (
                                <div
                                  key={ta.id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    selectedTA?.id === ta.id ? "border-blue-500 bg-blue-50" : "hover:bg-muted/50"
                                  }`}
                                  onClick={() => setSelectedTAId(ta.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={ta.avatar || "/placeholder.svg"} alt={ta.name} />
                                        <AvatarFallback>
                                          {ta.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{ta.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {ta.currentHours}/{ta.maxHours} hours • {ta.major}
                                        </p>
                                      </div>
                                    </div>
                                    {getStatusBadge(ta.status)}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {ta.skills.slice(0, 3).map((skill, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      <button
                                        //onClick={() =>
                                          //handleViewApplication(application)
                                        //}
                                        //
                                        className="inline-flex items-center text-blue-600 hover:text-blue-900 p-1 rounded"
                                      >
                                        Select Applicant <Eye className="h-4 w-4 ml-1" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            }
                            {filteredTAs.filter((ta) => ta.status !== "Fully Allocated").length === 0 && (
                              <p className="text-sm text-muted-foreground text-center">No TAs match your search.</p>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Course Section Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Course Section</CardTitle>
                      <CardDescription>Choose a course section that needs a TA</CardDescription>
                    </CardHeader>
                    <CardContent>

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
                      <div className="h-[500px] overflow-y-auto pr-2">
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
                                          const isSelected = selectedCourseOfferings.some((s) => s.sectionId === offering.course_offering_id);
                                          const isOffered =
                                            selectedTA && isSectionAlreadyOfferedToTA(selectedTA.studentId, offering.course_offering_id);

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
                                                  course_name: course.course_name,
                                                  course_number: course.course_number,
                                                  sectionId: offering.course_offering_id,
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
                                    const isOffered =
                                      selectedTA && isSectionAlreadyOfferedToTA(selectedTA.studentId, section.shared_session_id);
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
                                            course_name: course.course_name,
                                            course_number: course.course_number,
                                            sectionId: section.shared_session_id,
                                            section_type_display: section.session_type_display,
                                            section_number: section.section_number,
                                            time_slots_info: section.time_slots_info,
                                          };
                                          console.log("selected is having the following: ", selected);
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

                {/* Send Offer Action */}
                {selectedTA && selectedSections.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle> Send Offer </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            Send offer to <span className="text-blue-600">{selectedTA.name}</span> for:
                          </p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                            {selectedSections.map((c, idx) => (
                              <li key={idx}>
                                {c.course_number} - {c.course_name} - {c.section_type_display} Section {c.section_number} ({c.weekHours} hrs)
                              </li>
                            ))}
                          </ul>
                          <p className="text-sm text-muted-foreground mt-2">
                            Total workload: {selectedTA.currentHours} →{" "}
                            {selectedTA.currentHours + selectedSections.reduce((sum, c) => sum + c.weekHours, 0)} hours
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
                            onClick={() => {
                              let totalHours = selectedTA.currentHours;
                              const newOffers = [];

                              for (const course of selectedSections) {

                                console.log(course.time_slots_info);
                                const hasConflict = checkForConflicts(
                                  selectedTA.availability,
                                  course.time_slots_info
                                );
                                if (hasConflict) {
                                  alert(`Conflict with section ${course.course_number} ${course.section_number}`);
                                  return;
                                }
                                totalHours += course.weekHours;
                                newOffers.push(course);
                              }

                              const newStatus = totalHours >= selectedTA.maxHours ? "Fully Allocated" : "Partially Allocated";
                              const updatedTA = {
                                ...selectedTA,
                                currentHours: totalHours,
                                status: newStatus,
                              };

                              setTaList((prevTAs) =>
                                prevTAs.map((t) => (t.id === updatedTA.id ? updatedTA : t))
                              );

                              newOffers.forEach((course) => {
                                handleAddTAtoActiveOfferTab(updatedTA, course);
                              });

                              // Reset selections
                              setSelectedTAId(null);
                              setSelectedCourseOfferings([]);
                              setSelectedSharedSessions([]);
                            }}
                          >
                            Send Offer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Active Offers Tab */}
              <TabsContent value="active-offers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Active TA Offers</CardTitle>
                    <CardDescription>
                      These are the TA assignments that have been sent as offers to the students.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeOffers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center">
                        No active offers at the moment.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {activeOffers.map((taOffer, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <p className="font-medium mb-2">{taOffer.taName}</p>
                            <ul className="ml-4 list-disc text-sm text-muted-foreground">
                              {taOffer.offers.map((offer, i) => (
                                <li key={i}>
                                  {offer.course_number} - {offer.course_name} - {offer.type} Section {offer.section}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setTaToRescind(taOffer)
                                  setShowRescindModal(true)
                                }}
                              >
                                Rescind Offer
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Allocated TAs Tab */}
              <TabsContent value="allocated" className="space-y-4">
                {taList.filter(
                (ta) => ta.status === "Fully Allocated" || ta.status === "Partially Allocated")
                .map((ta) => (
                  <Card key={ta.id}>
                    <CardHeader>
                       <CardTitle>{ta.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Current Workload: {ta.currentHours}/{ta.maxHours} hours
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {ta.status}
                      </p>
                    
                      {getAssignmentsForTA(ta.name).map((assignment, idx) => (
                        <div key={`${assignment.taStudentId}-${assignment.course_number}-${assignment.section}`}>
                          <p className="font-medium mt-2">
                            {assignment.taName} - {assignment.taStudentId}   
                          </p>
                          <p className="text-sm text-muted-foreground">                      
                            {assignment.course_number} - {assignment.course_name} - {assignment.section}
                          </p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setAssignmentToDelete(assignment)
                              setShowDeleteModal(true)
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      ))} 

                    </CardContent>
                  </Card>
                ))}
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
              {showRescindModal && taToRescind && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <h2 className="text-lg font-semibold mb-4">Confirm Rescind</h2>
                    <p className="text-sm mb-6">
                      Are you sure you want to rescind all offers made to{" "}
                      <strong>{taToRescind.taName}</strong>?
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRescindModal(false)
                          setTaToRescind(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleRescindOffer(taToRescind.taStudentId)
                          setShowRescindModal(false)
                          setTaToRescind(null)
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
