# Nexus AI Backend

API backend para a plataforma Nexus AI, construída com FastAPI.

## Requisitos

- Python 3.11+
- pip ou Poetry

## Instalação

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Executar

```bash
uvicorn app.main:app --reload --port 8000
```

## Documentação

- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
