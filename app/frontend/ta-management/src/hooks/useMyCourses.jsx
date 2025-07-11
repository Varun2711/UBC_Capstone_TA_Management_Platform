/*
Custom hook to handle fetching the current user (instructor)'s 
courses to be displayed on their 'My Courses' page. 

STATUS: in progress (currently mocked but will make API calls once service is ready)
*/

import axios from "axios";
import { useEffect, useState } from "react";

const API_URL = 'http://localhost:8080/api';

export function useMyCourses() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // todo: make request to api to get the data we need
                // but for now, we mock so that it's useable.
                // why i did it this way? hoping that setting these up
                // right off the bat = less rework once the api is complete
                const mockApiResponse = {
                    "courses": [
                        {
                            "id": 1,
                            "course_number": "COSC101",
                            "title": "Digital Citizenship",
                            "section": "001",
                            "term_number": 1
                        },
                        {
                            "id": 2,
                            "course_number": "COSC111",
                            "title": "Computer Programming I",
                            "section": "001",
                            "term_number": 1
                        },
                        {
                            "id": 3,
                            "course_number": "COSC211",
                            "title": "Machine Architecture",
                            "section": "002",
                            "term_number": 1
                        },
                        {
                            "id": 4,
                            "course_number": "COSC121",
                            "title": "Computer Programming II",
                            "section": "002",
                            "term_number": 2
                        },
                        {
                            "id": 5,
                            "course_number": "COSC315",
                            "title": "Operating Systems",
                            "section": "001",
                            "term_number": 2
                        }
                    ]
                }

                setData(mockApiResponse);
            } catch (err) {
                setError(err)
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return { data, loading, error };
}