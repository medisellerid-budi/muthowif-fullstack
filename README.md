# muthowifApp

This repository contains the backend and frontend for the `muthowifApp` Tour Guide application, utilizing LiveKit for real-time audio/video streaming.

## Project Structure

- `backend/`: Next.js application acting as the API server and LiveKit token provider. Uses Prisma for PostgreSQL database access.
- `smartumroh-tourguide/`: Ionic React frontend application for both Tour Guides (to create/manage sessions) and Participants (to join and listen).
- `docker-compose.yml`: Local PostgreSQL database for development.

## Getting Started

### 1. Database Setup
Start the local PostgreSQL database using Docker Compose:
```bash
docker compose up -d
```

### 2. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your LiveKit credentials:
```bash
cp .env.example .env
```

Run database migrations and seed data:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Start the development server:
```bash
npm run dev
```

### 3. Frontend Setup
Navigate to the `smartumroh-tourguide/` directory:
```bash
cd smartumroh-tourguide
npm install
```

Start the development server:
```bash
npm run dev
```

## Technologies Used
- **Backend:** Next.js, Prisma, PostgreSQL, LiveKit Server SDK
- **Frontend:** Ionic React, Vite, LiveKit Client SDK, LiveKit Components React
