import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini SDK with custom user agent as requested in guidelines
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limits for large feed datasets
app.use(express.json({ limit: "10mb" }));

// Default Feed Sources
const DEFAULT_FEEDS = [
  {
    id: "techcrunch",
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "Technology",
    isDefault: true,
    isEnabled: true,
  },
  {
    id: "nasa",
    name: "NASA Breaking News",
    url: "https://www.nasa.gov/news-release/feed/",
    category: "Science",
    isDefault: true,
    isEnabled: true,
  },
  {
    id: "bbc-world",
    name: "BBC News - World",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "World News",
    isDefault: true,
    isEnabled: true,
  },
  {
    id: "nyt-tech",
    name: "New York Times - Technology",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    category: "Technology",
    isDefault: true,
    isEnabled: true,
  },
  {
    id: "sciencedaily",
    name: "Science Daily",
    url: "https://www.sciencedaily.com/rss/all.xml",
    category: "Science",
    isDefault: true,
    isEnabled: true,
  },
  {
    id: "nature",
    name: "Nature Journal News",
    url: "https://www.nature.com/nature.rss",
    category: "Science",
    isDefault: true,
    isEnabled: true,
  }
];

// Helper to clean XML/HTML text and decode common XML entities
function cleanXmlText(str: string): string {
  if (!str) return "";
  // Extract content inside CDATA tags if present
  let clean = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
  // Decode basic HTML/XML entities
  clean = clean
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
  // Strip any remaining inner HTML tags for security and cleaner text
  clean = clean.replace(/<[^>]*>/g, "");
  // Normalize whitespace
  clean = clean.replace(/\s+/g, " ");
  return clean.trim();
}

// Custom RSS and Atom Feed Parser
function parseRSS(xmlText: string, feedId: string, customFeedName?: string) {
  const items: any[] = [];
  
  // Extract Feed Title if possible
  let feedTitle = customFeedName || "Unknown Feed";
  const channelTitleMatch = xmlText.match(/<channel>[\s\S]*?<title>([\s\S]*?)<\/title>/i) || 
                            xmlText.match(/<feed>[\s\S]*?<title>([\s\S]*?)<\/title>/i);
  if (channelTitleMatch && !customFeedName) {
    feedTitle = cleanXmlText(channelTitleMatch[1]);
  }

  // Regex to match <item> (RSS 2.0) or <entry> (Atom)
  const itemRegex = /<(item|entry)>([\s\S]*?)<\/\1>/gi;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[2];
    
    // Extract title
    let title = "";
    const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      title = cleanXmlText(titleMatch[1]);
    }
    
    // Extract link
    let link = "";
    const linkMatch = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    if (linkMatch) {
      link = cleanXmlText(linkMatch[1]);
    } else {
      // Check Atom-style link attribute: <link rel="alternate" href="url"/> or <link href="url"/>
      const atomLinkMatch = itemContent.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (atomLinkMatch) {
        link = atomLinkMatch[1];
      }
    }
    
    // Extract description / summary / content
    let description = "";
    const descMatch = itemContent.match(/<(description|summary|content|content:encoded[^>]*)>([\s\S]*?)<\/\1>/i);
    if (descMatch) {
      description = cleanXmlText(descMatch[2]);
    }
    
    // Extract date
    let pubDate = "";
    const dateMatch = itemContent.match(/<(pubDate|published|updated|dc:date)>([\s\S]*?)<\/\1>/i);
    if (dateMatch) {
      pubDate = cleanXmlText(dateMatch[2]);
    }
    
    // Extract author / creator
    let author = "";
    const authorMatch = itemContent.match(/<(dc:creator|author|creator)>([\s\S]*?)<\/\1>/i);
    if (authorMatch) {
      author = cleanXmlText(authorMatch[2]);
      const authorNameMatch = author.match(/<name>([\s\S]*?)<\/name>/i);
      if (authorNameMatch) {
        author = cleanXmlText(authorNameMatch[1]);
      }
    }

    if (title || description) {
      items.push({
        title: title || "Untitled Article",
        link: link || "#",
        description: description ? (description.length > 300 ? description.substring(0, 300) + "..." : description) : "No summary available.",
        pubDate: pubDate || new Date().toUTCString(),
        author: author || undefined,
        feedTitle,
        feedId
      });
    }
  }
  
  return items;
}

// 1. GET /api/default-feeds
app.get("/api/default-feeds", (req, res) => {
  res.json(DEFAULT_FEEDS);
});

