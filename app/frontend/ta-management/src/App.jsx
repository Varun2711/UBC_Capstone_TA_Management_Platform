import { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MockDashboard from "./pages/MockDashboard";
function App() {
  // define a message state variable
  const [message, setMessage] = useState("");
  const message_url = "/api/hello"; // update the api call to have a relative address instead of a direct address
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
        console.log(`error has occurred ${error}`);
      });
  }, []);

  return (
    // React Router setup, commented out for now
    // Initial test to check router functionlity below
    <Routes>
      {/*The following message is just for testing purposes*/}
      {console.log(message)}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<MockDashboard />} />
      {/* Add more routes if needed */}
    </Routes>
    // <TASchedulerDashboard />
  );
}
export default App;
