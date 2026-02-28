<p align="center">
  <img src="https://img.shields.io/badge/SkillSwap-Barter%20Platform-6366f1?style=for-the-badge&logo=react&logoColor=white" alt="SkillSwap" />
</p>

<h1 align="center">✨ SkillSwap</h1>
<p align="center">
  <strong>Exchange Skills. Not Money.</strong>
</p>
<p align="center">
  A modern barter-based skill exchange platform where knowledge is the currency. Teach what you know, learn what you need—no payments, just pure skill exchange.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-project-structure">Project Structure</a>
</p>

---

## 🌟 Overview

**SkillSwap** connects people who want to learn and teach. List the skills you offer and the skills you want to learn; the platform matches you with partners for mutual skill exchange. Schedule sessions, chat in real time, leave reviews, and build a reputation—all without any money changing hands.

Perfect for developers, designers, language learners, musicians, and anyone who believes in learning through exchange.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| **🔍 Smart Matching** | Algorithm pairs you with ideal skill-exchange partners based on complementary skills (offered ↔ wanted) and compatibility scoring. |
| **📅 Session Booking** | Schedule learning sessions with timezone support, availability slots, and one-click meeting links. |
| **💬 Real-Time Chat** | Socket.io–powered instant messaging with your matches. Discuss, plan, and coordinate sessions. |
| **⭐ Reviews & Ratings** | Rate skill quality, communication, and punctuality. Build trust through detailed reviews. |
| **🛡️ Trust & Safety** | Verification badges, report system, and admin moderation to keep the community safe. |
| **🎥 Video-Ready** | Built-in meeting links for face-to-face learning (integrate with your preferred video tool). |
| **🌐 Explore & Search** | Browse users by skill category, experience level, and location. Filter and sort to find the right partners. |
| **📊 Dashboard** | Overview of sessions, completed exchanges, skills learned, and recent reviews. |
| **🔔 Notifications** | In-app notifications for matches, sessions, messages, and reviews. |
| **🎨 Modern UI** | Responsive design with dark/light theme, Framer Motion animations, and an interactive 3D hero (Three.js). |

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Database** | MongoDB with Mongoose |
| **Auth** | Firebase Authentication (email, Google, etc.) |
| **Real-time** | Socket.io (chat & live updates) |
| **Styling** | Tailwind CSS, Framer Motion |
| **3D / Hero** | Three.js, React Three Fiber, Drei |
| **Validation** | Zod |
| **UI** | Lucide React, custom components (Button, Card, Badge, Modal, etc.) |

---

## 🚀 How It Works

1. **Create your profile** — Add skills you offer and skills you want to learn. Set experience level, availability (timezone + weekly slots), and a short bio.
2. **Get matched** — The compatibility algorithm finds partners whose “skills offered” match your “skills wanted” and vice versa. Accept or reject match requests.
3. **Start learning** — Book sessions, chat with partners, join meetings, and complete exchanges. After each session, leave a review to build your reputation.

---

## 📦 Getting Started

### Prerequisites

- **Node.js** 18+ and npm (or yarn/pnpm)
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Firebase** project (for authentication)

### 1. Clone and install

```bash
git clone https://github.com/your-username/SkillSwap-Barter-Based-Skill-Exchange-Platform.git
cd SkillSwap-Barter-Based-Skill-Exchange-Platform
npm install
```

### 2. Environment variables

Create a `.env.local` in the project root and add:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string (e.g. `mongodb://localhost:27017/skillswap` or Atlas URI) | Yes |
| `NEXT_PUBLIC_APP_URL` | App URL for Socket.io and redirects (e.g. `http://localhost:3000`) | Yes (for dev) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `FIREBASE_PROJECT_ID` | Same as project ID (server-side) | Yes (for admin auth) |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account client email | Yes (for admin auth) |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key (escape newlines in `.env`) | Yes (for admin auth) |

**Firebase setup:** Create a project in [Firebase Console](https://console.firebase.google.com/), enable Authentication (e.g. Email/Password and Google), and get the config from Project settings. For server-side token verification, create a service account and use its credentials for the three `FIREBASE_*` variables above.

### 3. Run the app

```bash
# Development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# Production build
npm run build
npm start
```

### 4. Lint

```bash
npm run lint
```

---

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/                # API routes (auth, users, matches, sessions, chat, admin, etc.)
│   │   ├── dashboard/          # User dashboard
│   │   ├── explore/            # Browse & search users
│   │   ├── matches/            # Match requests & management
│   │   ├── sessions/           # Session booking & history
│   │   ├── chat/               # Real-time chat
│   │   ├── profile/            # User profile edit
│   │   ├── notifications/     # Notification center
│   │   └── admin/              # Admin panel (reports, users, analytics)
│   ├── components/             # React components
│   │   ├── auth/               # Auth modal, login/signup
│   │   ├── layout/             # Navbar, etc.
│   │   ├── three/              # 3D hero (SkillExchangeScene)
│   │   └── ui/                 # Button, Card, Badge, Input, Modal, Avatar, StarRating
│   ├── context/                # AuthContext, ThemeContext
│   ├── hooks/                  # useApi, useSocket
│   ├── lib/                    # MongoDB, Firebase, Socket.io client/server
│   ├── middleware/             # Auth middleware
│   ├── models/                 # Mongoose models (User, Match, Session, Message, Review, etc.)
│   ├── controllers/            # Route handlers / business logic
│   ├── validators/             # Zod schemas
│   ├── utils/                  # Helpers, errors, API response formatters
│   └── types/                  # Shared TypeScript interfaces
├── pages/api/socketio.ts       # Custom Server / Socket.io entry (if used)
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```

---

## 🔌 API Overview

The app exposes REST APIs under `src/app/api/`:

- **Auth:** `/api/auth/register`, `/api/auth/me`
- **Users:** `/api/users/profile`, `/api/users/search`, `/api/users/dashboard`, `/api/users/[id]`
- **Matches:** `/api/matches`, `/api/matches/find`, `/api/matches/[id]`
- **Sessions:** `/api/sessions`, `/api/sessions/[id]`, notes, resources, summary
- **Chat:** `/api/chat/conversations`, `/api/chat/messages`
- **Reviews:** `/api/reviews`
- **Notifications:** `/api/notifications`
- **Reports:** `/api/reports`
- **Admin:** `/api/admin/stats`, `/api/admin/users`, `/api/admin/reports`, `/api/admin/analytics`
- **Skills:** `/api/skills/trending`

Real-time features (e.g. chat) use **Socket.io** alongside these routes.

---

## 🎯 Skill Categories (examples)

Programming, Design, Marketing, Music, Language, Writing, Photography, Video, Business, Cooking, Fitness, Art, Data Science, DevOps, Mobile Development, Game Development, Cybersecurity, Cloud Computing, Public Speaking, Other.

---

## 📄 License

This project is available for use under the MIT License (or as specified in the repository).

---

<p align="center">
  <strong>SkillSwap</strong> — The future of skill exchange.
</p>
<p align="center">
  If you find this useful, consider giving it a ⭐.
</p>
