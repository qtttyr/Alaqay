# Alaqay Frontend

This is the React + Vite + TypeScript PWA frontend for Alaqay.

For the full product overview, architecture, setup instructions, Supabase notes, and roadmap, see the root README:

```txt
../README.md
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
node_modules/.bin/tsc -b
```

## Environment

Copy `.env.example` to `.env` and add your Supabase values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
