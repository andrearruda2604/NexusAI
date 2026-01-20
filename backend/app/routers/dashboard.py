from fastapi import APIRouter
from app.database import get_supabase
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats")
async def get_stats(organization_id: str):
    """Obter estatísticas do dashboard"""
    supabase = get_supabase()
    
    # Datas para filtro
    now = datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Total de Atendimentos (Mês Atual)
    total_chats = supabase.table("conversations").select("*", count="exact")\
        .eq("organization_id", organization_id)\
        .gte("created_at", start_of_month.isoformat())\
        .execute()
    
    count_total = total_chats.count or 0
    
    # 2. Taxa de Resolução IA (Conversas onde handled_by = 'ai' encerradas)
    # Nota: Simplificação - considerar 'ai' como handled_by final ou checking messages
    ai_chats = supabase.table("conversations").select("*", count="exact")\
        .eq("organization_id", organization_id)\
        .eq("handled_by", "ai")\
        .gte("created_at", start_of_month.isoformat())\
        .execute()
        
    count_ai = ai_chats.count or 0
    ai_rate = (count_ai / count_total * 100) if count_total > 0 else 0
    
    # 3. Tempo Médio (Simulado por enquanto, pois precisaria de diff entre mensagens)
    # TODO: Implementar cálculo real baseado em messages.created_at
    avg_time = "1m 45s"
    
    # 4. Volume Diário (Últimos 7 dias)
    daily_volume = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        day_chats = supabase.table("conversations").select("id", count="exact")\
            .eq("organization_id", organization_id)\
            .gte("created_at", day_start.isoformat())\
            .lte("created_at", day_end.isoformat())\
            .execute()
            
        daily_volume.append({
            "name": day.strftime("%a"), # Mon, Tue...
            "value": day_chats.count or 0
        })
        
    return {
        "kpis": {
            "total_chats": count_total,
            "ai_resolution_rate": round(ai_rate, 1),
            "avg_time": avg_time
        },
        "volume_chart": daily_volume
    }
