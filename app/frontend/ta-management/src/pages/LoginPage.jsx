import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function loginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Dummy check: accept any non-empty credentials
    if (username && password) {
      alert("Login successful!");
      navigate("/dashboard"); // redirect to a dummy dashboard page
    } else {
      alert("Please enter a username and password.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login Page</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Login
        </button>
      </form>
    </div>
  );
}