// 2. POST /api/fetch-rss - Scrapes feed content on server-side to prevent CORS issues
app.post("/api/fetch-rss", async (req, res) => {
  try {
    const { feeds } = req.body;
    if (!feeds || !Array.isArray(feeds)) {
      return res.status(400).json({ error: "Missing feeds array" });
    }

    const results: any[] = [];
    
    // Fetch multiple feeds concurrently with timeout protection
    const fetchPromises = feeds.map(async (feed: any) => {
      try {
        if (!feed || typeof feed !== "object" || !feed.url) {
          console.warn("Invalid feed skipped in fetch-rss:", feed);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PersonalizedNewsDigest/1.0",
            Accept: "application/rss+xml, application/rdf+xml, application/atom+xml, application/xml, text/xml",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const xmlText = await response.text();
        const parsedItems = parseRSS(xmlText, feed.id, feed.name);
        
        // Limit to max 15 newest items per feed to avoid overwhelming the model or exceeding token limits
        results.push(...parsedItems.slice(0, 15));
      } catch (err: any) {
        console.error(`Failed to fetch/parse feed ${feed?.name || "Unknown"} (${feed?.url || "No URL"}):`, err.message);
        // We don't fail the whole request, just log and skip this feed or return a partial success
      }
    });

    await Promise.all(fetchPromises);

    // Sort results by date descending (approximate parsing)
    results.sort((a, b) => {
      const timeA = new Date(a.pubDate).getTime();
      const timeB = new Date(b.pubDate).getTime();
      if (isNaN(timeA) || isNaN(timeB)) return 0;
      return timeB - timeA;
    });

    res.json(results);
  } catch (err: any) {
    console.error("Internal server error in /api/fetch-rss:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
});

// 3. POST /api/generate-digest - Uses Gemini to filter, match, and compile articles into a themed daily digest
app.post("/api/generate-digest", async (req, res) => {
  const { name, interests, articles } = req.body;

  if (!interests || !Array.isArray(interests) || interests.length === 0) {
    return res.status(400).json({ error: "Interests are required to generate a digest" });
  }

  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return res.status(400).json({ error: "No articles available to generate a digest. Please enable feeds." });
  }

  if (!apiKey) {
    return res.status(500).json({ 
      error: "Gemini API key is not configured. Please add it via the Secrets panel in Settings." 
    });
  }

  try {
    const userName = name || "Reader";
    
    // Prepare a concise presentation of articles to Gemini to avoid exceeding context tokens
    const simplifiedArticles = articles.map((art, index) => ({
      index,
      title: art.title,
      description: art.description,
      source: art.feedTitle || "Unknown Source",
      pubDate: art.pubDate,
      link: art.link
    }));

    const systemPrompt = `You are an elite, highly professional personalized news curator and editor.
Your task is to take a raw set of recent news articles, match them to the user's specific interest list, and craft a beautifully integrated, premium, magazine-style morning news digest.

User name: ${userName}
User specific interests: ${interests.join(", ")}

Guidelines:
1. Review all articles and select the ones that align best with the user's specified interests. Ignore completely irrelevant articles.
2. Group the selected articles into 2 to 4 thematic categories (based on the user's interests).
3. For each category/section, write an 'overview' paragraph that synthesizes the news trends in an engaging, editorial tone.
4. For each selected article, provide:
   - A highly accurate relevance score (1-10) indicating how well it matches the user's specific interests.
   - The specific interest category it matched.
   - A snappy, highly informative 1-2 sentence summary.
   - An actionable insight or thought-provoking question for the reader.
5. Create an overarching, elegant digest title (e.g., "The Morning Brief: Breakdowns, Discoveries, and Tech Leaps")
6. Write a warm, personalized greeting acknowledging the user's name and high-level summary of what their digest contains today.
7. Provide 3-5 high-level bulleted 'Key Takeaways' representing the most critical macro trends from today's feed.
8. End with a highly motivating, personalized 'morningQuote' to start the day.

You must return a structured JSON response matching the required schema. Ensure all URLs/links from the original articles are preserved exactly.`;

    const userPrompt = `Here is the list of recent news articles to curate and synthesize:
${JSON.stringify(simplifiedArticles)}

Analyze these articles, filter out any duplicates or highly low-quality entries, prioritize matches to the interests [${interests.join(", ")}], and generate the structured digest.`;

    // Call Gemini 3.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            digestTitle: { type: Type.STRING },
            greeting: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "Category name matching user interests or feed themes" },
                  overview: { type: Type.STRING, description: "A elegant 2-3 sentence overview of this news section" },
                  articles: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        link: { type: Type.STRING },
                        source: { type: Type.STRING },
                        relevanceScore: { type: Type.INTEGER },
                        interestMatch: { type: Type.STRING },
                        briefSummary: { type: Type.STRING },
                        actionableInsight: { type: Type.STRING }
                      },
                      required: ["title", "link", "source", "relevanceScore", "interestMatch", "briefSummary", "actionableInsight"]
                    }
                  }
                },
                required: ["category", "overview", "articles"]
              }
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            morningQuote: { type: Type.STRING }
          },
          required: ["digestTitle", "greeting", "sections", "keyTakeaways", "morningQuote"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text returned from Gemini");
    }

    const parsedDigest = JSON.parse(text);
    res.json(parsedDigest);
  } catch (err: any) {
    console.error("Gemini Digest Generation Error:", err);
    res.status(500).json({ error: "Failed to generate personalized digest: " + err.message });
  }
});

// Configure Vite middleware and static routes
async function startServer() {
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
      try {
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } catch (err) {
        console.error("Failed to start Vite dev server:", err);
      }
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  // Only listen to the port when we are not running as a Vercel serverless function
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
