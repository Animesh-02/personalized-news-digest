import React, { useState } from "react";
import { Plus, Trash2, Sparkles, Check } from "lucide-react";

interface InterestConfigProps {
  interests: string[];
  onChange: (interests: string[]) => void;
}

const DEFAULT_SUGGESTIONS = [
  "Artificial Intelligence",
  "Space Exploration",
  "Quantum Computing",
  "Macroeconomics",
  "Climate Tech",
  "Cybersecurity",
  "BioTech",
  "Indie Game Development",
  "Mental Health & Wellness",
  "Renewable Energy"
];

export default function InterestConfig({ interests, onChange }: InterestConfigProps) {
  const [customInterest, setCustomInterest] = useState("");

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      onChange(interests.filter((i) => i !== interest));
    } else {
      onChange([...interests, interest]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInterest.trim();
    if (clean && !interests.includes(clean)) {
      onChange([...interests, clean]);
      setCustomInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    onChange(interests.filter((i) => i !== interest));
  };

  return (
    <div className="space-y-6" id="interest-config-container">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Define Your Focus Topics
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Select or add specific topics. Your morning digest will prioritize articles matching these interests.
        </p>
      </div>

      {/* Selected Topics */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          Your Curated Topics ({interests.length})
        </label>
        {interests.length === 0 ? (
          <div className="text-sm text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center">
            No topics selected. Select from suggestions below or write a custom topic.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium rounded-full shadow-xs transition-all hover:bg-indigo-100"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="w-4 h-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:text-indigo-600 hover:bg-indigo-200 focus:outline-hidden transition-colors"
                  aria-label={`Remove ${interest}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Topic */}
      <form onSubmit={handleAddCustom} className="flex gap-2">
        <input
          type="text"
          value={customInterest}
          onChange={(e) => setCustomInterest(e.target.value)}
          placeholder="Add custom topic (e.g. 'Stochastic Calculus')"
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        <button
          type="submit"
          disabled={!customInterest.trim()}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      {/* Suggestions */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          Popular Suggestions
        </label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SUGGESTIONS.map((suggestion) => {
            const isSelected = interests.includes(suggestion);
            return (
              <button
                type="button"
                key={suggestion}
                onClick={() => toggleInterest(suggestion)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  isSelected
                    ? "bg-slate-100 border-slate-300 text-slate-800"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                {suggestion}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
