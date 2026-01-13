from app.database import get_supabase
from typing import Dict, Any, List
from datetime import datetime, time


class RulesEngine:
    """Motor de Regras para avaliação de condições e ações"""
    
    async def evaluate(
        self,
        organization_id: str,
        phone: str,
        message: str
    ) -> Dict[str, Any]:
        """Avaliar todas as regras para uma mensagem"""
        
        supabase = get_supabase()
        
        # Buscar regras ativas ordenadas por prioridade
        rules = supabase.table("business_rules").select("*").eq("organization_id", organization_id).eq("is_active", True).order("priority", desc=True).execute()
        
        if not rules.data:
            return {"action": "continue", "context": {}}
        
        # Avaliar cada regra
        for rule in rules.data:
            result = await self._evaluate_rule(rule, phone, message, organization_id)
            
            if result["matched"]:
                return {
                    "action": rule["action_type"],
                    "action_config": rule["action_config"],
                    "rule_name": rule["name"],
                    "context": result.get("context", {})
                }
        
        return {"action": "continue", "context": {}}
    
    async def _evaluate_rule(
        self,
        rule: Dict[str, Any],
        phone: str,
        message: str,
        organization_id: str
    ) -> Dict[str, Any]:
        """Avaliar uma regra específica"""
        
        condition_type = rule["condition_type"]
        condition_config = rule["condition_config"]
        
        if condition_type == "blacklist":
            return await self._check_blacklist(phone, condition_config, organization_id)
        
        elif condition_type == "vip":
            return await self._check_vip(phone, condition_config, organization_id)
        
        elif condition_type == "keyword":
            return self._check_keywords(message, condition_config)
        
        elif condition_type == "time":
            return self._check_business_hours(condition_config)
        
        elif condition_type == "sentiment":
            from app.services.ai_engine import AIEngine
            ai = AIEngine()
            sentiment = await ai.analyze_sentiment(message)
            return self._check_sentiment(sentiment, condition_config)
        
        return {"matched": False}
    
    async def _check_blacklist(
        self,
        phone: str,
        config: Dict[str, Any],
        organization_id: str
    ) -> Dict[str, Any]:
        """Verificar se número está na blacklist"""
        
        supabase = get_supabase()
        
        # Buscar blacklists da organização
        blacklists = supabase.table("blacklists").select("phone_numbers").eq("organization_id", organization_id).execute()
        
        for bl in blacklists.data or []:
            if phone in (bl.get("phone_numbers") or []):
                return {"matched": True, "context": {"reason": "blacklist"}}
        
        return {"matched": False}
    
    async def _check_vip(
        self,
        phone: str,
        config: Dict[str, Any],
        organization_id: str
    ) -> Dict[str, Any]:
        """Verificar se cliente é VIP"""
        
        supabase = get_supabase()
        
        # Buscar conversas anteriores do cliente
        conversations = supabase.table("conversations").select("tags").eq("organization_id", organization_id).eq("client_phone", phone).execute()
        
        vip_tags = config.get("tags", ["vip", "premium"])
        
        for conv in conversations.data or []:
            tags = conv.get("tags") or []
            if any(tag in vip_tags for tag in tags):
                return {"matched": True, "context": {"is_vip": True}}
        
        return {"matched": False}
    
    def _check_keywords(self, message: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Verificar presença de palavras-chave"""
        
        keywords = config.get("keywords", [])
        message_lower = message.lower()
        
        matched_keywords = [kw for kw in keywords if kw.lower() in message_lower]
        
        if matched_keywords:
            return {"matched": True, "context": {"keywords": matched_keywords}}
        
        return {"matched": False}
    
    def _check_business_hours(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Verificar se está fora do horário comercial"""
        
        start_time = datetime.strptime(config.get("start", "08:00"), "%H:%M").time()
        end_time = datetime.strptime(config.get("end", "18:00"), "%H:%M").time()
        
        now = datetime.now().time()
        
        # Se start > end, significa horário noturno (ex: 18:00 até 08:00)
        if start_time > end_time:
            is_outside = start_time <= now or now <= end_time
        else:
            is_outside = not (start_time <= now <= end_time)
        
        if is_outside:
            return {"matched": True, "context": {"outside_hours": True}}
        
        return {"matched": False}
    
    def _check_sentiment(
        self,
        sentiment: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Verificar sentimento da mensagem"""
        
        target_sentiment = config.get("sentiment", "negative")
        threshold = config.get("threshold", 0.7)
        
        if sentiment["sentiment"] == target_sentiment and sentiment["score"] >= threshold:
            return {"matched": True, "context": {"sentiment": sentiment}}
        
        return {"matched": False}
