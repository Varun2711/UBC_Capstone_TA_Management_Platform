/*
* Helper function to get/return dashboard link for a given user type
* Params: userType: student, instructor, scheduler, or admin
*/

import { DASHBOARD_ROUTES, USER_TYPES } from "@/data/user-types"

export function getDashboardLink(userType) {
    switch(userType) {
        case USER_TYPES.student:
            return DASHBOARD_ROUTES.student;
        case USER_TYPES.instructor:
            return DASHBOARD_ROUTES.instructor;
        case USER_TYPES.scheduler:
            return DASHBOARD_ROUTES.scheduler;  
        case USER_TYPES.admin:
            return DASHBOARD_ROUTES.admin;
    }

    return "/" // userType not found, return to landing page

}