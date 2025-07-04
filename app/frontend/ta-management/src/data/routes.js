export const ROUTES = [
    // Student Routes
    {
        name: "student dashboard",
        path: "/student-dashboard",
        authorizedRoles: ["student"],
    },
    {
        name: "student profile",
        path: "/profile",
        authorizedRoles: ["student"],
    },
    {
        name: "application",
        path: "/application",
        authorizedRoles: ["student"],
    },

    // Instructor Routes
    {
        name: "instructor dashboard",
        path: "/instructor-dashboard",
        authorizedRoles: ["instructor"],
    },

    // Scheduler Routes
    {
        name: "scheduler dashboard",
        path: "/scheduler-dashboard",
        authorizedRoles: ["scheduler"],
    },
    {
        name: "scheduler profile",
        path: "/user-profile-scheduler",
        authorizedRoles: ["scheduler"],
    },
    {
        name: "ta allocation",
        path: "/ta-coordinator-allocation",
        authorizedRoles: ["scheduler"],
    },
    {
        name: "course management",
        path: "/course-management",
        authorizedRoles: ["scheduler"],
    },

    // Admin
    {
        name: "admin dashboard",
        path: "/admin-dashboard",
        authorizedRoles: ["admin"],
    }
]