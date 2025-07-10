/*
This file contains login credentials and other relevant info for each user type.
Use this any time you need to login a user for testing; just import the file and
then access as an array of objects.
For an example of how to test the same scenario across each user_type, see 
LoginPage.test.jsx, approx. line 77
*/

import { DASHBOARD_ROUTES, USER_TYPES } from "@/data/user-types";

export const USERS = [
    {
      type: USER_TYPES.student,
      email: "sarah.johnson@student.ubc.ca",
      password: "password123",
      user_id: "1",
      name: "Sarah Johnson",
      dashboardRoute: DASHBOARD_ROUTES.student
    },

    {
      type: USER_TYPES.instructor,
      email: "david.martinez@ubc.ca",
      password: "password123",
      user_id: "2",
      name: "Dr. David Martinez",
      dashboardRoute: DASHBOARD_ROUTES.instructor
    },

    {
      type: USER_TYPES.scheduler,
      email: "jennifer.smith@ubc.ca",
      password: "password123",
      user_id: "3",
      name: "Dr. Jennifer Smith",
      dashboardRoute: DASHBOARD_ROUTES.scheduler
    },

    {
      type: USER_TYPES.admin,
      email: "brian.mills@ubc.ca",
      password: "password123",
      user_id: "4",
      name: "Brian Mills",
      dashboardRoute: DASHBOARD_ROUTES.admin
    }
  ]