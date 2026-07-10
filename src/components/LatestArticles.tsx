import React from "react";
import { BookOpen, ExternalLink, Calendar, Rss } from "lucide-react";
import { FeedItem } from "../types";

interface LatestArticlesProps {
  articles: FeedItem[];
  isLoading: boolean;
}

export default function LatestArticles({ articles, isLoading }: LatestArticlesProps) {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6" id="latest-articles-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Raw Incoming Feed Articles
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Real-time feed items scraped directly on the server from your active RSS feeds. Gemini filters and compiles these into your custom digests.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-semibold rounded-full shrink-0">
          {articles.length} feed articles loaded
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border border-slate-100 p-5 rounded-xl bg-white space-y-3 animate-pulse">
              <div className="flex gap-2">
                <div className="h-4 bg-slate-200 rounded-sm w-24"></div>
                <div className="h-4 bg-slate-200 rounded-sm w-32"></div>
              </div>
              <div className="h-5 bg-slate-200 rounded-sm w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded-sm w-full"></div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="border border-slate-200/60 rounded-xl p-8 bg-slate-50 text-center space-y-3">
          <Rss className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
          <h4 className="font-semibold text-slate-700 text-sm">No raw articles available</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Make sure you have active, checked RSS feeds enabled in the Feeds configuration and that you've clicked "Refresh Feeds" to scrape.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.slice(0, 30).map((article, idx) => (
            <div 
              key={idx} 
              className="p-5 bg-white border border-slate-150 rounded-xl hover:border-indigo-100 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="font-semibold text-indigo-600 bg-indigo-50/50 border border-indigo-100/30 px-2 py-0.5 rounded-sm">
                    {article.feedTitle}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(article.pubDate)}
                  </span>
                </div>

                {/* Article title */}
                <h4 className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                  <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-start gap-1">
                    {article.title}
                  </a>
                </h4>

                {/* Short description snippet */}
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {article.description}
                </p>
              </div>

              {/* Action trigger */}
              <div className="pt-4 mt-2 border-t border-slate-100/30 flex justify-end">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                >
                  Visit Source Link
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
