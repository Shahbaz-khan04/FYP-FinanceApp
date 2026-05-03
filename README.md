# Finance Assistant

Mobile-first personal finance analyzer and budgeting assistant.

## Workspace

- `mobile/` - Expo React Native app.
- `api/` - Node.js/Express API.
- `packages/shared/` - Shared TypeScript contracts for app/API boundaries.

## Commands

```bash
npm run dev:mobile
npm run dev:mobile:web
npm run dev:api
npm run typecheck
npm run build:api
```

## Environment

Copy `.env.example` to `.env` when credentials are available.

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
JWT_SECRET=
PORT=4000
NODE_ENV=development
```

The API currently exposes `GET /health` as a foundation smoke test.

## Auth Setup

1. Run SQL from [api/supabase-schema.sql](/Users/macbook/my_stuff/FYP/api/supabase-schema.sql) in Supabase SQL editor.
2. Fill `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` in `.env`.
3. For mobile, set API base URL:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

Auth endpoints are available under `/auth/*` and profile endpoints under `/users/me`.
