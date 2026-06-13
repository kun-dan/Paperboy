// src/App.jsx
import './index.css';
import styles from './App.module.css';

import Header from './components/Header';
import CategoryNav from './components/CategoryNav';
import NewsCarousel from './components/NewsCarousel';
import PredictionCard from './components/PredictionCard';
import PollCard from './components/PollCard';

import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [questions, setQuestions] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");

  // ✅ Fetch polls by category
  const fetchQuestions = async (category = "all") => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/questions?category=${category}`
      );
      setQuestions(res.data);
      setActiveCategory(category);
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  };

  // ✅ Load all polls initially
  useEffect(() => {
    fetchQuestions();
  }, []);

  return (
    <div className={styles.container}>
      <Header />
      <CategoryNav onCategorySelect={fetchQuestions} activeCategory={activeCategory} />
      <NewsCarousel />

      <section className={styles.predictionsSection}>
        <h2 style={{ color: "white", margin: "20px 0" }}>🗳️ Live Polls</h2>

        {/* ✅ Dynamic Polls Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            marginTop: "30px",
            paddingBottom: "40px",
          }}
        >
          {questions.length > 0 ? (
            questions.map((q) => <PollCard key={q._id} question={q} />)
          ) : (
            <p style={{ color: "gray", fontSize: "1.1rem" }}>
              No questions found in this category.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
