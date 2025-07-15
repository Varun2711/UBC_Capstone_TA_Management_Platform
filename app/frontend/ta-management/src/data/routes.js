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
        name: "apply",
        path: "/apply",
        authorizedRoles: ["student"],
    },

    // Instructor Routes
    {
        name: "instructor dashboard",
        path: "/instructor-dashboard",
        authorizedRoles: ["instructor"],
    },
    {
        name: "instructor my courses",
        path: "/my-courses",
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
    {
        name: "instructor management",
        path: "/instructor-management",
        authorizedRoles: ["scheduler"],
    },
    {
        name: "manage applications",
        path: "/manage-applications",
        authorizedRoles: ["scheduler"],
    },

    // Admin
    {
        name: "admin dashboard",
        path: "/admin-dashboard",
        authorizedRoles: ["admin"],
    }
]