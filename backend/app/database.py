from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

# Criar cliente Supabase
supabase: Client = create_client(
    supabase_url=settings.supabase_url,
    supabase_key=settings.supabase_service_key
)


def get_supabase() -> Client:
    return supabase
