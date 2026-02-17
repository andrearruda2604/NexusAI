from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_supabase

router = APIRouter()

DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001"


# ───── Modelos ─────

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    settings: Optional[dict] = None


# ───── Perfil ─────

@router.get("/profile/{org_id}")
async def get_profile(org_id: str):
    """Buscar perfil do usuário da organização"""
    supabase = get_supabase()
    
    # Buscar primeiro perfil da organização (MVP: 1 perfil por org)
    result = supabase.table("profiles").select("*").eq("organization_id", org_id).limit(1).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    
    # Se não existe, criar perfil padrão
    new_profile = {
        "organization_id": org_id,
        "full_name": "Admin",
        "avatar_url": None,
        "role": "admin"
    }
    
    try:
        created = supabase.table("profiles").insert(new_profile).execute()
        return created.data[0] if created.data else new_profile
    except Exception:
        # Se falhar por FK (profiles.id → auth.users), retornar mock
        return {
            "id": None,
            "organization_id": org_id,
            "full_name": "Admin",
            "avatar_url": None,
            "role": "admin",
            "created_at": None,
            "updated_at": None
        }


@router.patch("/profile/{org_id}")
async def update_profile(org_id: str, data: ProfileUpdate):
    """Atualizar perfil do usuário"""
    supabase = get_supabase()
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    # Buscar perfil existente
    existing = supabase.table("profiles").select("id").eq("organization_id", org_id).limit(1).execute()
    
    if not existing.data or len(existing.data) == 0:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    profile_id = existing.data[0]["id"]
    result = supabase.table("profiles").update(update_data).eq("id", profile_id).execute()
    
    return result.data[0] if result.data else {"message": "Perfil atualizado"}


# ───── Organização ─────

@router.get("/organization/{org_id}")
async def get_organization(org_id: str):
    """Buscar dados da organização"""
    supabase = get_supabase()
    
    result = supabase.table("organizations").select("*").eq("id", org_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    return result.data


@router.patch("/organization/{org_id}")
async def update_organization(org_id: str, data: OrganizationUpdate):
    """Atualizar dados da organização"""
    supabase = get_supabase()
    
    update_data = {}
    
    if data.name is not None:
        update_data["name"] = data.name
    
    if data.settings is not None:
        # Merge com settings existentes
        existing = supabase.table("organizations").select("settings").eq("id", org_id).single().execute()
        current_settings = existing.data.get("settings", {}) if existing.data else {}
        
        if current_settings is None:
            current_settings = {}
        
        current_settings.update(data.settings)
        update_data["settings"] = current_settings
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    result = supabase.table("organizations").update(update_data).eq("id", org_id).execute()
    
    return result.data[0] if result.data else {"message": "Organização atualizada"}


# ───── Preferências (settings JSONB) ─────

@router.get("/preferences/{org_id}")
async def get_preferences(org_id: str):
    """Buscar preferências da organização (do campo settings JSONB)"""
    supabase = get_supabase()
    
    result = supabase.table("organizations").select("settings").eq("id", org_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    settings = result.data.get("settings") or {}
    
    # Retornar com defaults
    return {
        "theme": settings.get("theme", "light"),
        "language": settings.get("language", "pt-BR"),
        "timezone": settings.get("timezone", "America/Sao_Paulo"),
        "notifications": {
            "email": settings.get("notifications_email", True),
            "push": settings.get("notifications_push", True),
            "sound": settings.get("notifications_sound", True),
            "digest_frequency": settings.get("digest_frequency", "daily"),
        },
        "ai_prompt": settings.get("ai_prompt", ""),
        "company_sector": settings.get("company_sector", ""),
        "company_cnpj": settings.get("company_cnpj", ""),
    }


@router.patch("/preferences/{org_id}")
async def update_preferences(org_id: str, data: dict):
    """Atualizar preferências da organização"""
    supabase = get_supabase()
    
    # Buscar settings atuais
    existing = supabase.table("organizations").select("settings").eq("id", org_id).single().execute()
    
    if not existing.data:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    current_settings = existing.data.get("settings") or {}
    
    # Flatten de notificações se vier nested
    if "notifications" in data and isinstance(data["notifications"], dict):
        notif = data.pop("notifications")
        data["notifications_email"] = notif.get("email", True)
        data["notifications_push"] = notif.get("push", True)
        data["notifications_sound"] = notif.get("sound", True)
        data["digest_frequency"] = notif.get("digest_frequency", "daily")
    
    current_settings.update(data)
    
    result = supabase.table("organizations").update({"settings": current_settings}).eq("id", org_id).execute()
    
    return {"message": "Preferências atualizadas", "settings": current_settings}
