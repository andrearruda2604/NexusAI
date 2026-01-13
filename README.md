# Nexus AI

Plataforma de atendimento ao cliente com IA Generativa e Motor de Regras.

## 🚀 Tecnologias

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend**: FastAPI, Python, LangChain
- **Database**: Supabase (PostgreSQL + pgvector)
- **IA**: Google Gemini 1.5 Pro
- **WhatsApp**: Evolution API

## 📦 Estrutura

```
├── frontend/     # Next.js App
├── backend/      # FastAPI API  
└── database/     # Supabase SQL Schema
```

## 🏃 Rodando Localmente

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 📄 Licença

MIT
