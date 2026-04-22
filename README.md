# AMORIO 💜

> Connect Through Shared Moments

A video chat social platform where random calls turn into real friendships.

## Features

- 🎲 **Random Call System** - Vibe selector (Chill/Deep Talk/Funny/Chaotic), instant matching, skip anytime
- 🔄 **Cross-Vibe Matching** - Auto-match with any vibe if queue is empty after 10s
- 🎡 **Icebreaker Wheel** - Random conversation topics to break the ice
- 💥 **Reaction Bombs** - Emoji reactions that fly across the screen
- 🤝 **Friendship System** - Both must add each other during the call (saved to database)
- 💬 **Persistent Chat** - Real-time messages stored in Supabase
- 📞 **Reconnect** - Video call friends with unique room links
- 👤 **User Profiles** - Auto-created on login, shows online status
- 📱 **Friends Panel** - Access friends list even during random calls
- 🚀 **Scalable** - Redis pub/sub support for 20k+ concurrent users

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- **Auth/DB**: Supabase (Auth + PostgreSQL + Realtime)
- **Video**: WebRTC (P2P)
- **Signaling**: Socket.io + Redis (optional, for scaling)
- **Hosting**: Vercel + Railway

---

## 🚀 How to Run (Full Instructions)

### Step 1: Install Dependencies

Open **TWO** terminal windows.

**Terminal 1 - Main App:**
```bash
cd d:\amorio
npm install
```

**Terminal 2 - Signaling Server:**
```bash
cd d:\amorio\server
npm install
```

### Step 2: Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `schema.sql`
3. Enable Google OAuth in Authentication → Providers
4. Edit `d:\amorio\.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Step 3: Run Both Servers

**Terminal 1 - Start Next.js (port 3000):**
```bash
cd d:\amorio
npm run dev
```

**Terminal 2 - Start Signaling Server (port 3001):**
```bash
cd d:\amorio\server
npm start
```

### Step 4: Test the App

1. Open **http://localhost:3000** in browser
2. Click "Get Started" → Login with Google/Email
3. Pick a vibe and click "Find Someone"
4. **To test matching:** Open incognito window, login as different user
5. Both select same vibe → they'll be matched!

---

## 📝 Supabase Database Setup

Copy and run `schema.sql` in Supabase SQL Editor. It creates:

- **profiles** - User profiles with online status
- **friendships** - Mutual friend connections
- **messages** - Real-time chat messages
- **call_rooms** - Video call links for friends

Plus RLS policies and helper functions.

---

## 🌐 Deploy to Production

### Frontend (Vercel)

1. Push code to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SOCKET_URL` (Railway URL)
4. Deploy!

### Signaling Server (Railway)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select the `server` folder or create separate repo
4. (Optional) Add `REDIS_URL` for horizontal scaling
5. Get your Railway URL
6. Update Vercel's `NEXT_PUBLIC_SOCKET_URL`

### For 20k+ Users (Scaling)

1. Add Redis in Railway
2. Set `REDIS_URL` environment variable in signaling server
3. Deploy multiple instances - Redis handles pub/sub across them

---

## 📁 Project Structure

```
d:\amorio\
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing page
│   │   ├── about/              # About page
│   │   ├── app/                # Main app
│   │   │   ├── page.tsx        # Vibe selector
│   │   │   ├── call/           # Video call (WebRTC)
│   │   │   ├── friends/        # Friends list (database)
│   │   │   └── chat/           # Chat (realtime)
│   │   └── auth/               # Authentication
│   ├── components/             # UI Components
│   │   └── FriendsPanel.tsx    # Slide-out friends panel
│   ├── hooks/
│   │   ├── useWebRTC.ts        # WebRTC + Socket.io
│   │   ├── useAuth.tsx         # Auth context + profile
│   │   └── useDatabase.ts      # Supabase data hooks
│   └── lib/
│       └── supabase/           # Supabase clients
├── server/
│   ├── index.js                # Socket.io + Redis signaling
│   └── package.json
├── schema.sql                  # Database schema
└── public/                     # Static assets
```

---

## Deployment Guide

See `DEPLOYMENT.md` for the full GitHub -> Vercel + Railway setup and env var checklist.

## License

MIT - Built with 💜 for a lonelier-free world
