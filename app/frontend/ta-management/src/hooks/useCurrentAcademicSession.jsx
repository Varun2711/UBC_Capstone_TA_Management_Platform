/*
Custom hook to fetch the current academic session (for EX,
2025/26 Winter) from the courses api

STATUS: in progress (currently mocked but will make API calls once service is ready)
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
                // todo: make request to api to get the data we need
                //const response = await axios.get('');
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