export const mockCourses = [
    {
      id: "cs101",
      code: "CS 101",
      title: "Introduction to Computer Science",
      department: "Computer Science",
      description: "Fundamental concepts of computer science and programming",
      offerings: [
        {
          id: "cs101-wt1-24-johnson",
          year: "2024",
          term: "Winter Term 1",
          instructor: "Dr. Sarah Johnson",
          section: "Section A",
          requirements: {
            specialRequirements: ["Python experience", "Strong communication skills"],
          },
        },
        {
          id: "cs101-wt1-24-chen",
          year: "2024",
          term: "Winter Term 1",
          instructor: "Dr. Michael Chen",
          section: "Section B",
          requirements: {
            specialRequirements: ["Python experience", "Evening availability preferred"],
          },
        },
        {
          id: "cs101-wt2-24",
          year: "2024",
          term: "Winter Term 2",
          instructor: "Dr. Michael Chen",
          section: "Section A",
          requirements: {
            specialRequirements: ["Available for evening sessions"],
          },
        },
      ],
      // Shared labs/tutorials organized by term-year
      sharedSessions: {
        "Winter Term 1-2024": {
          labs: [
            {
              id: "cs101-wt1-24-lab1",
              section: "Lab 01",
              day: "Monday",
              time: "2:00 PM - 4:00 PM",
              location: "CS Lab 101",
              taAssigned: "John Smith",
              forOfferings: ["cs101-wt1-24-johnson", "cs101-wt1-24-chen"],
            },
            {
              id: "cs101-wt1-24-lab2",
              section: "Lab 02",
              day: "Wednesday",
              time: "10:00 AM - 12:00 PM",
              location: "CS Lab 102",
              taAssigned: "Emily Davis",
              forOfferings: ["cs101-wt1-24-johnson", "cs101-wt1-24-chen"],
            },
            {
              id: "cs101-wt1-24-lab3",
              section: "Lab 03",
              day: "Friday",
              time: "3:00 PM - 5:00 PM",
              location: "CS Lab 103",
              taAssigned: null,
              forOfferings: ["cs101-wt1-24-johnson", "cs101-wt1-24-chen"],
            },
          ],
          tutorials: [
            {
              id: "cs101-wt1-24-tut1",
              section: "Tutorial 01",
              day: "Thursday",
              time: "1:00 PM - 2:00 PM",
              location: "Room 205",
              taAssigned: "Mike Wilson",
              forOfferings: ["cs101-wt1-24-johnson", "cs101-wt1-24-chen"],
            },
          ],
        },
        "Winter Term 2-2025": {
          labs: [
            {
              id: "cs101-wt2-25-lab1",
              section: "Lab 01",
              day: "Tuesday",
              time: "3:00 PM - 5:00 PM",
              location: "CS Lab 103",
              taAssigned: null,
              forOfferings: ["cs101-wt2-25"],
            },
          ],
          tutorials: [],
        },
      },
    },
    {
      id: "math201",
      code: "MATH 201",
      title: "Calculus II",
      department: "Mathematics",
      description: "Integral calculus and applications",
      offerings: [
        {
          id: "math201-wt1-24-anderson",
          year: "2024",
          term: "Winter Term 1",
          instructor: "Prof. Lisa Anderson",
          section: "Section A",
          requirements: {
            specialRequirements: ["Strong calculus background", "Tutoring experience preferred"],
          },
        },
        {
          id: "math201-wt1-24-williams",
          year: "2024",
          term: "Winter Term 1",
          instructor: "Dr. James Williams",
          section: "Section B",
          requirements: {
            specialRequirements: ["Strong calculus background", "Graduate student preferred"],
          },
        },
      ],
      sharedSessions: {
        "Winter Term 1-2024": {
          labs: [],
          tutorials: [
            {
              id: "math201-wt1-24-tut1",
              section: "Tutorial 01",
              day: "Thursday",
              time: "11:00 AM - 12:00 PM",
              location: "Math 301",
              taAssigned: "Alex Rodriguez",
              forOfferings: ["math201-wt1-24-anderson", "math201-wt1-24-williams"],
            },
            {
              id: "math201-wt1-24-tut2",
              section: "Tutorial 02",
              day: "Thursday",
              time: "2:00 PM - 3:00 PM",
              location: "Math 302",
              taAssigned: "Sarah Kim",
              forOfferings: ["math201-wt1-24-anderson", "math201-wt1-24-williams"],
            },
          ],
        },
      },
    },
    {
      id: "phys301",
      code: "PHYS 301",
      title: "Quantum Mechanics",
      department: "Physics",
      description: "Introduction to quantum mechanical principles",
      offerings: [
        {
          id: "phys301-wt1-24",
          year: "2024",
          term: "Winter Term 1",
          instructor: "Dr. Robert Taylor",
          section: "Section A",
          requirements: {
            specialRequirements: ["Graduate student preferred", "Physics background required"],
          },
        },
      ],
      sharedSessions: {
        "Winter Term 1-2024": {
          labs: [
            {
              id: "phys301-wt1-24-lab1",
              section: "Lab 01",
              day: "Wednesday",
              time: "2:00 PM - 5:00 PM",
              location: "Physics Lab A",
              taAssigned: "David Park",
              forOfferings: ["phys301-wt1-24"],
            },
            {
              id: "phys301-wt1-24-lab2",
              section: "Lab 02",
              day: "Friday",
              time: "9:00 AM - 12:00 PM",
              location: "Physics Lab B",
              taAssigned: null,
              forOfferings: ["phys301-wt1-24"],
            },
          ],
          tutorials: [],
        },
      },
    },
  ]
  