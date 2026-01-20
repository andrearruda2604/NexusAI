from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_supabase
from app.services.ai_engine import AIEngine

router = APIRouter()
ai_engine = AIEngine()


class MessageRequest(BaseModel):
    conversation_id: str
    content: str
    sender: str = "client"


class MessageResponse(BaseModel):
    id: str
    content: str
    sender: str
    created_at: str


class ConversationCreate(BaseModel):
    organization_id: str
    client_phone: str
    client_name: Optional[str] = None
    channel: str = "whatsapp"


@router.post("/conversations", response_model=dict)
async def create_conversation(data: ConversationCreate):
    """Criar nova conversa"""
    supabase = get_supabase()
    
    result = supabase.table("conversations").insert({
        "organization_id": data.organization_id,
        "client_phone": data.client_phone,
        "client_name": data.client_name,
        "channel": data.channel,
        "status": "active",
        "handled_by": "ai"
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao criar conversa")
    
    return result.data[0]


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Buscar conversa por ID"""
    supabase = get_supabase()
    
    result = supabase.table("conversations").select("*").eq("id", conversation_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    
    return result.data


@router.get("/conversations")
async def list_conversations(organization_id: str, status: Optional[str] = None):
    """Listar todas as conversas de uma organização"""
    supabase = get_supabase()
    
    query = supabase.table("conversations").select("*").eq("organization_id", organization_id)
    
    if status:
        query = query.eq("status", status)
        
    result = query.order("updated_at", desc=True).execute()
    
    return result.data


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str):
    """Listar mensagens de uma conversa"""
    supabase = get_supabase()
    
    result = supabase.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute()
    
    return result.data


@router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, data: MessageRequest):
    """Enviar mensagem e obter resposta da IA"""
    from app.services.websocket_manager import manager
    supabase = get_supabase()
    
    # Salvar mensagem do cliente
    client_msg = supabase.table("messages").insert({
        "conversation_id": conversation_id,
        "content": data.content,
        "sender": data.sender
    }).execute()
    
    # Broadcast Client Message
    if client_msg.data:
        await manager.broadcast({
            "type": "new_message",
            "conversation_id": conversation_id,
            "message": client_msg.data[0]
        })
    
    if data.sender == "client":
        # Buscar conversa para contexto
        conv = supabase.table("conversations").select("*").eq("id", conversation_id).single().execute()
        
        if conv.data and conv.data.get("handled_by") == "ai":
            # Buscar histórico de mensagens
            history = supabase.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at").limit(20).execute()
            
            # Gerar resposta da IA
            ai_response = await ai_engine.generate_response(
                organization_id=conv.data["organization_id"],
                message=data.content,
                conversation_history=history.data
            )
            
            # Salvar resposta da IA
            ai_msg = supabase.table("messages").insert({
                "conversation_id": conversation_id,
                "content": ai_response,
                "sender": "ai"
            }).execute()

            # Broadcast AI Message
            if ai_msg.data:
                await manager.broadcast({
                    "type": "new_message",
                    "conversation_id": conversation_id,
                    "message": ai_msg.data[0]
                })
            
            return {"client_message": client_msg.data[0], "ai_response": ai_msg.data[0]}
    
    return {"client_message": client_msg.data[0]}


@router.post("/conversations/{conversation_id}/transfer")
async def transfer_to_human(conversation_id: str):
    """Transferir conversa para atendente humano"""
    supabase = get_supabase()
    
    result = supabase.table("conversations").update({
        "handled_by": "human",
        "status": "transferred"
    }).eq("id", conversation_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    
    return {"message": "Conversa transferida para atendente humano", "conversation": result.data[0]}
