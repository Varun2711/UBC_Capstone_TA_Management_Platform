/*
This file contains login credentials and other relevant info for each user type.
Use this anytime you need to login a user for testing; just import the file and
then access as an array of objects.
For an example of how to test the same scenario across each user type, see 
LoginPage.test.jsx, approx. line 77
*/

export const USERS = {
  student: 0,
  instructor: 1,
  scheduler: 2
}

export const user_types = [
    {
      name: "student",
      email: "percy@camphalfblood.edu",
      password: "password123",
      dashboardRoute: "/student-dashboard"
    },

    {
      name: "instructor",
      email: "snape@hogwarts.edu",
      password: "password123",
      dashboardRoute: "/instructordashboard"
    },

    {
      name: "scheduler",
      email: "cena@wwe.com",
      password: "password123",
      dashboardRoute: "/tadashboard"
    }
  ]