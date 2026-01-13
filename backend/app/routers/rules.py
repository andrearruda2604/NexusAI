from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
from app.database import get_supabase

router = APIRouter()


class RuleCreate(BaseModel):
    organization_id: str
    name: str
    description: Optional[str] = None
    condition_type: str
    condition_config: dict
    action_type: str
    action_config: dict
    priority: int = 0
    is_active: bool = True


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    condition_type: Optional[str] = None
    condition_config: Optional[dict] = None
    action_type: Optional[str] = None
    action_config: Optional[dict] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("/")
async def list_rules(organization_id: str):
    """Listar todas as regras de uma organização"""
    supabase = get_supabase()
    
    result = supabase.table("business_rules").select("*").eq("organization_id", organization_id).order("priority", desc=True).execute()
    
    return result.data


@router.get("/{rule_id}")
async def get_rule(rule_id: str):
    """Buscar regra por ID"""
    supabase = get_supabase()
    
    result = supabase.table("business_rules").select("*").eq("id", rule_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    
    return result.data


@router.post("/")
async def create_rule(data: RuleCreate):
    """Criar nova regra"""
    supabase = get_supabase()
    
    result = supabase.table("business_rules").insert(data.model_dump()).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao criar regra")
    
    return result.data[0]


@router.patch("/{rule_id}")
async def update_rule(rule_id: str, data: RuleUpdate):
    """Atualizar regra"""
    supabase = get_supabase()
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    result = supabase.table("business_rules").update(update_data).eq("id", rule_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    
    return result.data[0]


@router.delete("/{rule_id}")
async def delete_rule(rule_id: str):
    """Excluir regra"""
    supabase = get_supabase()
    
    result = supabase.table("business_rules").delete().eq("id", rule_id).execute()
    
    return {"message": "Regra excluída com sucesso"}


@router.post("/{rule_id}/toggle")
async def toggle_rule(rule_id: str):
    """Ativar/Desativar regra"""
    supabase = get_supabase()
    
    # Buscar estado atual
    current = supabase.table("business_rules").select("is_active").eq("id", rule_id).single().execute()
    
    if not current.data:
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    
    # Inverter estado
    new_state = not current.data["is_active"]
    result = supabase.table("business_rules").update({"is_active": new_state}).eq("id", rule_id).execute()
    
    return {"is_active": new_state, "rule": result.data[0]}


# === Blacklists ===

class BlacklistCreate(BaseModel):
    organization_id: str
    name: str
    description: Optional[str] = None
    phone_numbers: List[str] = []


@router.get("/blacklists/")
async def list_blacklists(organization_id: str):
    """Listar blacklists de uma organização"""
    supabase = get_supabase()
    
    result = supabase.table("blacklists").select("*").eq("organization_id", organization_id).execute()
    
    return result.data


@router.post("/blacklists/")
async def create_blacklist(data: BlacklistCreate):
    """Criar nova blacklist"""
    supabase = get_supabase()
    
    result = supabase.table("blacklists").insert(data.model_dump()).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao criar blacklist")
    
    return result.data[0]


@router.post("/blacklists/{blacklist_id}/add")
async def add_to_blacklist(blacklist_id: str, phone_number: str):
    """Adicionar número à blacklist"""
    supabase = get_supabase()
    
    # Buscar blacklist atual
    current = supabase.table("blacklists").select("phone_numbers").eq("id", blacklist_id).single().execute()
    
    if not current.data:
        raise HTTPException(status_code=404, detail="Blacklist não encontrada")
    
    # Adicionar número
    numbers = current.data["phone_numbers"] or []
    if phone_number not in numbers:
        numbers.append(phone_number)
        supabase.table("blacklists").update({"phone_numbers": numbers}).eq("id", blacklist_id).execute()
    
    return {"message": "Número adicionado à blacklist", "phone_numbers": numbers}


@router.post("/blacklists/{blacklist_id}/remove")
async def remove_from_blacklist(blacklist_id: str, phone_number: str):
    """Remover número da blacklist"""
    supabase = get_supabase()
    
    current = supabase.table("blacklists").select("phone_numbers").eq("id", blacklist_id).single().execute()
    
    if not current.data:
        raise HTTPException(status_code=404, detail="Blacklist não encontrada")
    
    numbers = current.data["phone_numbers"] or []
    if phone_number in numbers:
        numbers.remove(phone_number)
        supabase.table("blacklists").update({"phone_numbers": numbers}).eq("id", blacklist_id).execute()
    
    return {"message": "Número removido da blacklist", "phone_numbers": numbers}
