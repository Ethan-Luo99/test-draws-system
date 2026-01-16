# Test Draws System

This is a full-stack test project designed to demonstrate the core workflow of a restaurant lucky draw system.

## Project Structure

- `backend/`: Node.js Express API + PostgreSQL
- `mobile-app/`: React Native (Expo) User App
- `restaurant-dashboard/`: React Native (Expo) Restaurant Management App

## Core Workflow

1.  **Restaurant Dashboard** → Creates a draw event (supports fixed time draw or participant count draw).
2.  **User App** → Sees the draw event on the restaurant page after logging in.
3.  **User App** → Clicks "Join", system records participation.
    *   *Note: One user can only join the same event once.*
    *   *Note: If draw conditions are met (e.g., Nth participant), the system automatically triggers the draw.*
4.  **Restaurant Dashboard** → Views participant list and total count.
5.  **Restaurant Dashboard** → Can modify or cancel events that haven't started (no participants).

## Architecture

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Auth**: Supabase (Client Auth) + Custom JWT (Server Session)

### Database
See [INTEGRATION_EN.md](./INTEGRATION_EN.md) for detailed description.

### Authentication

1.  **User Login (Mobile App)**
    *   App uses Supabase SDK to login.
    *   Calls `POST /api/v1/auth/exchange` to exchange for backend JWT.
    *   API returns `default_business` (default business info) for App display.

2.  **Restaurant No-Login (Dashboard)**
    *   **Test Mode**: Restaurant side does not require login.
    *   Identifies via Header `X-Business-ID: <DEMO_BUSINESS_ID>`.
    *   Backend automatically allows requests with the correct Header.

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Mobile App
```bash
cd mobile-app
npm install
npx expo start --offline
```

### Restaurant Dashboard
```bash
cd restaurant-dashboard
npm install
npx expo start --offline
```
