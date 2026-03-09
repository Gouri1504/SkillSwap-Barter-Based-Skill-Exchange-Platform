# SkillSwap — Barter-Based Skill Exchange Platform

A full-stack web application that enables users to exchange skills through a barter system. Users list skills they can teach and skills they want to learn; the platform matches them with compatible partners, facilitates scheduling and real-time communication, and tracks reputation through a review system — all without any monetary transactions.

Built with **Next.js**, **TypeScript**, **MongoDB**, **Firebase Auth**, **WebRTC** and **Socket.io**.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [System Workflow](#system-workflow)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Real-Time Communication](#real-time-communication)
- [Installation and Setup](#installation-and-setup)
- [Project Structure](#project-structure)


---

## Project Overview

SkillSwap addresses the problem of expensive skill acquisition by creating a platform where knowledge itself is the currency. A graphic designer who wants to learn Python can connect with a developer who wants to learn design — both teach and learn simultaneously.

The platform handles the complete exchange lifecycle: user onboarding, compatibility-based matching, session scheduling, real-time chat, peer-to-peer video calls (WebRTC), post-session reviews, and admin moderation.

---

## Key Features

| Feature | Description |
|---|---|
| **Compatibility Matching** | Scores users based on overlap between skills offered and skills wanted. Surfaces the highest-scoring potential partners first. |
| **Session Management** | Full scheduling workflow with timezone-aware availability slots, session status tracking (scheduled, completed, cancelled), meeting links, notes, shared resources, and post-session summaries. |
| **Real-Time Chat** | Socket.io-powered messaging with conversation threads, typing indicators, and read receipts. |
| **Video Meetings** | Peer-to-peer video calls using WebRTC with Socket.io as the signaling server. No third-party video service required. |
| **Reviews and Ratings** | Multi-dimensional ratings (skill quality, communication, punctuality) with written feedback. Aggregate scores displayed on user profiles. |
| **Trust and Safety** | User report system, admin moderation panel, account banning, and verification badges. |
| **Admin Dashboard** | Platform analytics, user management (ban/unban), report resolution, and aggregate statistics. |
| **Notifications** | In-app notifications for match requests, session updates, new messages, and reviews. |
| **Explore and Search** | Filter users by skill category, experience level, and keyword. Browse trending skills. |
| **Theming** | Dark and light mode with system preference detection. |
| **3D Landing Page** | Interactive Three.js scene on the homepage built with React Three Fiber and Drei. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | MongoDB with Mongoose ODM |
| Authentication | Firebase Authentication (client) + Firebase Admin SDK (server-side token verification) |
| Real-Time | Socket.io |
| Video | WebRTC (peer-to-peer) with Socket.io signaling |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| 3D Graphics | Three.js, React Three Fiber, Drei |
| Validation | Zod |
| Icons | Lucide React |
| Date Handling | date-fns |
| Notifications | react-hot-toast |

---

## Architecture

The application follows a layered architecture within the Next.js App Router:

```
Request → API Route → Auth Middleware → Controller → Model → Database
                                            ↓
                                       Zod Validator
                                            ↓
                                     Standardized API Response
```

- **API Routes** (`src/app/api/`) define HTTP endpoints using Next.js route handlers.
- **Auth Middleware** (`src/middleware/auth.ts`) extracts and verifies Firebase ID tokens from the `Authorization` header, loads the corresponding user from MongoDB, and checks for banned status.
- **Controllers** (`src/controllers/`) contain the business logic for each domain (users, matches, sessions, chat, reviews, admin).
- **Models** (`src/models/`) define Mongoose schemas and provide the data access layer.
- **Validators** (`src/validators/`) enforce request payload structure using Zod schemas.
- **Utilities** (`src/utils/`) provide standardized response formatting (`successResponse`, `paginatedResponse`, `errorResponse`) and custom error classes (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ValidationError`).

---

## System Workflow

### 1. Authentication

1. User signs in via Firebase Authentication (supports email/password and Google OAuth).
2. The client sends a `GET /api/auth/me` request with the Firebase ID token in the `Authorization: Bearer <token>` header.
3. If no account exists, the client calls `POST /api/auth/register` to create a user record in MongoDB linked to the Firebase UID.
4. All subsequent API requests include the Firebase token, which the server verifies using the Firebase Admin SDK.

### 2. Skill Matching

1. Users configure their profile with skills offered (what they can teach) and skills wanted (what they want to learn).
2. The matching algorithm in `GET /api/matches/find` computes a compatibility score based on the intersection of one user's offered skills with another's wanted skills, and vice versa.
3. Users can send match requests. The recipient accepts or rejects. Accepted matches unlock chat and session booking.

### 3. Sessions and Learning

1. Either participant in an accepted match can create a session with a scheduled time, skill topic, and auto-generated meeting link.
2. Sessions progress through statuses: `scheduled` → `completed` or `cancelled`.
3. Participants can attach notes, share resources, and write a session summary.
4. After completion, both users can leave a review with granular ratings.

### 4. Real-Time Communication

1. Upon connecting, the Socket.io client emits `user-online` and receives the current `online-users` list.
2. Chat messages are sent via `send-message` and broadcast as `new-message` to room participants.
3. Video meetings use Socket.io for WebRTC signaling (`webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`), after which media streams are exchanged peer-to-peer.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create user from Firebase token |
| GET | `/api/auth/me` | Get authenticated user profile |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/profile` | Get current user's profile |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/users/search` | Search users by skill, category, or level |
| GET | `/api/users/dashboard` | Get dashboard statistics |
| GET | `/api/users/[id]` | Get user by ID |

### Matches
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/matches` | List user's matches (filterable by status) |
| POST | `/api/matches` | Send a match request |
| GET | `/api/matches/find` | Find compatible users |
| GET | `/api/matches/[id]` | Get match details |
| PATCH | `/api/matches/[id]` | Accept, reject, or update a match |

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sessions` | List user's sessions |
| POST | `/api/sessions` | Create a session |
| GET | `/api/sessions/[id]` | Get session details |
| PATCH | `/api/sessions/[id]` | Update session status |
| POST | `/api/sessions/[id]/notes` | Add a note to a session |
| POST | `/api/sessions/[id]/resources` | Add a resource link |
| PUT | `/api/sessions/[id]/summary` | Write or update session summary |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chat/conversations` | List conversations |
| GET | `/api/chat/messages` | Get messages by conversation ID |
| POST | `/api/chat/messages` | Send a message |

### Reviews
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reviews` | Submit a review |
| GET | `/api/reviews` | Get reviews for a user |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get user's notifications |
| PATCH | `/api/notifications` | Mark notifications as read |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reports` | Report a user |

### Admin (requires admin role)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform-wide statistics |
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users` | Ban or unban a user |
| GET | `/api/admin/reports` | List all reports |
| PATCH | `/api/admin/reports` | Resolve or dismiss a report |
| GET | `/api/admin/analytics` | Platform analytics data |

### Skills
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/skills/trending` | Get trending skill categories |

---

## Database Schema

| Model | Key Fields |
|---|---|
| **User** | `firebaseUid`, `email`, `displayName`, `skillsOffered[]`, `skillsWanted[]`, `availability`, `rating`, `role`, `badges[]`, `isBanned` |
| **Match** | `userA`, `userB`, `skillOfferedByA`, `skillOfferedByB`, `compatibilityScore`, `status` (pending/accepted/rejected/cancelled) |
| **Session** | `match`, `host`, `participant`, `skill`, `scheduledAt`, `status`, `meetingLink`, `notes[]`, `resources[]`, `sessionNotes` |
| **Conversation** | `participants[]`, `lastMessage` |
| **Message** | `conversation`, `sender`, `content`, `messageType`, `readBy[]` |
| **Review** | `session`, `reviewer`, `reviewee`, `rating`, `skillRating`, `communicationRating`, `punctualityRating`, `comment` |
| **Notification** | `user`, `type`, `title`, `message`, `link`, `read` |
| **Report** | `reporter`, `reported`, `reason`, `description`, `status`, `adminNotes` |

---

## Real-Time Communication

The Socket.io server is initialized through a Pages Router API route (`src/pages/api/socketio.ts`) to maintain a persistent WebSocket connection alongside the App Router.

### Socket Events

| Event | Direction | Purpose |
|---|---|---|
| `user-online` | Client → Server | Register user as online |
| `online-users` | Server → Client | Broadcast list of online user IDs |
| `join-room` / `leave-room` | Client → Server | Join or leave a chat room |
| `send-message` | Client → Server | Send a chat message |
| `new-message` | Server → Client | Deliver incoming message |
| `typing` / `stop-typing` | Client → Server | Typing indicator signals |
| `user-typing` / `user-stop-typing` | Server → Client | Broadcast typing status |
| `join-meeting` / `leave-meeting` | Client → Server | Enter or exit a video meeting room |
| `webrtc-offer` | Client → Server | Forward SDP offer for WebRTC |
| `webrtc-answer` | Client → Server | Forward SDP answer for WebRTC |
| `webrtc-ice-candidate` | Client → Server | Forward ICE candidate for WebRTC |

---

## Installation and Setup

### Prerequisites

- Node.js 18 or later
- MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Firebase project with Authentication enabled

### 1. Clone the repository

```bash
git clone https://github.com/Gouri1504/SkillSwap-Barter-Based-Skill-Exchange-Platform.git
cd SkillSwap-Barter-Based-Skill-Exchange-Platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root with the following variables:

```
# Database
MONGODB_URI=mongodb://localhost:27017/skillswap

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase (Server — Admin SDK)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

To obtain these values:
1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Enable Authentication providers (Email/Password, Google).
3. Copy the web app config from **Project Settings > General**.
4. Generate a service account key from **Project Settings > Service Accounts** for the server-side variables.

### 4. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 5. Build for production

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── api/                       # REST API endpoints
│   │   ├── auth/                  #   Authentication (register, me)
│   │   ├── users/                 #   User profiles, search, dashboard
│   │   ├── matches/               #   Match creation, discovery, updates
│   │   ├── sessions/              #   Session CRUD, notes, resources
│   │   ├── chat/                  #   Conversations and messages
│   │   ├── reviews/               #   Review submission and retrieval
│   │   ├── notifications/         #   Notification management
│   │   ├── reports/               #   User reports
│   │   ├── admin/                 #   Admin operations
│   │   └── skills/                #   Trending skills
│   ├── dashboard/                 # Dashboard page
│   ├── explore/                   # User discovery and search page
│   ├── matches/                   # Match management page
│   ├── sessions/                  # Session management page
│   ├── chat/                      # Real-time chat page
│   ├── profile/                   # Profile editing page
│   ├── notifications/             # Notification center page
│   ├── admin/                     # Admin panel page
│   ├── meet/[id]/                 # WebRTC video meeting page
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing page
│   ├── error.tsx                  # Error boundary
│   └── not-found.tsx              # 404 page
├── components/
│   ├── auth/                      # AuthModal, SkillOnboarding
│   ├── layout/                    # Navbar
│   ├── three/                     # 3D scene (React Three Fiber)
│   └── ui/                        # Reusable UI components
├── context/                       # AuthContext, ThemeContext
├── hooks/                         # useApi, useSocket
├── lib/                           # MongoDB, Firebase, Socket.io setup
├── middleware/                    # Auth middleware (token verification)
├── models/                        # Mongoose schemas
├── controllers/                   # Business logic
├── validators/                    # Zod request schemas
├── utils/                         # Response helpers, error classes
└── types/                         # TypeScript interfaces
```

---


