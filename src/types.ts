export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: string;
  isDefault?: boolean;
  isEnabled: boolean;
}

export interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
  feedTitle?: string;
  feedId?: string;
}

export interface DigestArticle {
  title: string;
  link: string;
  source: string;
  relevanceScore: number;
  interestMatch: string;
  briefSummary: string;
  actionableInsight: string;
}

export interface DigestSection {
  category: string;
  overview: string;
  articles: DigestArticle[];
}

export interface DailyDigest {
  id: string;
  createdAt: string; // ISO string
  digestTitle: string;
  greeting: string;
  sections: DigestSection[];
  keyTakeaways: string[];
  morningQuote: string;
  interests: string[];
}

export interface UserProfile {
  name: string;
  interests: string[];
  feeds: FeedSource[];
}

export const DEFAULT_FEEDS: FeedSource[] = [
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
