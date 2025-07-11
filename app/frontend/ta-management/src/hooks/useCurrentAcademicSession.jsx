/*
Custom hook to fetch the current academic session (for EX,
2025/26 Winter) using the courses api

STATUS: WORK IN PROGRESS
- Can't test this yet because api not finished, but it's
here for when we need it. Currently mocked for testing
*/

import axios from "axios";
import { useEffect, useState } from "react";

const API_URL = 'http://localhost:8080/api';

export function useCurrentAcademicSession() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                //const response = await axios.get('/course-term-service/terms/active');
                //setData(response.data)

                // hardcoded for now to fake it
                const mockApiResponse = {
                    term_type: "Winter",
                    academic_year: "2025/26"
                }
                setData(mockApiResponse);
                
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return { data, loading, error };
}