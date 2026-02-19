from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_supabase
from app.services.ai_engine import AIEngine
from app.services.rules_engine import RulesEngine
import time as time_module

router = APIRouter()
ai_engine = AIEngine()
rules_engine = RulesEngine()


class TestMessageRequest(BaseModel):
    organization_id: str
    message: str
    client_phone: str = "+5511999999999"
    client_name: str = "Teste Admin"
    channel: str = "sandbox"
    conversation_id: Optional[str] = None


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


@router.post("/test")
async def test_message(data: TestMessageRequest):
    """Sandbox: testar mensagem passando pelo pipeline completo (regras + IA)"""
    import traceback
    start = time_module.time()
    supabase = get_supabase()

    try:
        # 1. Reuse existing sandbox conversation or create one
        conversation_id = data.conversation_id
        print(f"[TEST] Starting test. org={data.organization_id}, conv_id={conversation_id}")

        if not conversation_id:
            print("[TEST] Creating new sandbox conversation...")
            conv = supabase.table("conversations").insert({
                "organization_id": data.organization_id,
                "client_phone": data.client_phone,
                "client_name": data.client_name,
                "channel": "whatsapp",
                "status": "active",
                "handled_by": "ai"
            }).execute()
            if conv.data:
                conversation_id = conv.data[0]["id"]
                print(f"[TEST] Created conversation: {conversation_id}")
            else:
                print(f"[TEST] ERROR: No conversation created")
                raise HTTPException(status_code=500, detail="Falha ao criar conversa sandbox")

        # 2. Evaluate rules
        print(f"[TEST] Evaluating rules...")
        rules_start = time_module.time()
        try:
            rules_result = await rules_engine.evaluate(
                data.organization_id, data.client_phone, data.message
            )
        except Exception as re:
            print(f"[TEST] Rules evaluation failed: {re}")
            rules_result = {"action": "continue", "context": {}}
        rules_time = round((time_module.time() - rules_start) * 1000)
        print(f"[TEST] Rules result: {rules_result} ({rules_time}ms)")

        # 3. Save client message
        print(f"[TEST] Saving client message...")
        client_msg = supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "content": data.message,
            "sender": "client"
        }).execute()
        print(f"[TEST] Client message saved: {bool(client_msg.data)}")

        # 4. Generate AI response
        print(f"[TEST] Generating AI response...")
        ai_start = time_module.time()
        history = supabase.table("messages").select("*").eq(
            "conversation_id", conversation_id
        ).order("created_at").limit(20).execute()

        ai_response = await ai_engine.generate_response(
            organization_id=data.organization_id,
            message=data.message,
            conversation_history=history.data,
            rules_context=rules_result.get("context", {})
        )
        ai_time = round((time_module.time() - ai_start) * 1000)
        print(f"[TEST] AI response generated ({ai_time}ms): {ai_response[:100]}...")

        # 5. Save AI response
        ai_msg = supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "content": ai_response,
            "sender": "ai"
        }).execute()

        total_time = round((time_module.time() - start) * 1000)
        print(f"[TEST] Complete! Total: {total_time}ms")

        return {
            "conversation_id": conversation_id,
            "client_message": client_msg.data[0] if client_msg.data else None,
            "ai_response": ai_msg.data[0] if ai_msg.data else None,
            "rules_evaluation": {
                "action": rules_result.get("action", "continue"),
                "rule_name": rules_result.get("rule_name"),
                "action_config": rules_result.get("action_config"),
                "context": rules_result.get("context", {}),
            },
            "metadata": {
                "rules_time_ms": rules_time,
                "ai_time_ms": ai_time,
                "total_time_ms": total_time,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[TEST] ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro no teste: {str(e)}")


