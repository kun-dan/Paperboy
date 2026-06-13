import { useEffect, useState } from "react";
import axios from "axios";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ attempted: 0, correct: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data.user);
        setStats(res.data.stats);
        setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading)
    return (
      <div
        style={{
          color: "white",
          textAlign: "center",
          marginTop: "5rem",
          fontSize: "1.2rem",
        }}
      >
        Loading profile...
      </div>
    );

  if (!user)
    return (
      <div
        style={{
          color: "white",
          textAlign: "center",
          marginTop: "5rem",
          fontSize: "1.2rem",
        }}
      >
        Couldn’t load profile. Please log in again.
      </div>
    );

  const accuracy =
    stats.attempted > 0
      ? ((stats.correct / stats.attempted) * 100).toFixed(1)
      : 0;

  return (
    <div
      style={{
        color: "white",
        textAlign: "center",
        marginTop: "3rem",
        padding: "20px",
      }}
    >
      {/* USER INFO */}
      <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        👤 {user.username}
      </h2>
      <p style={{ color: "#a1a1aa" }}>{user.email}</p>

      {/* STATS CARD */}
      <div
        style={{
          background: "#111c33",
          borderRadius: "12px",
          padding: "20px",
          width: "60%",
          margin: "2rem auto",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>📊 Quiz Stats</h3>
        <p>Questions Attempted: {stats.attempted}</p>
        <p>Correct Answers: {stats.correct}</p>
        <p>
          Accuracy:{" "}
          <span style={{ color: "#00b4d8", fontWeight: "bold" }}>
            {accuracy}%
          </span>
        </p>

        {/* Progress bar */}
        <div
          style={{
            background: "#1e293b",
            borderRadius: "8px",
            height: "10px",
            marginTop: "10px",
          }}
        >
          <div
            style={{
              width: `${accuracy}%`,
              background: "#00b4d8",
              height: "100%",
              borderRadius: "8px",
              transition: "width 0.6s ease",
            }}
          ></div>
        </div>
      </div>

      {/* LEADERBOARD CARD */}
      <div
        style={{
          background: "#111c33",
          borderRadius: "12px",
          padding: "20px",
          width: "70%",
          margin: "2rem auto",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>🌍 Global Leaderboard</h3>
        <table
          style={{
            margin: "0 auto",
            width: "100%",
            borderCollapse: "collapse",
            color: "white",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                User
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Accuracy
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((u, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid #1e293b",
                  background: i % 2 === 0 ? "#0f172a" : "#111c33",
                }}
              >
                <td style={{ padding: "10px 16px", textAlign: "left" }}>
                  {u.username}
                </td>
                <td
                  style={{
                    padding: "10px 16px",
                    textAlign: "center",
                    color: "#00b4d8",
                  }}
                >
                  {u.accuracy.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
