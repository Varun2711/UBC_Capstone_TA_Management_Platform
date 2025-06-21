// Set of helper functions that send correctly formatted requests to the auth service
// and return the response
// Currently just student login but will be added to as needed

import axios from "axios"

const API_URL = 'http://localhost:8080/api'

// sends a post request w login info for student user
export const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login/`, {
        email,
        password
    })

    return response.data
}