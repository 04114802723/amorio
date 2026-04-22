# AMORIO Deployment (GitHub -> Vercel + Railway)

This project deploys as two services from the same GitHub repo:
- Frontend (`Next.js`) -> Vercel
- Signaling server (`server/index.js`) -> Railway

## 1. Required Environment Variables

### Vercel (Frontend project)
Add these in Vercel Project Settings -> Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SOCKET_URL` (example: `https://your-railway-domain.up.railway.app`)

### Railway (Signaling service)
Add these in Railway service variables:
- `PORT` (optional, Railway auto-injects this)
- `REDIS_URL` (optional, only if you attach Redis for horizontal scaling)

## 2. Supabase Setup (Auth + DB)

1. Run `schema.sql` in Supabase SQL Editor.
2. In Authentication -> URL Configuration:
- Set Site URL to your Vercel production URL (example: `https://amorio.vercel.app`).
- Add Redirect URLs:
  - `https://amorio.vercel.app/auth/callback`
  - `https://YOUR-VERCEL-PREVIEW-DOMAIN.vercel.app/auth/callback` (optional for preview testing)
  - `http://localhost:3000/auth/callback` (local dev)
3. In Authentication -> Providers -> Google:
- Enable Google provider.
- Use Google OAuth Client ID/Secret from Google Cloud console.

## 3. Do You Need a Google API Key?

For this repo as written: **No Google API key is required**.
- The app uses Supabase Google OAuth (Client ID/Secret configured in Supabase dashboard).
- It does not call Google Maps/Gemini/YouTube APIs from code.

Only add a separate Google API key if you later integrate a Google API endpoint in app/server code.

## 4. Connect GitHub to Vercel

1. In Vercel -> Add New Project -> Import `04114802723/amorio`.
2. Root directory: repo root (`/`).
3. Framework preset: Next.js (auto-detected).
4. Add the 3 Vercel env vars listed above.
5. Deploy.

After this, every push to the connected branch auto-deploys via GitHub.

## 5. Connect GitHub to Railway

1. In Railway -> New Project -> Deploy from GitHub repo -> select `04114802723/amorio`.
2. Keep service root at `/` (repo root).
3. Railway will read `/railway.json` from this repo:
- Build command: `npm --prefix server ci`
- Start command: `npm --prefix server start`
4. Add optional `REDIS_URL` if you attach a Redis service.
5. Deploy and copy the generated public domain.

## 6. Final Wiring

1. Set `NEXT_PUBLIC_SOCKET_URL` in Vercel to your Railway public URL (with `https://`).
2. Redeploy Vercel.
3. Verify:
- Frontend loads on Vercel
- Socket connects to Railway
- Random match + call flow works

## 7. Recommended GitHub Branch Flow

1. Commit to a working branch.
2. Open PR to `main`.
3. Merge PR -> Vercel and Railway production auto-deploy from `main`.

