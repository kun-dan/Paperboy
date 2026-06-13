const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
});

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    options: [optionSchema],
    articleUrl: { type: String, required: true },

    // ✅ Added category field for filtering
    category: {
      type: String,
      required: true,
      lowercase: true,
      enum: [
        "world",
        "politics",
        "business",
        "technology",
        "sports",
        "science",
        "entertainment",
        "health",
        "general",
      ],
      index: true, // speeds up queries like ?category=politics
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
