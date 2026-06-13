const axios = require("axios");
const Question = require("./models/question");

/**
 * Fetch latest news and generate unique poll questions dynamically.
 */
async function generateNewsPolls() {
  try {
    const topics = [
      "world",
      "politics",
      "business",
      "technology",
      "sports",
      "science",
      "entertainment",
      "health",
    ];

    let allArticles = [];

    // 🔁 Fetch 20 articles for each topic
    for (const topic of topics) {
      const url = `https://newsapi.org/v2/top-headlines?country=us&category=${topic}&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`;
      const { data } = await axios.get(url);

      if (data.articles && data.articles.length > 0) {
        // ✅ Add category info to each article
        const categorized = data.articles.map((a) => ({
          ...a,
          category: topic,
        }));
        allArticles = allArticles.concat(categorized);
      }
    }

    if (allArticles.length === 0) {
      console.log("⚠️ No news articles found.");
      return;
    }

    console.log("Fetched total articles before filtering:", allArticles.length);

    // 🧹 Remove duplicates using article URL
    const uniqueArticlesMap = new Map();
    for (const article of allArticles) {
      if (article.url && !uniqueArticlesMap.has(article.url)) {
        uniqueArticlesMap.set(article.url, article);
      }
    }

    const uniqueArticles = Array.from(uniqueArticlesMap.values());
    console.log(
      "Unique articles after removing duplicates:",
      uniqueArticles.length
    );

    // 🗳️ Convert articles into polls
    const polls = uniqueArticles.map((article) => {
      const title =
        article.title?.replace(/ - .*$/, "") || "Latest news update";
      const randomOptions = generateOptions(title);
      return {
        title: `${title}?`,
        options: randomOptions,
        articleUrl: article.url,
        category: article.category || "general", // ✅ stores NewsAPI category
      };
    });

    // 💾 Clear old polls before inserting new ones
    await Question.deleteMany({});
    console.log("🗑️ Cleared old polls");

    await Question.insertMany(polls);
    console.log(`✅ Added ${polls.length} new unique polls from news`);
  } catch (error) {
    console.error("❌ Error generating news polls:", error.message);
  }
}

/**
 * Generate fake but sensible options.
 */
function generateOptions(title) {
  const keywords = title.split(" ").slice(0, 3);
  const fake1 = (keywords[0] || "global") + " policy";
  const fake2 = (keywords[1] || "market") + " scandal";
  const fake3 = (keywords[2] || "tech") + " statement";

  return [
    { name: title, isCorrect: true },
    { name: fake1, isCorrect: false },
    { name: fake2, isCorrect: false },
    { name: fake3, isCorrect: false },
  ].filter(Boolean);
}

module.exports = { generateNewsPolls };
