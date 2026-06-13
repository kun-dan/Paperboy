const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const Question = require("./models/question");
const { generateNewsPolls } = require("./newsPollGenerator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const UserStats = require("./models/UserStats");
const axios = require("axios");

const JWT_SECRET = "paperboy_secret"; // ideally from process.env


dotenv.config();

// 👇 Add this line right after dotenv.config()
console.log("✅ Loaded NEWS_API_KEY:", process.env.NEWS_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/paperboy", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// Routes
app.get("/", (req, res) => res.send("Backend running..."));

// Get all polls
app.get("/api/questions", async (req, res) => {
  try {
    const category = req.query.category?.toLowerCase() || "all";
    let data;

    if (category === "all") {
      // 🧩 For 'For You' → random 10 questions
      data = await Question.aggregate([{ $sample: { size: 10 } }]);
    } else if (category === "trending") {
      // 🔥 For 'Trending' → shuffle all questions randomly (different each time)
      const all = await Question.find();
      // Fisher–Yates shuffle
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      data = all.slice(0, 10); // limit to 10
    } else {
      // 🏷️ Specific category (politics, science, etc.)
      data = await Question.find({ category });
    }

    res.json(data);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ message: "Error fetching questions" });
  }
});




// Submit vote
app.post("/api/answer", async (req, res) => {
  try {
    const { id, selected, token } = req.body;
    const q = await Question.findById(id);
    if (!q) return res.status(404).json({ message: "Question not found" });

    const correct =
      q.options.find((o) => o.name === selected)?.isCorrect || false;

    // ✅ Update user stats if logged in
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;

      let stats = await UserStats.findOne({ userId });
      if (!stats) {
        stats = await UserStats.create({
          userId,
          attempted: 0,
          correct: 0,
        });
      }

      stats.attempted += 1;
      if (correct) stats.correct += 1;

      await stats.save();
    }

    res.json({ correct, link: q.articleUrl });
  } catch (err) {
    console.error("Error updating stats:", err);
    res.status(500).json({ message: "Error recording answer" });
  }
});

app.get("/api/add", async (req, res) => {
  const q = new Question({
    title: "Who won the 2024 ICC T20 World Cup?",
    options: [
      { name: "India", isCorrect: true },
      { name: "Australia", isCorrect: false },
      { name: "England", isCorrect: false },
    ],
    articleUrl: "https://www.cbsnews.com/sports/t20worldcup2024",
  });
  await q.save();
  res.send("✅ Question added");
});

app.get("/api/generate-news", async (req, res) => {
  try {
    await generateNewsPolls();
    res.send("✅ Generated new polls from live news");
  } catch (err) {
    console.error("❌ Error in /api/generate-news:", err);
    res.status(500).send("Error generating news polls");
  }
});

app.get("/api/search-news", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: "Missing query" });

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      query
    )}&language=en&pageSize=10&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`;

    const { data } = await axios.get(url);

    const results = data.articles.map((article) => ({
      title: article.title,
      url: article.url,
      source: article.source.name,
    }));

    res.json(results);
  } catch (err) {
    console.error("Error fetching search results:", err.message);
    res.status(500).json({ message: "Error fetching search results" });
  }
});

// ✅ REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashed });

    res.json({ message: "✅ User registered successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// ✅ LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "✅ Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});
app.get("/api/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "Authorization header missing" });

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token)
      return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Get user stats
    const statsDoc = await UserStats.findOne({ userId: user._id });
    const stats = {
      attempted: statsDoc?.attempted || 0,
      correct: statsDoc?.correct || 0,
    };

    // ✅ Build real leaderboard from all users
    const allStats = await UserStats.find().populate("userId", "username");
    const leaderboard = allStats.map((s) => ({
      username: s.userId.username,
      accuracy: s.attempted > 0 ? (s.correct / s.attempted) * 100 : 0,
    }));

    leaderboard.sort((a, b) => b.accuracy - a.accuracy);

    // ✅ Optional: find current user's rank
    const userRank =
      leaderboard.findIndex((p) => p.username === user.username) + 1;

    res.json({ user, stats, leaderboard, userRank });
  } catch (err) {
    console.error("❌ Error loading profile:", err.message);
    res.status(500).json({ message: "Error loading profile" });
  }
});



app.listen(5000, () => console.log("🚀 Server running on port 5000"));
