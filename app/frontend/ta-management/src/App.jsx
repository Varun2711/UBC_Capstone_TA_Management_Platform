import { useState, useEffect } from "react";
import TASchedulerDashboard from "./pages/Scheduler_Dashboard";
import StudentDashboard from "./pages/Student_Dashboard";

function App() {
  // define a message state variable
  const [message, setMessage] = useState("");
  const message_url = "http://localhost:8000/api/hello";
  // make an api call with fetch
  useEffect(() => {
    fetch(message_url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
      })
      .catch((error) => {
        throw new Error(`error occurred ${error}`);
      });
  }, []);

  //return <TASchedulerDashboard /> ;
  
  // Uncomment the line below to switch to the Student Dashboard and comment the above return statement
  return <StudentDashboard />;
}
export default App;
