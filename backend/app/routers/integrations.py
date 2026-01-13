from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_supabase

router = APIRouter()


class IntegrationCreate(BaseModel):
    organization_id: str
    type: str
    name: str
    config: dict = {}


class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[dict] = None
    status: Optional[str] = None


@router.get("/")
async def list_integrations(organization_id: str):
    """Listar integrações de uma organização"""
    supabase = get_supabase()
    
    result = supabase.table("integrations").select("*").eq("organization_id", organization_id).execute()
    
    return result.data


@router.get("/{integration_id}")
async def get_integration(integration_id: str):
    """Buscar integração por ID"""
    supabase = get_supabase()
    
    result = supabase.table("integrations").select("*").eq("id", integration_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Integração não encontrada")
    
    return result.data


@router.post("/")
async def create_integration(data: IntegrationCreate):
    """Criar nova integração"""
    supabase = get_supabase()
    
    result = supabase.table("integrations").insert(data.model_dump()).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao criar integração")
    
    return result.data[0]


@router.patch("/{integration_id}")
async def update_integration(integration_id: str, data: IntegrationUpdate):
    """Atualizar integração"""
    supabase = get_supabase()
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    result = supabase.table("integrations").update(update_data).eq("id", integration_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Integração não encontrada")
    
    return result.data[0]


@router.delete("/{integration_id}")
async def delete_integration(integration_id: str):
    """Excluir integração"""
    supabase = get_supabase()
    
    supabase.table("integrations").delete().eq("id", integration_id).execute()
    
    return {"message": "Integração excluída com sucesso"}


# === API Keys ===

class APIKeyCreate(BaseModel):
    organization_id: str
    name: str
    permissions: dict = {"read": True, "write": False}


@router.get("/api-keys/")
async def list_api_keys(organization_id: str):
    """Listar API Keys de uma organização"""
    supabase = get_supabase()
    
    result = supabase.table("api_keys").select("id, name, key_prefix, permissions, is_active, created_at, last_used_at").eq("organization_id", organization_id).execute()
    
    return result.data


@router.post("/api-keys/")
async def create_api_key(data: APIKeyCreate):
    """Criar nova API Key"""
    import secrets
    import hashlib
    
    supabase = get_supabase()
    
    # Gerar chave
    key = f"nx_{secrets.token_hex(24)}"
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    key_prefix = key[:12] + "..."
    
    result = supabase.table("api_keys").insert({
        "organization_id": data.organization_id,
        "name": data.name,
        "key_hash": key_hash,
        "key_prefix": key_prefix,
        "permissions": data.permissions
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao criar API Key")
    
    # Retornar chave completa apenas uma vez
    return {
        "id": result.data[0]["id"],
        "name": data.name,
        "key": key,  # Mostrar apenas na criação!
        "message": "Guarde esta chave em local seguro. Ela não será exibida novamente."
    }


@router.delete("/api-keys/{key_id}")
async def delete_api_key(key_id: str):
    """Revogar API Key"""
    supabase = get_supabase()
    
    supabase.table("api_keys").update({"is_active": False}).eq("id", key_id).execute()
    
    return {"message": "API Key revogada com sucesso"}
