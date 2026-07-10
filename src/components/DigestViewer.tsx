import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Calendar, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  ExternalLink, 
  Check, 
  Award, 
  Compass, 
  Share2, 
  CheckSquare,
  Copy,
  Printer,
  AlertCircle
} from "lucide-react";
import { DailyDigest } from "../types";

interface DigestViewerProps {
  digest: DailyDigest;
}

export default function DigestViewer({ digest }: DigestViewerProps) {
  const [showPrintGuide, setShowPrintGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format creation date beautifully
  const formattedDate = new Date(digest.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleCopy = async () => {
    const emailBody = `DAILY DIGEST: ${digest.digestTitle}\n\n${digest.greeting}\n\nKey Takeaways:\n${digest.keyTakeaways.map((t, i) => `${i+1}. ${t}`).join("\n")}`;
    let success = false;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(emailBody);
        success = true;
      }
    } catch (err) {
      console.warn("navigator.clipboard failed, trying fallback copy method", err);
    }

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = emailBody;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (err) {
        console.error("Fallback copy method failed", err);
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert("Copying failed. Please highlight the text manually to copy.");
    }
  };

  const handlePrint = () => {
    // 1. Try to trigger native print (works when opened in a new tab)
    try {
      window.print();
    } catch (err) {
      console.warn("Direct print call caught in sandboxed iframe:", err);
    }

    // 2. Since window.print() is blocked inside sandboxed preview iframes,
    // we generate and download a gorgeous, self-contained HTML print sheet.
    // This sheet has clean typography, matching layout, and auto-opens the print dialog on load.
    try {
      const sectionsHtml = digest.sections.map((section, sIdx) => `
        <div style="margin-bottom: 40px; page-break-inside: avoid;">
          <div style="border-bottom: 2px solid #1e293b; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.25rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin: 0;">
              ${section.category}
            </h3>
            <span style="font-size: 0.75rem; font-family: monospace; background-color: #0f172a; color: #ffffff; padding: 2px 10px; border-radius: 9999px; text-transform: uppercase;">
              Section ${sIdx + 1}
            </span>
          </div>
          <p style="color: #475569; line-height: 1.6; font-size: 0.875rem; font-style: italic; border-left: 4px solid #4f46e5; padding-left: 16px; margin-bottom: 24px; padding-top: 4px; padding-bottom: 4px; background-color: rgba(79, 70, 229, 0.03); border-radius: 0 8px 8px 0;">
            ${section.overview}
          </p>
          <div style="display: flex; flex-direction: column; gap: 24px;">
            ${section.articles.map((article) => `
              <div style="border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); page-break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-family: monospace; background-color: #f8fafc; padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">
                      ${article.source}
                    </span>
                    <span style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">
                      Match: <span style="font-weight: 600; color: #4f46e5;">${article.interestMatch}</span>
                    </span>
                  </div>
                  <span style="background-color: #fef3c7; border: 1px solid #fde68a; color: #92400e; font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 9999px;">
                    Match Score: ${article.relevanceScore}/10
                  </span>
                </div>
                <h4 style="font-size: 1.125rem; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; line-height: 1.4;">
                  <a href="${article.link}" target="_blank" rel="noopener noreferrer" style="color: #0f172a; text-decoration: none;">
                    ${article.title}
                  </a>
                </h4>
                <p style="color: #475569; font-size: 0.875rem; line-height: 1.6; margin-bottom: 16px;">${article.briefSummary}</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 0 12px 12px 0; padding: 18px; color: #334155; font-size: 0.75rem; line-height: 1.6;">
                  <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5; font-family: monospace; font-size: 0.625rem; margin-bottom: 6px;">
                    Insight & Daily Takeaway
                  </div>
                  <p style="margin: 0;">${article.actionableInsight}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");

      const takeawaysHtml = digest.keyTakeaways.map((takeaway, idx) => `
        <li style="display: flex; align-items: start; gap: 12px; margin-bottom: 16px;">
          <span style="margin-top: 4px; width: 20px; height: 20px; border-radius: 9999px; background-color: #0f172a; border: 1px solid rgba(79, 70, 229, 0.3); display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #818cf8; font-family: monospace; flex-shrink: 0;">
            ${idx + 1}
          </span>
          <p style="color: #cbd5e1; font-size: 0.75rem; line-height: 1.6; margin: 0;">
            ${takeaway}
          </p>
        </li>
      `).join("");

      const interestsHtml = digest.interests.map((interest) => `
        <span style="font-size: 0.75rem; padding: 4px 10px; font-weight: 600; background-color: rgba(255,255,255,0.8); border: 1px solid rgba(226,232,240,0.5); color: #4338ca; border-radius: 9999px; margin-right: 6px; margin-bottom: 6px; display: inline-block;">
          #${interest}
        </span>
      `).join("");

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${digest.digestTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        background-color: white !important;
        color: black !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 p-6 md:p-12 print:bg-white print:p-0">
  
  <!-- Print Banner -->
  <div class="no-print max-w-5xl mx-auto mb-8 bg-indigo-600 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 40px; height: 40px; border-radius: 8px; background-color: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.125rem;">A</div>
      <div>
        <h4 style="font-weight: 700; font-size: 0.875rem; margin: 0;">Aurora Morning Briefing Print Sheet</h4>
        <p style="font-size: 0.75rem; color: #e0e7ff; margin: 2px 0 0 0;">Bypassed sandboxed iframe limits successfully. Select "Save as PDF" or print to paper.</p>
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="padding: 8px 16px; background-color: #ffffff; color: #4f46e5; font-weight: 700; font-size: 0.75rem; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.2s;">
        Print Document
      </button>
      <button onclick="window.close()" style="padding: 8px 12px; background-color: rgba(79, 70, 229, 0.5); color: #ffffff; font-weight: 600; font-size: 0.75rem; border: none; border-radius: 8px; cursor: pointer;">
        Close Window
      </button>
    </div>
  </div>

  <div class="max-w-5xl mx-auto" style="display: flex; flex-direction: column; gap: 32px;">
    
    <!-- Editorial Header -->
    <div style="border-bottom: 2px double #cbd5e1; padding-bottom: 32px; text-align: center; display: flex; flex-direction: column; gap: 16px;">
      <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #4f46e5; background-color: #e0e7ff; padding: 4px 12px; border-radius: 9999px; align-self: center;">
        Your Personalized Morning Briefing
      </span>
      <h1 style="font-size: 2.25rem; font-weight: 800; letter-spacing: -0.025em; color: #0f172a; margin: 0; line-height: 1.2;">
        ${digest.digestTitle}
      </h1>
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #64748b; font-size: 0.75rem; font-family: monospace;">
        <span>${formattedDate}</span>
        <span>•</span>
        <span>CURATED BY GEMINI AI</span>
      </div>
    </div>

    <!-- Greeting block -->
    <div style="background: linear-gradient(to right, #f5f3ff, #f0f9ff, #ecfdf5); border: 1px solid #e0e7ff; border-radius: 16px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0;">Good morning!</h2>
        <p style="color: #334155; font-size: 1rem; line-height: 1.6; margin: 0;">${digest.greeting}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">${interestsHtml}</div>
      </div>
    </div>

    <!-- Grid Layout -->
    <div style="display: grid; grid-template-columns: 1fr; gap: 32px;">
      
      <!-- Side Box (Takeaways first) -->
      <div style="background-color: #0f172a; color: #e2e8f0; padding: 24px; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 4px 6px rgba(0,0,0,0.05); page-break-inside: avoid;">
        <h3 style="font-size: 0.875rem; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-top: 0; margin-bottom: 20px;">
          Daily Key Takeaways
        </h3>
        <ul style="list-style: none; padding: 0; margin: 0;">${takeawaysHtml}</ul>
      </div>

      <!-- Main Articles -->
      <div style="display: flex; flex-direction: column; gap: 40px;">
        ${sectionsHtml}
      </div>

      <!-- Quote -->
      <div style="background: linear-gradient(135deg, #312e81, #1e1b4b); color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #3730a3; box-shadow: 0 4px 6px rgba(0,0,0,0.05); page-break-inside: avoid; margin-top: 24px;">
        <h3 style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace; color: #c7d2fe; margin-top: 0; margin-bottom: 16px;">
          Morning Reflection
        </h3>
        <p style="color: #e0e7ff; font-size: 1rem; font-style: italic; line-height: 1.6; margin-top: 0; margin-bottom: 16px;">
          "${digest.morningQuote}"
        </p>
        <div style="font-size: 0.625rem; color: #818cf8; font-family: monospace; font-weight: bold; letter-spacing: 0.05em;">
          AURORA NEWS BRIEFING • HAVE A MINDFUL DAY
        </div>
      </div>

    </div>

  </div>

  <script>
    // Prompt print automatically upon opening
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 600);
    });
  </script>
</body>
</html>`;

      // Instead of downloading, we open the HTML content in a new tab
      let openedInNewTab = false;
      try {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          openedInNewTab = true;
        }
      } catch (err) {
        console.warn("Direct window.open document.write was blocked or failed:", err);
      }

      // If document.write tab is blocked (common in sandboxed iframe previews), fallback to opening a temporary Object URL in a new tab
      if (!openedInNewTab) {
        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Leave the URL alive for a minute to allow the new tab to read it successfully
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
      
      // Toggle print guide view
      setShowPrintGuide(true);
      setTimeout(() => setShowPrintGuide(false), 12000); // Show guide for 12 seconds
    } catch (err) {
      console.error("Print export fallback failed:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
      id={`digest-viewer-${digest.id}`}
    >
      {/* Editorial Header */}
      <div className="border-b-2 border-double border-slate-200 pb-8 text-center space-y-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          Your Personalized Morning Briefing
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-sans max-w-4xl mx-auto leading-tight">
          {digest.digestTitle}
        </h1>
        <div className="flex items-center justify-center gap-2 text-slate-500 font-mono text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formattedDate}</span>
          <span className="text-slate-300">•</span>
          <span>CURATED BY GEMINI AI</span>
        </div>
      </div>

      {/* Greeting and Intro */}
      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 rounded-2xl p-6 md:p-8 border border-indigo-100 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32 text-indigo-600" />
        </div>
        <div className="max-w-3xl space-y-3 relative z-10">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 font-sans flex items-center gap-2">
            <Sparkles className="w-5.5 h-5.5 text-amber-500" />
            Good morning!
          </h2>
          <p className="text-slate-700 leading-relaxed md:text-lg">
            {digest.greeting}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {digest.interests.map((interest) => (
              <span
                key={interest}
                className="text-xs px-2.5 py-1 font-semibold bg-white/80 border border-slate-200/50 text-indigo-700 rounded-full shadow-xs"
              >
                #{interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Sections vs Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* News Sections (Left Column) */}
        <div className="lg:col-span-2 space-y-12">
          {digest.sections.map((section, sIdx) => (
            <div key={section.category} className="space-y-6">
              {/* Section Divider & Name */}
              <div className="border-b-2 border-slate-800 pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase tracking-wider text-slate-900 font-sans">
                    {section.category}
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-900 text-white px-2.5 py-0.5 rounded-full uppercase">
                    Section {sIdx + 1}
                  </span>
                </div>
              </div>

              {/* Section Editorial Synthesis */}
              <p className="text-slate-600 leading-relaxed text-sm italic border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-50/20 rounded-r-lg">
                {section.overview}
              </p>

              {/* Curated Articles List */}
              <div className="space-y-8">
                {section.articles.map((article, aIdx) => (
                  <article 
                    key={aIdx} 
                    className="group relative bg-white border border-slate-100 hover:border-indigo-100 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Meta information */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-100">
                            {article.source}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Match: <span className="font-semibold text-indigo-600">{article.interestMatch}</span>
                          </span>
                        </div>
                        
                        {/* Relevance badge */}
                        <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>Match Score: {article.relevanceScore}/10</span>
                        </div>
                      </div>

                      {/* Article Title */}
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        <a 
                          href={article.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          {article.title}
                          <ExternalLink className="w-4 h-4 inline opacity-0 group-hover:opacity-100 transition-all text-indigo-400 hover:text-indigo-600 ml-1 shrink-0" />
                        </a>
                      </h4>

                      {/* Snappy Summary */}
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {article.briefSummary}
                      </p>

                      {/* Actionable Insight Box */}
                      <div className="bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-4.5 text-slate-700 text-xs leading-relaxed space-y-1.5 mt-2">
                        <div className="font-semibold uppercase tracking-wider text-indigo-600 font-mono text-[10px] flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5" />
                          Insight & Daily Takeaway
                        </div>
                        <p>{article.actionableInsight}</p>
                      </div>
                      
                      {/* Read Article Trigger Link */}
                      <div className="pt-2 flex justify-end">
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider group-hover:translate-x-0.5 transition-transform"
                        >
                          Read Original Story
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebars (Right Column) */}
        <div className="space-y-8">
          
          {/* Key Takeaways Card */}
          <div className="bg-slate-950 text-slate-200 p-6 rounded-2xl border border-slate-900 shadow-md space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              Daily Key Takeaways
            </h3>
            <ul className="space-y-4">
              {digest.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-1 w-5 h-5 rounded-full bg-slate-900 border border-indigo-500/30 inline-flex items-center justify-center text-xs text-indigo-400 font-mono shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed font-sans">
                    {takeaway}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Morning Inspiration Reflection Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-6 rounded-2xl border border-indigo-800 shadow-md space-y-4 relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
              <Sparkles className="w-48 h-48" />
            </div>
            
            <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-indigo-300 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5" />
              Morning Reflection
            </h3>
            <p className="text-indigo-100 text-sm italic font-serif leading-relaxed">
              "{digest.morningQuote}"
            </p>
            <div className="text-[10px] text-indigo-400 font-mono">
              AURORA NEWS BRIEFING • HAVE A MINDFUL DAY
            </div>
          </div>

          {/* Export utility */}
          <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl text-center space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">Need to save or share?</h4>
            <p className="text-[11px] text-slate-400">Copy this summary to email or download as newsletter draft.</p>
            <div className="flex gap-2 justify-center pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1.5 border text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  copied 
                    ? "bg-green-50 border-green-200 text-green-700" 
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Briefing
              </button>
            </div>
            {showPrintGuide && (
              <div className="text-[11px] text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-lg p-3 mt-3 flex items-start gap-2.5 text-left animate-fade-in">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Briefing opened in a new tab!</p>
                  <p className="text-indigo-600/90 leading-relaxed">
                    Standard browsers block <code>window.print()</code> directly inside sandboxed preview frames. 
                    We've opened a beautiful, <strong>print-ready editorial view</strong> for you in a new tab where the system's print dialog will open automatically!
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
