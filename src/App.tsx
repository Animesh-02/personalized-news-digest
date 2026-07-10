import React, { useState, useEffect } from "react";
import { 
  Sun, 
  Moon, 
  Rss, 
  Sparkles, 
  BookOpen, 
  Settings, 
  History, 
  User, 
  RefreshCw, 
  AlertCircle, 
  Info,
  Layers,
  ArrowRight,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { FeedSource, FeedItem, DailyDigest, DEFAULT_FEEDS } from "./types";
import InterestConfig from "./components/InterestConfig";
import FeedConfig from "./components/FeedConfig";
import DigestViewer from "./components/DigestViewer";
import DigestArchive from "./components/DigestArchive";
import LatestArticles from "./components/LatestArticles";

// Standard pre-populated beautiful digest to serve as a high-fidelity onboarding/example experience
const ONBOARDING_DIGEST: DailyDigest = {
  id: "welcome-digest",
  createdAt: new Date().toISOString(),
  digestTitle: "The Aurora Briefing: Intelligence Leaps, Cosmic Horizons & Market Resilience",
  greeting: "Welcome! This is an example of a tailored morning newsletter. Once you add your custom topics and RSS feeds, Gemini will synthesize a personalized brief like this every morning, selecting from your active feeds to match your unique interests.",
  interests: ["Artificial Intelligence", "Space Exploration", "Macroeconomics"],
  sections: [
    {
      category: "Artificial Intelligence",
      overview: "Substantial breakthroughs in multimodal reasoning and agentic workflows are reshaping developer software patterns and standard system orchestrations.",
      articles: [
        {
          title: "Gemini 3.5 Flash Streamlines Autonomous Orchestration Pipelines",
          link: "https://techcrunch.com",
          source: "TechCrunch",
          relevanceScore: 10,
          interestMatch: "Artificial Intelligence",
          briefSummary: "The latest models excel at executing complex, tool-integrated workflows with significantly reduced processing latencies and native schema outputs.",
          actionableInsight: "Consider how agentic reasoning could automate your repetitive news aggregation or data analysis pipelines."
        }
      ]
    },
    {
      category: "Space Exploration",
      overview: "Innovative orbital arrays and deep-space spectrography sensors are sending highly refined data streams back to cosmic research hubs.",
      articles: [
        {
          title: "Spectacular Nebulae Formations Mapped by High-Resolution Sensors",
          link: "https://www.nasa.gov/news-release/feed/",
          source: "NASA Breaking News",
          relevanceScore: 9,
          interestMatch: "Space Exploration",
          briefSummary: "Astrophysicists successfully trace molecular water and carbon compounds inside infant solar system nursery envelopes.",
          actionableInsight: "Observe how advanced remote sensing techniques constantly expand humanity's cosmic boundaries."
        }
      ]
    }
  ],
  keyTakeaways: [
    "Agentic, structured-reasoning models are driving down API invocation costs while increasing reliability.",
    "Spectrographic space imaging achieves higher sub-molecular precision, unlocking answers on star nurseries."
  ],
  morningQuote: "The cosmos is within us. We are made of star-stuff. We are a way for the cosmos to know itself. Have a wonderful morning and stay curious."
};

export default function App() {
  // --- 1. Persistent Storage State Initialization ---
  const [name, setName] = useState<string>(() => {
    return localStorage.getItem("news-digest-user-name") || "Jane Doe";
  });

  const [interests, setInterests] = useState<string[]>(() => {
    const saved = localStorage.getItem("news-digest-interests");
    return saved ? JSON.parse(saved) : ["Artificial Intelligence", "Space Exploration", "Macroeconomics"];
  });

  const [feeds, setFeeds] = useState<FeedSource[]>(() => {
    const savedFeeds = localStorage.getItem("news-digest-feeds");
    if (savedFeeds) {
      try {
        let parsed: FeedSource[] = JSON.parse(savedFeeds);
        let migrated = false;
        const mapped = parsed.map((f) => {
          if (
            f.id === "nyt-tech" &&
            (f.url === "https://rss.nytimes.com/services/xml/rss/technology.xml" ||
             f.url === "https://rss.nytimes.com/services/xml/rss/nyt/technology.xml")
          ) {
            migrated = true;
            return { ...f, url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml" };
          }
          return f;
        });
        if (migrated) {
          localStorage.setItem("news-digest-feeds", JSON.stringify(mapped));
        }
        return mapped;
      } catch (e) {
        console.error("Failed to parse feeds from localStorage:", e);
      }
    }
    // Fallback to default feeds if none are saved or parsing failed
    localStorage.setItem("news-digest-feeds", JSON.stringify(DEFAULT_FEEDS));
    return DEFAULT_FEEDS;
  });

  const [digests, setDigests] = useState<DailyDigest[]>(() => {
    const saved = localStorage.getItem("news-digest-archives");
    return saved ? JSON.parse(saved) : [ONBOARDING_DIGEST];
  });

  const [currentDigest, setCurrentDigest] = useState<DailyDigest | null>(() => {
    const saved = localStorage.getItem("news-digest-current");
    if (saved) return JSON.parse(saved);
    return ONBOARDING_DIGEST;
  });

  // --- 2. Runtime States ---
  const [rawArticles, setRawArticles] = useState<FeedItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("digest");
  
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);
  
  const [feedError, setFeedError] = useState<string | null>(null);
  const [digestError, setDigestError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // --- 3. Persistent Sync Effects ---
  useEffect(() => {
    localStorage.setItem("news-digest-user-name", name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem("news-digest-interests", JSON.stringify(interests));
  }, [interests]);

  useEffect(() => {
    localStorage.setItem("news-digest-archives", JSON.stringify(digests));
  }, [digests]);

  useEffect(() => {
    if (currentDigest) {
      localStorage.setItem("news-digest-current", JSON.stringify(currentDigest));
    } else {
      localStorage.removeItem("news-digest-current");
    }
  }, [currentDigest]);

  // Sync custom feeds to local storage
  const handleFeedsChange = (updatedFeeds: FeedSource[]) => {
    setFeeds(updatedFeeds);
    localStorage.setItem("news-digest-feeds", JSON.stringify(updatedFeeds));
  };

  // Reset all feeds to defaults instantly on the client-side
  const handleResetFeeds = () => {
    setFeeds(DEFAULT_FEEDS);
    localStorage.setItem("news-digest-feeds", JSON.stringify(DEFAULT_FEEDS));
  };

  // --- 4. Scraping & Parsing Handler ---
  const handleRefreshFeeds = async () => {
    setIsLoadingFeeds(true);
    setFeedError(null);
    try {
      const enabledFeeds = feeds.filter((f) => f.isEnabled);
      if (enabledFeeds.length === 0) {
        setFeedError("No feeds enabled. Please go to the 'Feeds' tab and enable at least one source.");
        setIsLoadingFeeds(false);
        return;
      }

      const response = await fetch("/api/fetch-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeds: enabledFeeds })
      });

      if (!response.ok) {
        throw new Error(`Server returned error code ${response.status}`);
      }

      const articles = await response.json();
      setRawArticles(articles);
    } catch (err: any) {
      setFeedError(err.message || "Failed to parse news feeds from RSS endpoints.");
    } finally {
      setIsLoadingFeeds(false);
    }
  };

  // Automatically fetch articles on boot if we have feeds configured
  useEffect(() => {
    if (feeds.length > 0) {
      handleRefreshFeeds();
    }
  }, [feeds]);

  // --- 5. Digest Generation Handler ---
  const handleGenerateDigest = async () => {
    setIsGeneratingDigest(true);
    setDigestError(null);
    setGenerationSuccess(false);

    try {
      // First ensure we have active raw articles. If not, scrape them on the fly
      let articlesToUse = rawArticles;
      if (rawArticles.length === 0) {
        const enabledFeeds = feeds.filter((f) => f.isEnabled);
        if (enabledFeeds.length === 0) {
          throw new Error("No feed sources are enabled. Please enable some feeds first.");
        }

        const scrapeResponse = await fetch("/api/fetch-rss", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feeds: enabledFeeds })
        });

        if (!scrapeResponse.ok) {
          throw new Error("Failed to automatically refresh news feeds.");
        }

        articlesToUse = await scrapeResponse.json();
        setRawArticles(articlesToUse);
      }

      if (articlesToUse.length === 0) {
        throw new Error("No news articles fetched. Make sure your RSS feeds are active and accessible.");
      }

      // Call Express Gemini synthesis endpoint
      const response = await fetch("/api/generate-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Jane Doe",
          interests,
          articles: articlesToUse
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const newDigest: DailyDigest = await response.json();
      newDigest.id = "digest-" + Date.now();
      newDigest.createdAt = new Date().toISOString();
      newDigest.interests = [...interests];

      // Insert new digest at start of archives and make it active
      setDigests([newDigest, ...digests]);
      setCurrentDigest(newDigest);
      setGenerationSuccess(true);
      setActiveTab("digest");
    } catch (err: any) {
      setDigestError(err.message || "Gemini could not assemble the news items. Check your API key.");
    } finally {
      setIsGeneratingDigest(false);
    }
  };

  // Delete digest briefing helper
  const handleDeleteDigest = (id: string) => {
    const updated = digests.filter((d) => d.id !== id);
    setDigests(updated);
    if (currentDigest?.id === id) {
      setCurrentDigest(updated[0] || null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 antialiased" id="main-news-digest-app">
      {/* Editorial Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 inline-flex items-center justify-center text-white font-black tracking-tight text-lg shadow-sm shadow-indigo-200">
              A
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 tracking-tight text-md">
                AURORA NEWS BRIEF
              </h2>
              <p className="text-[10px] font-semibold text-indigo-600 tracking-widest uppercase mt-0.5">
                Personalized GenAI Digest
              </p>
            </div>
          </div>

          {/* Core App Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("digest")}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                  activeTab === "digest" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Today's Briefing
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("archive")}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                  activeTab === "archive" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Briefing Archives ({digests.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerateDigest}
              disabled={isGeneratingDigest || feeds.filter((f) => f.isEnabled).length === 0}
              className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              {isGeneratingDigest ? "Compiling Briefing..." : "Assemble New Digest"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Profile / Context Setting Bar */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xs">
          <div className="flex items-center gap-4.5">
            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600">
              <User className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Briefing Owner</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="font-bold text-slate-800 text-lg border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-hidden pb-0.5 max-w-xs"
                  placeholder="Enter your name"
                  title="Click to edit name"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Quick overview of interests / feeds config status */}
            <div className="text-slate-500 text-xs flex items-center gap-4 flex-1 lg:flex-initial">
              <div className="border-r border-slate-150 pr-4">
                <span className="font-semibold block text-slate-800">{interests.length} Topics</span>
                <span className="text-[10px] text-slate-400">Curated interests</span>
              </div>
              <div>
                <span className="font-semibold block text-slate-800">{feeds.filter(f => f.isEnabled).length} Sources</span>
                <span className="text-[10px] text-slate-400">Active RSS feeds</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab("topics")}
                className={`flex-1 sm:flex-initial px-3.5 py-2 border rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "topics" 
                    ? "bg-slate-900 border-slate-900 text-white" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Settings className="w-4 h-4" /> Focus Topics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("feeds")}
                className={`flex-1 sm:flex-initial px-3.5 py-2 border rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "feeds" 
                    ? "bg-slate-900 border-slate-900 text-white" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Rss className="w-4 h-4" /> Config Feeds
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={`flex-1 sm:flex-initial px-3.5 py-2 border rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "raw" 
                    ? "bg-slate-900 border-slate-900 text-white" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <BookOpen className="w-4 h-4" /> Feed Scraper ({rawArticles.length})
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Status Bars (Success / Error Logs) */}
        {digestError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">Assembly failed: </span>
              {digestError}
              <p className="text-xs text-red-600 mt-1">
                Note: In AI Studio Build, confirm that you have provided a valid Gemini API key under Settings &gt; Secrets if accessing live text models.
              </p>
            </div>
          </div>
        )}

        {feedError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">Feed error: </span>
              {feedError}
            </div>
          </div>
        )}

        {generationSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Personalized morning news brief compiled successfully!</span>
            </div>
            <button 
              type="button" 
              onClick={() => setGenerationSuccess(false)}
              className="text-xs text-green-600 hover:text-green-800 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab content rendering */}
        <div className="space-y-8">
          
          {/* Active Digest briefing View */}
          {activeTab === "digest" && (
            <div className="space-y-6">
              {currentDigest ? (
                <DigestViewer digest={currentDigest} />
              ) : (
                <div className="border border-slate-200 rounded-2xl p-12 bg-white text-center space-y-4 max-w-xl mx-auto">
                  <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-800">Your Morning Briefing is Empty</h3>
                  <p className="text-slate-500 text-sm">
                    No active daily briefing is selected. Adjust your focus topics and RSS sources, then click "Assemble New Digest" to fetch recent stories and synthesize today's customized newsletter.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateDigest}
                    disabled={isGeneratingDigest}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                    Assemble Today's Briefing
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Topics Setting view */}
          {activeTab === "topics" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-2xs">
              <InterestConfig interests={interests} onChange={setInterests} />
            </div>
          )}

          {/* Feeds configuration view */}
          {activeTab === "feeds" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-2xs">
              <FeedConfig feeds={feeds} onChange={handleFeedsChange} onResetDefaults={handleResetFeeds} />
            </div>
          )}

          {/* Raw Scraped Feeds content viewer */}
          {activeTab === "raw" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-2xs space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <span className="text-sm text-slate-500">
                  Trigger an immediate manual scrape of all checked feeds on the server.
                </span>
                <button
                  type="button"
                  onClick={handleRefreshFeeds}
                  disabled={isLoadingFeeds}
                  className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoadingFeeds ? 'animate-spin' : ''}`} />
                  Refresh Feeds
                </button>
              </div>
              <LatestArticles articles={rawArticles} isLoading={isLoadingFeeds} />
            </div>
          )}

          {/* Archives view */}
          {activeTab === "archive" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-2xs">
              <DigestArchive 
                digests={digests} 
                onSelect={(d) => {
                  setCurrentDigest(d);
                  setActiveTab("digest");
                }} 
                onDelete={handleDeleteDigest}
                selectedDigestId={currentDigest?.id}
              />
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-16 text-center text-xs text-slate-400 font-mono">
        <p>AURORA BRIEFING ENGINE • DESIGNED WITH EXTREME CRAFTSMANSHIP</p>
        <p className="mt-1">POWERED BY GEMINI 3.5 FLASH • LOCAL SERVER SCRAPER</p>
      </footer>
    </div>
  );
}
