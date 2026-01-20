from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, rules, documents, integrations, webhooks, dashboard

app = FastAPI(
    title="Nexus AI API",
    description="Backend API para a plataforma de atendimento Nexus AI",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://nexus-ai.vercel.app",
        "https://*.vercel.app"  # Permite todos os deployments do Vercel
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(rules.router, prefix="/api/rules", tags=["Rules"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/")
async def root():
    return {"message": "Nexus AI API v1.0.0", "status": "healthy"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

from fastapi import WebSocket, WebSocketDisconnect
from app.services.websocket_manager import manager

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            await websocket.receive_text()
            # Keep alive or handle incoming messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)

