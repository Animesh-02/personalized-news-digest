import React from "react";
import { History, Calendar, Trash2, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { DailyDigest } from "../types";

interface DigestArchiveProps {
  digests: DailyDigest[];
  onSelect: (digest: DailyDigest) => void;
  onDelete: (id: string) => void;
  selectedDigestId?: string;
}

export default function DigestArchive({ 
  digests, 
  onSelect, 
  onDelete, 
  selectedDigestId 
}: DigestArchiveProps) {

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6" id="digest-archive-container">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          Digest Archives
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Access your past daily digests. Read compiled briefings and track how your interests and feeds have evolved.
        </p>
      </div>

      {digests.length === 0 ? (
        <div className="border border-slate-200/60 rounded-xl p-8 bg-slate-50 text-center space-y-3">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-semibold text-slate-700 text-sm">No historical digests found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't generated any daily news digests yet. Select your focus topics, active feeds, and trigger "Generate Daily Digest"!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {digests.map((digest) => {
            const isSelected = digest.id === selectedDigestId;
            return (
              <div
                key={digest.id}
                onClick={() => onSelect(digest)}
                className={`relative flex flex-col justify-between p-5 border rounded-xl cursor-pointer shadow-2xs hover:shadow-md transition-all duration-300 group text-left ${
                  isSelected
                    ? "bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-50"
                    : "bg-white border-slate-200 hover:border-indigo-200"
                }`}
              >
                <div className="space-y-3">
                  {/* Date & Trigger */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(digest.createdAt)}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Active View
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className={`text-sm font-bold leading-snug group-hover:text-indigo-600 transition-colors ${
                    isSelected ? "text-indigo-900" : "text-slate-800"
                  }`}>
                    {digest.digestTitle}
                  </h4>

                  {/* Curated Interests snippet */}
                  <div className="flex flex-wrap gap-1">
                    {digest.interests.slice(0, 3).map((interest) => (
                      <span
                        key={interest}
                        className="text-[9px] px-2 py-0.5 font-medium bg-slate-100 text-slate-500 rounded-sm"
                      >
                        {interest}
                      </span>
                    ))}
                    {digest.interests.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 font-medium bg-slate-50 text-slate-400 rounded-sm">
                        +{digest.interests.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer and interactions */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100/50">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    Review Briefing
                    <ArrowRight className="w-3 h-3" />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this digest briefing?")) {
                        onDelete(digest.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Briefing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
