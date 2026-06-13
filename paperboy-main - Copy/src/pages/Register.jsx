import { useState } from "react";
import axios from "axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/register", {
        username,
        email,
        password,
      });
      setMessage("✅ Registered successfully!");
    } catch (err) {
      setMessage("❌ " + err.response.data.message);
    }
  };

  return (
    <div style={{ color: "white", textAlign: "center", marginTop: "5rem" }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit} style={{ display: "inline-block", textAlign: "left" }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ margin: "10px", padding: "8px", width: "250px" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ margin: "10px", padding: "8px", width: "250px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ margin: "10px", padding: "8px", width: "250px" }}
        />
        <button type="submit" style={{ padding: "8px 20px", cursor: "pointer" }}>
          Register
        </button>
      </form>
      <p>{message}</p>
    </div>
  );
}
