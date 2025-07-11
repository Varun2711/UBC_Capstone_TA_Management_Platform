import { useEffect, useState } from "react";

/*
Custom hook to handle fetching the current user (instructor)'s 
courses to be displayed on their 'My Courses' page. 
For now this is mocked but future will make API calls
*/
export function useMyCourses() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // todo: make request to api to get the data we need

                // Info I Need:
                // 1. Course offerings that the currently logged-in instructor
                // is teaching AND that take place within the current academic
                // session (EX: Winter 2025/26)
                // 2. For each of those course offerings, I need the actual
                // course that is associated

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