# ChildSafe AI Filter

Production-ready full-stack app to classify text as safe/unsafe for children, mask harmful words, and provide parent monitoring logs.

## Architecture

`React (client)` -> `Node.js + Express (server)` -> `Python Flask NLP service` -> `MongoDB`

## Project Structure

```text
childsafe-ai-filter/
├── client/
├── server/
└── nlp-service/
```

## 1) Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

## 2) Setup Environment Variables

### Server (`server/.env`)

Copy from `server/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/childsafe_ai_filter
JWT_SECRET=replace_with_a_long_random_secret
NLP_SERVICE_URL=http://127.0.0.1:8000
```

## 3) Install Dependencies

### Client

```bash
cd client
npm install
```

### Server

```bash
cd ../server
npm install
```

### NLP Service

```bash
cd ../nlp-service
python -m venv venv
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 4) Train NLP Model

From `nlp-service`:

```bash
python train_model.py
```

This creates:
- `models/vectorizer.joblib`
- `models/classifier.joblib`

## 5) Run Services (3 terminals)

### Terminal A - NLP

```bash
cd nlp-service
python app.py
```

### Terminal B - Backend

```bash
cd server
npm run dev
```

### Terminal C - Frontend

```bash
cd client
npm run dev
```

Open: `http://localhost:5173`

## 6) Core API Endpoints

- `POST /api/auth/register` -> register parent user
- `POST /api/auth/login` -> login and receive JWT
- `POST /api/content/check-text` -> classify text and optionally mask it
- `GET /api/logs` -> protected parent log history
- `GET /api/search?q=keyword` -> SafeSearch AI results (keyword + NLP filtering)

### `POST /api/content/check-text` request body

```json
{
  "text": "You are an idiot",
  "saveLog": true
}
```

- `saveLog: true` -> stores monitoring log (button click mode)
- `saveLog: false` -> real-time typing analysis without log spam

## 7) Test Inputs

- Input: `Hello friend` -> `SAFE`
- Input: `You are an idiot` -> `UNSAFE` and masked output

## 8) New Advanced Features Included

- Real-time filtering on typing (debounced API calls)
- Toxicity score progress bar in result card
- Multilingual preprocessing hooks (Hindi/Telugu starter, romanized tokens)
- Docker Compose one-command startup
- Typing status indicator (Analyzing / Synced / Error)
- Parent dashboard threshold slider for strictness control
- SafeSearch AI page (Google-like UI with automatic unsafe-result filtering)
- Rule-based + ML filtering pipeline for external search results
- Optional blocked placeholders (`includeBlocked=true`)
- Basic search rate limiting and search logging

## SafeSearch AI Flow

1. Frontend sends request to `GET /api/search?q=<query>`
2. Backend fetches results from DuckDuckGo Instant Answer API
3. Backend applies keyword filter + blocked-domain filter
4. Remaining results are checked by NLP service (`POST /predict`)
5. Unsafe results are removed or replaced with blocked placeholders
6. Safe results are returned and shown in the UI

SafeSearch treats Wikipedia, DuckDuckGo topic pages, and other trusted educational domains as safe after keyword checks (the ML model can mis-score long neutral text).

### SafeSearch API Examples

```bash
# Only safe results
GET /api/search?q=space%20science

# Include blocked placeholders
GET /api/search?q=space%20science&includeBlocked=true

# Custom threshold for NLP
GET /api/search?q=space%20science&threshold=0.55
```

## 9) Docker Compose (One Command Startup)

From project root:

```bash
docker compose up --build
```

Services:
- Client: `http://localhost:8080`
- Server API: `http://localhost:5000`
- NLP service: `http://localhost:8000`
- MongoDB: `mongodb://localhost:27017`

The stack now includes `healthcheck` probes and `depends_on` health conditions,
so services wait for dependencies to become healthy before starting.

Stop all:

```bash
docker compose down
```

## 10) Deployment Tips

- Frontend: Vercel / Netlify
- Backend: Render / Railway
- NLP Service: Render
- DB: MongoDB Atlas

Set production env vars for each service and allow CORS origins accordingly.
