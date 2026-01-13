from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.database import get_supabase
from app.services.ai_engine import AIEngine
from app.services.rules_engine import RulesEngine

router = APIRouter()
ai_engine = AIEngine()
rules_engine = RulesEngine()


class WhatsAppMessage(BaseModel):
    instance: str
    data: Dict[str, Any]


class EvolutionWebhook(BaseModel):
    event: str
    instance: str
    data: Dict[str, Any]


async def process_incoming_message(organization_id: str, phone: str, message: str, instance: str):
    """Processar mensagem recebida"""
    supabase = get_supabase()
    
    # 1. Verificar regras de negócio
    rule_result = await rules_engine.evaluate(organization_id, phone, message)
    
    if rule_result["action"] == "block":
        # Número na blacklist, ignorar
        return
    
    # 2. Buscar ou criar conversa
    existing = supabase.table("conversations").select("*").eq("client_phone", phone).eq("status", "active").single().execute()
    
    if existing.data:
        conversation_id = existing.data["id"]
    else:
        new_conv = supabase.table("conversations").insert({
            "organization_id": organization_id,
            "client_phone": phone,
            "channel": "whatsapp",
            "status": "active",
            "handled_by": "ai"
        }).execute()
        conversation_id = new_conv.data[0]["id"]
    
    # 3. Salvar mensagem do cliente
    supabase.table("messages").insert({
        "conversation_id": conversation_id,
        "content": message,
        "sender": "client"
    }).execute()
    
    # 4. Verificar se deve transferir
    if rule_result["action"] == "transfer":
        supabase.table("conversations").update({
            "handled_by": "human",
            "status": "transferred"
        }).eq("id", conversation_id).execute()
        return
    
    # 5. Gerar resposta da IA
    conversation = supabase.table("conversations").select("*").eq("id", conversation_id).single().execute()
    if conversation.data.get("handled_by") == "ai":
        history = supabase.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at").limit(20).execute()
        
        ai_response = await ai_engine.generate_response(
            organization_id=organization_id,
            message=message,
            conversation_history=history.data,
            rules_context=rule_result.get("context", {})
        )
        
        # Salvar resposta
        supabase.table("messages").insert({
            "conversation_id": conversation_id,
            "content": ai_response,
            "sender": "ai"
        }).execute()
        
        # TODO: Enviar resposta via Evolution API
        # await send_whatsapp_message(instance, phone, ai_response)


@router.post("/evolution")
async def evolution_webhook(request: Request, background_tasks: BackgroundTasks):
    """Webhook da Evolution API (WhatsApp)"""
    try:
        body = await request.json()
        event = body.get("event")
        instance = body.get("instance")
        data = body.get("data", {})
        
        if event == "messages.upsert":
            # Nova mensagem recebida
            message_data = data.get("message", {})
            
            if message_data.get("fromMe"):
                # Mensagem enviada, ignorar
                return {"status": "ignored"}
            
            phone = data.get("key", {}).get("remoteJid", "").replace("@s.whatsapp.net", "")
            text = message_data.get("conversation") or message_data.get("extendedTextMessage", {}).get("text", "")
            
            if phone and text:
                # Buscar organização pelo instance
                supabase = get_supabase()
                integration = supabase.table("integrations").select("organization_id").eq("type", "whatsapp").eq("config->>instance", instance).single().execute()
                
                if integration.data:
                    background_tasks.add_task(
                        process_incoming_message,
                        integration.data["organization_id"],
                        phone,
                        text,
                        instance
                    )
        
        return {"status": "ok"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/erp/{integration_id}")
async def erp_webhook(integration_id: str, request: Request):
    """Webhook genérico para ERPs"""
    try:
        body = await request.json()
        supabase = get_supabase()
        
        # Buscar integração
        integration = supabase.table("integrations").select("*").eq("id", integration_id).single().execute()
        
        if not integration.data:
            raise HTTPException(status_code=404, detail="Integração não encontrada")
        
        # Log do webhook
        supabase.table("audit_logs").insert({
            "organization_id": integration.data["organization_id"],
            "action": "webhook_received",
            "entity_type": "integration",
            "entity_id": integration_id,
            "new_data": body
        }).execute()
        
        # Atualizar last_sync
        supabase.table("integrations").update({
            "last_sync_at": "now()"
        }).eq("id", integration_id).execute()
        
        return {"status": "ok", "message": "Webhook processado"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
