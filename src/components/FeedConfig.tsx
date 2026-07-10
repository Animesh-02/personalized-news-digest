import React, { useState } from "react";
import { Plus, Trash2, Rss, AlertCircle, Check, Loader2, Info, RefreshCw } from "lucide-react";
import { FeedSource } from "../types";

interface FeedConfigProps {
  feeds: FeedSource[];
  onChange: (feeds: FeedSource[]) => void;
  onResetDefaults?: () => void;
}

export default function FeedConfig({ feeds, onChange, onResetDefaults }: FeedConfigProps) {
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState("Technology");
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  const handleToggleFeed = (id: string) => {
    onChange(
      feeds.map((f) => (f.id === id ? { ...f, isEnabled: !f.isEnabled } : f))
    );
  };

  const handleRemoveFeed = (id: string) => {
    onChange(feeds.filter((f) => f.id !== id));
  };

  const handleValidateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setValidationSuccess(false);

    const cleanUrl = newFeedUrl.trim();
    const cleanName = newFeedName.trim();

    if (!cleanUrl || !cleanName) {
      setValidationError("Please enter both a feed name and URL");
      return;
    }

    setIsValidating(true);

    try {
      // Validate by attempting to fetch and parse the feed via server-side scraper endpoint
      const response = await fetch("/api/fetch-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeds: [{ id: "temp-validation", name: cleanName, url: cleanUrl }]
        })
      });

      if (!response.ok) {
        throw new Error("Validation endpoint returned an error");
      }

      const items = await response.json();
      
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("No readable news articles found at this RSS/Atom URL. Make sure it is a valid XML RSS feed.");
      }

      // If valid, add it
      const newFeed: FeedSource = {
        id: "custom-" + Date.now(),
        name: cleanName,
        url: cleanUrl,
        category: newFeedCategory,
        isEnabled: true
      };

      onChange([...feeds, newFeed]);
      setNewFeedName("");
      setNewFeedUrl("");
      setValidationSuccess(true);
      setTimeout(() => setValidationSuccess(false), 3000);
    } catch (err: any) {
      setValidationError(err.message || "Failed to parse RSS feed. Please verify the URL.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6" id="feed-config-container">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Rss className="w-5 h-5 text-indigo-500" />
          Manage RSS News Feeds
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Toggle default editorial feeds or add your own custom RSS/Atom feeds. All content is fetched and parsed directly on our server.
        </p>
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Active Feed Sources ({feeds.filter(f => f.isEnabled).length} active)
          </label>
          {onResetDefaults && (
            <button
              type="button"
              onClick={onResetDefaults}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset to Defaults
            </button>
          )}
        </div>
        
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
          {feeds.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 italic">
              No feed sources added. Please add custom sources below.
            </div>
          ) : (
            feeds.map((feed) => (
              <div key={feed.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                  <input
                    type="checkbox"
                    checked={feed.isEnabled}
                    onChange={() => handleToggleFeed(feed.id)}
                    className="mt-1 w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
                    id={`toggle-feed-${feed.id}`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${feed.isEnabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                        {feed.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 font-semibold bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider">
                        {feed.category}
                      </span>
                      {feed.isDefault && (
                        <span className="text-[10px] px-2 py-0.5 font-semibold bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-wider">
                          Official
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 block truncate mt-0.5 max-w-md">
                      {feed.url}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveFeed(feed.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove Feed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Custom Feed Form */}
      <form onSubmit={handleValidateAndAdd} className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Custom RSS/Atom Feed
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 block">Feed Name</label>
            <input
              type="text"
              required
              value={newFeedName}
              onChange={(e) => setNewFeedName(e.target.value)}
              placeholder="e.g. Wired Science"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 block">Topic Category</label>
            <select
              value={newFeedCategory}
              onChange={(e) => setNewFeedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            >
              <option value="Technology">Technology</option>
              <option value="Science">Science</option>
              <option value="World News">World News</option>
              <option value="Finance">Finance</option>
              <option value="Health">Health</option>
              <option value="Entertainment">Entertainment</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 block">RSS Feed URL</label>
          <input
            type="url"
            required
            value={newFeedUrl}
            onChange={(e) => setNewFeedUrl(e.target.value)}
            placeholder="https://example.com/rss"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Validation Status Logs */}
        {validationError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {validationSuccess && (
          <div className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <span>Feed validated and added successfully!</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Must be a standard XML RSS/Atom feed.
          </span>
          <button
            type="submit"
            disabled={isValidating || !newFeedName.trim() || !newFeedUrl.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating Feed...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Validate & Add Feed
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
