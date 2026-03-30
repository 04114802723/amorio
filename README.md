# AMORIO 💜

> Connect Through Shared Moments

A video chat social platform where random calls turn into real friendships.

## Features

- 🎲 **Random Call System** - Vibe selector, instant matching, skip anytime
- 🎡 **Icebreaker Wheel** - Random conversation topics to break the ice
- 💥 **Reaction Bombs** - Emoji reactions that fly across the screen
- 🤝 **Friendship System** - Both must add each other during the call
- 💬 **Private Chat** - Unlocked after mutual friend add
- 📞 **Reconnect** - Video call friends with unique room links

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- **Auth/DB**: Supabase (Auth + PostgreSQL)
- **Video**: WebRTC (P2P)
- **Signaling**: Socket.io
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

### Step 2: Configure Environment

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Edit `d:\amorio\.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

3. Enable Google OAuth in Supabase Dashboard (optional)

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
2. Click "Get Started"
3. Pick a vibe and click "Find Someone"
4. **To test with another person:** Open a second browser window (or use incognito mode)
5. Both users select the same vibe → they'll be matched!

---

## 🧪 Testing Video Calls

For video calls to work, you need **two users** connected:

1. Open Chrome normally → Go to http://localhost:3000/app
2. Open Chrome Incognito → Go to http://localhost:3000/app
3. Both select "Chill" vibe
4. Both click "Find Someone"
5. They'll be matched and can see each other's video!

**Note:** Camera/mic permissions must be allowed.

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
│   │   │   ├── friends/        # Friends list
│   │   │   └── chat/           # Chat interface
│   │   └── auth/               # Authentication
│   ├── components/             # UI Components
│   ├── hooks/
│   │   └── useWebRTC.ts        # WebRTC + Socket.io hook
│   └── lib/
│       └── supabase/           # Supabase client
├── server/
│   ├── index.js                # Socket.io signaling server
│   └── package.json
└── public/                     # Static assets
```

---

## 🌐 Deploy to Production

### Frontend (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repo
4. Add environment variables
5. Deploy!

### Signaling Server (Railway)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select the `server` folder
4. Add environment variables if needed
5. Get your Railway URL
6. Update `NEXT_PUBLIC_SOCKET_URL` in Vercel

---

## 📝 Supabase Database Setup

Run this SQL in Supabase SQL Editor:

```sql
-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Friendships
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  friend_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  unique(user_id, friend_id)
);

-- Messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.messages enable row level security;

-- Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
```

---

## License

MIT - Built with 💜 for a lonelier-free world
