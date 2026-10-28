# Occasio — Intelligent Multi-College Event Management Platform

A full-stack event management and discovery platform built with React + FastAPI.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router, Axios, Lucide React |
| Backend | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| Database | SQLite, SQLAlchemy 2 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Tests | Pytest, HTTPX |

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env        # edit values as needed
python -m app.main          # starts uvicorn on :8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # starts Vite dev server on :5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Running Tests
```bash
cd backend
.venv\Scripts\activate
pytest tests/ -v
```
