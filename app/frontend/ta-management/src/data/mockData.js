export const mockAssignments = [
  {
    id: 1,
    studentId: "ST2024001",
    studentName: "Alex Johnson",
    email: "alex.johnson@student.ubc.ca",
    avatar: "/placeholder.svg",
    totalWeeklyHours: 8,
    maxHours: 10,
    yearlyAssignments: {
      "2025": {
        "W2025 Term 1": [
          {
            id: 1,
            courseCode: "COSC 101",
            courseName: "Introduction to Programming",
            sectionType: "Lecture",
            section: "001 - Mon",
            weekHours: 1.5,
            timeSlots: [
              { day: "Monday", startTime: "10:00", endTime: "11:30" },
            ],
          },
          {
            id: 2,
            courseCode: "COSC 101",
            courseName: "Introduction to Programming",
            sectionType: "Lab",
            section: "L01",
            weekHours: 2,
            timeSlots: [
              { day: "Friday", startTime: "14:00", endTime: "16:00" },
            ],
          },
        ],
        "W2025 Term 2": [
          {
            id: 3,
            courseCode: "COSC 121",
            courseName: "Program Design",
            sectionType: "Lab",
            section: "L02",
            weekHours: 3,
            timeSlots: [
              { day: "Tuesday", startTime: "15:00", endTime: "18:00" },
            ],
          },
        ],
      },
      "2024": {
        "W2024 Term 1": [
          {
            id: 4,
            courseCode: "MATH 101",
            courseName: "Calculus I",
            sectionType: "Tutorial",
            section: "T01",
            weekHours: 2,
            timeSlots: [
              { day: "Thursday", startTime: "13:00", endTime: "15:00" },
            ],
          },
        ],
      },
    },
  },
  {
    id: 2,
    studentId: "ST2024002",
    studentName: "Sarah Chen",
    email: "sarah.chen@student.ubc.ca",
    avatar: "/placeholder.svg",
    totalWeeklyHours: 6,
    maxHours: 10,
    yearlyAssignments: {
      "2025": {
        "W2025 Term 1": [
          {
            id: 5,
            courseCode: "COSC 201",
            courseName: "Data Structures",
            sectionType: "Lecture",
            section: "001 - Wed",
            weekHours: 1.5,
            timeSlots: [
              { day: "Wednesday", startTime: "13:00", endTime: "14:30" },
            ],
          },
          {
            id: 6,
            courseCode: "COSC 201",
            courseName: "Data Structures",
            sectionType: "Lab",
            section: "L01",
            weekHours: 3,
            timeSlots: [
              { day: "Friday", startTime: "10:00", endTime: "13:00" },
            ],
          },
        ],
      },
    },
  },
];

export const mockCourses = [
  {
    id: 1,
    code: "COSC 101",
    name: "Introduction to Programming",
    instructor: "Dr. Smith",
    department: "Computer Science",
    yearlyOfferings: {
      "2025": {
        "W2025 Term 1": [
          {
            id: "cosc101-lec001-mon",
            type: "Lecture",
            section: "001 - Monday",
            sectionType: "Lecture",
            assignedTA: "Alex Johnson",
            studentId: "ST2024001",
            weekHours: 1.5,
            timeSlots: [
              { day: "Monday", startTime: "10:00", endTime: "11:30" },
            ],
          },
          {
            id: "cosc101-lec001-wed",
            type: "Lecture",
            section: "001 - Wednesday",
            sectionType: "Lecture",
            assignedTA: "Sarah Chen",
            studentId: "ST2024002",
            weekHours: 1.5,
            timeSlots: [
              { day: "Wednesday", startTime: "10:00", endTime: "11:30" },
            ],
          },
          {
            id: "cosc101-lab-l01",
            type: "Lab",
            section: "L01",
            sectionType: "Lab",
            assignedTA: "Alex Johnson",
            studentId: "ST2024001",
            weekHours: 2,
            timeSlots: [
              { day: "Friday", startTime: "14:00", endTime: "16:00" },
            ],
          },
          {
            id: "cosc101-lab-l02",
            type: "Lab",
            section: "L02",
            sectionType: "Lab",
            assignedTA: null,
            studentId: null,
            weekHours: 2,
            timeSlots: [
              { day: "Friday", startTime: "16:00", endTime: "18:00" },
            ],
          },
        ],
      },
    },
  },
  {
    id: 2,
    code: "COSC 201",
    name: "Data Structures",
    instructor: "Dr. Johnson",
    department: "Computer Science",
    yearlyOfferings: {
      "2025": {
        "W2025 Term 1": [
          {
            id: "cosc201-lec001-mon",
            type: "Lecture",
            section: "001 - Monday",
            sectionType: "Lecture",
            assignedTA: null,
            studentId: null,
            weekHours: 1.5,
            timeSlots: [
              { day: "Monday", startTime: "13:00", endTime: "14:30" },
            ],
          },
          {
            id: "cosc201-lec001-wed",
            type: "Lecture",
            section: "001 - Wednesday",
            sectionType: "Lecture",
            assignedTA: "Sarah Chen",
            studentId: "ST2024002",
            weekHours: 1.5,
            timeSlots: [
              { day: "Wednesday", startTime: "13:00", endTime: "14:30" },
            ],
          },
          {
            id: "cosc201-lab-l01",
            type: "Lab",
            section: "L01",
            sectionType: "Lab",
            assignedTA: "Sarah Chen",
            studentId: "ST2024002",
            weekHours: 3,
            timeSlots: [
              { day: "Friday", startTime: "10:00", endTime: "13:00" },
            ],
          },
        ],
      },
    },
  },
  {
    id: 3,
    code: "MATH 101",
    name: "Calculus I",
    instructor: "Dr. Wilson",
    department: "Mathematics",
    yearlyOfferings: {
      "2024": {
        "W2024 Term 1": [
          {
            id: "math101-lec001-tue",
            type: "Lecture",
            section: "001 - Tuesday",
            sectionType: "Lecture",
            assignedTA: null,
            studentId: null,
            weekHours: 1.5,
            timeSlots: [
              { day: "Tuesday", startTime: "09:00", endTime: "10:30" },
            ],
          },
          {
            id: "math101-lec001-thu",
            type: "Lecture",
            section: "001 - Thursday",
            sectionType: "Lecture",
            assignedTA: null,
            studentId: null,
            weekHours: 1.5,
            timeSlots: [
              { day: "Thursday", startTime: "09:00", endTime: "10:30" },
            ],
          },
          {
            id: "math101-tut-t01",
            type: "Tutorial",
            section: "T01",
            sectionType: "Tutorial",
            assignedTA: "Alex Johnson",
            studentId: "ST2024001",
            weekHours: 2,
            timeSlots: [
              { day: "Thursday", startTime: "13:00", endTime: "15:00" },
            ],
          },
        ],
      },
    },
  },
];