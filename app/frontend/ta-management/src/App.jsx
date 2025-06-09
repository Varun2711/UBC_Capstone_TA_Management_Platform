import { useState, useEffect } from "react";

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
    <div>
      <h1>TA Management Platform</h1>
      <p>{message}</p>
      <h1 class="text-3xl font-bold underline">
  Checking Tailwind
</h1>
    </div>
  );
}
export default App;
