import { useState, useEffect } from "react";
import {Route, Routes} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MockDashboard from "./pages/MockDashboard";
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

  return (
    // React Router setup, commented out for now
    // Initial test to check router functionlity below
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/MockDashboard" element={<MockDashboard />} />
      {/* Add more routes if needed */}
    </Routes>
    // <TASchedulerDashboard />
  );
}
export default App;
