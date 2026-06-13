import { FiSearch } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState,useRef } from "react";
import styles from "./Header.module.css";
import axios from "axios";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const searchRef = useRef(null); // ✅ for detecting outside clicks

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  // ✅ Fetch search results
  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length < 3) {
      setResults([]);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/search-news?q=${encodeURIComponent(value)}`
      );
      setResults(res.data);
    } catch (err) {
      console.error("Error searching news:", err);
    }
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setResults([]); // close dropdown
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Close dropdown when pressing Escape
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setResults([]);
      setQuery("");
    }
  };

  return (
    <header className={styles.header}>
      <h1
        className={styles.logo}
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
        Paperboy
      </h1>

      {/* ✅ Search Bar */}
      <div
        className={styles.searchContainer}
        style={{ position: "relative" }}
        ref={searchRef}
      >
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search news markets"
          value={query}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          className={styles.searchInput}
        />

        {/* ✅ Dropdown Results */}
        {results.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              background: "#111c33",
              borderRadius: "8px",
              marginTop: "6px",
              padding: "8px 0",
              listStyle: "none",
              zIndex: 999,
              maxHeight: "320px",
              overflowY: "auto",
            }}
          >
            {results.map((r, i) => (
              <li
                key={i}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #1e293b",
                  color: "white",
                }}
                onClick={() => {
                  window.open(r.url, "_blank");
                  setResults([]); // ✅ close after clicking
                  setQuery("");
                }}
              >
                {r.title}{" "}
                <span style={{ color: "#00b4d8", fontSize: "0.8rem" }}>
                  ({r.source})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Auth Section (unchanged) */}
      <div className={styles.authLinks}>
        {isLoggedIn ? (
          <div className={styles.userMenu}>
            <div
              className={styles.profileIcon}
              onClick={() => navigate("/profile")}
            >
              <img src="/profile.png" alt="Profile" className={styles.avatar} />
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className={styles.link}>
              Login
            </Link>
            <Link to="/register" className={styles.link}>
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
