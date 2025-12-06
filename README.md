# HookHubTS

Webhook Gateway Service built with Node.js, Express, and TypeScript.

## Setup

## Setup and Run

1. **Install Dependencies:**
   ```bash
   npm install
   ```
   (Note: `npm install` handles all dependencies including dev tools)

2. **Environment:**
   Ensure `.env` exists (created automatically). Default port: 3000.

3. **Start Infrastructure:**
   ```bash
   docker compose up -d
   ```
   This starts the PostgreSQL database and the application container.
   *Note: If you run the app locally with `npm run dev`, you only need the DB container.*

4. **Initialize Database:**
   ```bash
   npm run migrate
   npm run seed
   ```
   *Seed creates a provider 'MessageFlow' and a test API Key.*

5. **Run Application (Dev):**
   ```bash
   npm run dev
   ```
   Access: http://localhost:3000

6. **Run Tests:**
   ```bash
   npm test
   ```

## API Usage

- **Ingest Webhook:** `POST /webhooks/ingest`
- **List Events:** `GET /api/events`
- **Manage Keys:** `GET /api/keys` (or use Web UI)

## Web Interface
Visit http://localhost:3000 to view Event History and Manage API Keys.

