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
