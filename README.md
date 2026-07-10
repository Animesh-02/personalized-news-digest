# Personalized News Digest & RSS Reader

A fully-featured, highly optimized full-stack application built with **React (TypeScript)**, **Vite**, and an **Express server** integrated with the **Gemini API** for intelligent summary generation.

## 🚀 Existing Live Deployment

Your application is **already fully deployed and running live** on Google Cloud Run via the Google AI Studio platform! You can use the links provided in your interface to view and share the app:
* **Development Workspace:** Used for live-previewing edits in real time.
* **Shared App URL:** A production-ready, highly responsive link you can share directly with others.

---

## 🛠️ Deploying to Other Platforms

If you want to host this application on your own personal hosting platform, please read the guide below.

### ❌ Why did Vercel or Streamlit cause errors?
1. **Streamlit:** Streamlit is a **Python-only** framework designed specifically for Python scripts. Since this app is a JavaScript/TypeScript full-stack codebase (Node.js/Express + React), it is completely incompatible with Streamlit.
2. **Vercel:** Vercel specializes in static frontend hosting and Serverless Functions. Standard full-stack Express servers that listen continuously on a port (like `app.listen(3000)`) do not run out-of-the-box on Vercel without rewriting them to Vercel's Serverless Router format.

### 💡 Supported Hosting Environments
Since this is a standard Node.js Express full-stack application, it is highly compatible with any container service or Node.js hosting platform:

#### 1. Container Hosting (Recommended)
We have included a production-ready `Dockerfile` in the root directory. You can deploy this app with **one click** to:
* **Google Cloud Run**
* **Railway** (Select "Deploy from GitHub" and it will auto-detect the `Dockerfile`)
* **Render** (Select "Web Service" -> Connect Repository -> Auto-builds via `Dockerfile`)
* **Fly.io** (`fly launch` will auto-detect the `Dockerfile`)

#### 2. Traditional Node.js Hosting (Render, Heroku, etc.)
If you prefer to deploy without Docker, configure the platform with the following settings:
* **Build Command:** `npm install && npm run build`
* **Start Command:** `npm start`
* **Port Environment Variable:** Set `PORT` to `3000` (or let the platform set it automatically)
* **Node Version:** Node 18 or higher (Node 22 recommended)

---

## 📦 How to Run Locally

If you download the source code as a ZIP or export it to GitHub, you can run it locally with:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory with:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Production Build & Run:**
   ```bash
   npm run build
   npm start
   ```
