# DailyTrack

DailyTrack is a modern web-based habit and task management platform designed to streamline daily workflows, maintain accountability streaks, and enable social task collaboration.

## Core Features

- **Habit & Task Management:** Organize, update, and monitor the lifecycle and completion of daily objectives.
- **Daily Logs & Streaks:** Real-time analytics, habit streaks, progress ring visualizations, and historical logs.
- **Social Accountability:** Connect with friends, send accountability task requests, and track shared progress in real time.
- **Glassmorphic UI:** Modern dark/light-compatible responsive design with interactive animations.

## Tech Stack

- **Frontend:** React 19, React Router v7, Vite 8, Tailwind CSS v4
- **Backend:** Node.js, Express 4, Mongoose 8 (MongoDB Atlas)
- **Authentication:** Stateless JWT auth (`Bearer` token) with `bcrypt` password hashing
- **Deployment:** Vercel (Frontend SPA) + Render (Backend Web Service)

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env` (optional for local Vite proxy).
   - Copy `server/.env.example` to `server/.env` and provide your `MONGO_URI` and `JWT_SECRET`.

3. **Start backend API:**
   ```bash
   npm run dev:server
   ```

4. **Start frontend application:**
   ```bash
   npm run dev
   ```

The Vite dev server proxies `/api` requests to `http://localhost:5000`.

## Production Deployment

- **Frontend (Vercel):**
  - Set `VITE_API_URL` to your Render API URL (e.g. `https://dailytrack-api.onrender.com/api`).
- **Backend (Render):**
  - Deployed as a Web Service or using `render.yaml`.
  - Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, and `NODE_ENV=production`.

## Available Scripts

- `npm run dev` — Start Vite development server
- `npm run dev:server` — Start Express backend with file watching
- `npm run build` — Build production bundle for Vercel
- `npm start` — Start Express production server for Render
- `npm run lint` — Run ESLint across the codebase
