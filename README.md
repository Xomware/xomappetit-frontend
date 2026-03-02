# Meals Frontend

A meals tracking web application built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. Track meals, filter by various criteria, and rate them — all in a responsive dark-themed UI.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)

## Features

- **Table & Card Views** — Toggle between a data-dense table and visual card layout
- **Filterable** — Filter meals by protein source, difficulty, cooked status, and time range
- **Add Meal Modal** — Log meals with name, time, difficulty, protein source, ingredients, and macros
- **Rate Meal Modal** — Rate meals on taste, ease, speed, and healthiness (1–10) with notes
- **Real-time Data** — SWR-powered data fetching with optimistic updates
- **Dark Theme** — Sleek gray-800/900 dark UI
- **Mobile Responsive** — Responsive grid layouts that work on any screen size

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Data Fetching | [SWR](https://swr.vercel.app/) |
| API | REST → [api.xomware.com](https://api.xomware.com) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repo
git clone https://github.com/Xomware/meals-frontend.git
cd meals-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Start dev server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL for the Meals API | `https://api.xomware.com` |
| `NEXT_PUBLIC_AUTH_HASH` | Auth hash for API requests | `your-auth-hash-here` |

Both are required. See `.env.example` for a template.

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Global styles & Tailwind imports
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page (view toggle, filters, meal list)
├── components/
│   ├── AddMealModal.tsx   # Modal for adding new meals
│   ├── FilterBar.tsx      # Filter controls (protein, difficulty, cooked, time)
│   ├── MealCard.tsx       # Card view for a single meal
│   ├── MealTable.tsx      # Table view for meals
│   ├── Modal.tsx          # Reusable modal wrapper
│   └── RateMealModal.tsx  # Modal for rating meals (taste/ease/speed/health)
├── lib/
│   ├── hooks.ts           # SWR hooks for data fetching & mutations
│   └── storage.ts         # Local storage utilities
└── types.ts               # TypeScript type definitions
```

## API Integration

The app communicates with a REST API at `api.xomware.com` backed by API Gateway + DynamoDB. All requests include the auth hash for authentication.

Key endpoints:
- `GET /meals` — Fetch all meals
- `POST /meals` — Create a new meal
- `PUT /meals/:id` — Update a meal (including ratings)

SWR handles caching, revalidation, and optimistic updates for a snappy UI experience.

## Deployment

The app deploys automatically via **GitHub Actions** (`.github/workflows/deploy.yml`).

Supported deployment targets:
- **Vercel** — Zero-config Next.js hosting
- **S3 + CloudFront** — Static export to AWS (via GitHub Actions)

## License

Private — Xomware
