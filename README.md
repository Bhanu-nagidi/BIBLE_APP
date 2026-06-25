# ✝ Sacred Word — Multilingual Bible App

A complete, beautiful Bible web application with multilingual support, audio, bookmarks, daily streaks, and more.

## Features

- **Authentication** — Login, Register, or Continue as Guest
- **Home Screen** — Verse of the Day, streak tracker, quick navigation
- **Bible Reader** — All 66 books, chapter navigation, bookmark verses, copy & share
- **Audio Bible** — Built-in audio player for ESV (expandable to other versions)
- **Multilingual** — 10+ languages (English, Telugu, Hindi, Tamil, Spanish, Portuguese, French, German, Chinese, Korean)
- **Search** — Search across all Scripture with topic suggestions
- **Bookmarks** — Save and organize your favorite verses
- **Daily Streak** — Track your daily reading habit with a 7-day history view
- **Font Size** — Adjustable reading font size
- **Dark Theme** — Elegant dark gold theme

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Get your free Bible API key
1. Go to https://scripture.api.bible
2. Click "Get Started for Free" and create an account
3. Create an app to get your API key
4. Open `src/hooks/useBibleAPI.js`
5. Replace `'YOUR_API_BIBLE_KEY'` with your actual key

```js
const API_KEY = 'your-actual-api-key-here'
```

### 3. Run the app
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 4. Build for production
```bash
npm run build
```

## Project Structure

```
bible-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AudioPlayer.jsx     # Audio Bible player
│   │   ├── BottomNav.jsx       # Navigation bar
│   │   └── Toast.jsx           # Toast notifications
│   ├── contexts/
│   │   ├── AuthContext.jsx     # Auth state (login/register/guest)
│   │   └── BibleContext.jsx    # App state (language, bookmarks, streak)
│   ├── hooks/
│   │   └── useBibleAPI.js      # Bible API integration (scripture.api.bible)
│   ├── pages/
│   │   ├── AuthScreen.jsx      # Welcome / Login / Register
│   │   ├── HomeScreen.jsx      # Home with VOTD, streak, quick access
│   │   ├── BibleReader.jsx     # Bible reading with book/chapter picker
│   │   ├── SearchScreen.jsx    # Scripture search
│   │   ├── BookmarksScreen.jsx # Saved verses
│   │   └── SettingsScreen.jsx  # Language, font size, account
│   ├── styles/
│   │   └── global.css          # Global design system
│   ├── App.jsx                 # Router & providers
│   └── main.jsx                # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Bible API

This app uses the **scripture.api.bible** API (free tier available):
- 2,500+ Bible versions in 1,600+ languages
- REST API with JSON response
- Free registration at https://scripture.api.bible

The app runs in **demo mode** without an API key, showing sample content so you can preview the UI.

## Audio Bible

Audio is loaded from **ESV audio** (publicly available). For more languages and versions, integrate:
- **Faith Comes By Hearing** (bible.is) — 1,800+ languages
- **YouVersion Bible API** — Wide audio coverage

## Deployment

Deploy to any static hosting:
- **Netlify**: `npm run build` → drag `/dist` folder
- **Vercel**: `npx vercel` 
- **GitHub Pages**: Push to repo, enable Pages on `dist` output

---

Built with React + Vite. No backend required — all data stored locally.
