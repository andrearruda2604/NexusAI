from typing import Dict, Any, List, Optional
from datetime import datetime, time
from app.database import get_supabase

class WorkflowEngine:
    """Motor de execução para fluxos visuais (Workflows)"""

    async def evaluate(
        self,
        organization_id: str,
        phone: str,
        message: str
    ) -> Dict[str, Any]:
        """Avaliar todos os workflows para uma mensagem e retornar a ação prioritária"""
        supabase = get_supabase()

        # Buscar workflows ativos
        workflows_res = supabase.table("workflows").select("*").eq("organization_id", organization_id).eq("is_active", True).execute()
        
        if not workflows_res.data:
            return {"action": "continue", "context": {}}

        # Vamos coletar todas as ações resultantes dos workflows que derem match
        final_actions = []

        for workflow in workflows_res.data:
            nodes = workflow.get("nodes", [])
            edges = workflow.get("edges", [])

            if not nodes or not edges:
                continue

            # Encontrar os nós iniciais (triggers)
            triggers = [n for n in nodes if n.get("type") == "trigger" or n.get("data", {}).get("category") == "trigger"]
            
            for trigger in triggers:
                # Vamos verificar se o trigger aplica
                if trigger.get("data", {}).get("nodeType") == "new_message":
                    actions = await self._traverse(trigger["id"], nodes, edges, phone, message, organization_id)
                    final_actions.extend(actions)

        if not final_actions:
            return {"action": "continue", "context": {}}

        # Priorizar ações: block > prioritize > transfer > auto_response > tag
        # Para simplificar, pegamos a primeira ação mais grave ou a primeira que vier.
        action_priority = {
            "block": 5,
            "auto_response": 4,
            "transfer": 3,
            "prioritize": 2,
            "tag": 1
        }
        
        # Ordenar ações pela gravidade/prioridade (maior primeiro)
        final_actions.sort(key=lambda a: action_priority.get(a["action"], 0), reverse=True)
        
        return final_actions[0]

    async def _traverse(
        self,
        current_node_id: str,
        nodes: List[Dict],
        edges: List[Dict],
        phone: str,
        message: str,
        organization_id: str
    ) -> List[Dict[str, Any]]:
        """Atravessar o grafo a partir de um nó e coletar as ações"""
        collected_actions = []
        
        # Encontrar arestas que saem do nó atual
        outgoing_edges = [e for e in edges if e.get("source") == current_node_id]
        
        for edge in outgoing_edges:
            target_id = edge.get("target")
            target_node = next((n for n in nodes if n.get("id") == target_id), None)
            
            if not target_node:
                continue
                
            node_data = target_node.get("data", {})
            category = target_node.get("type") or node_data.get("category")
            node_type = node_data.get("nodeType")
            config = node_data.get("config", {})
            
            if category == "condition":
                # Avaliar a condição
                passed = await self._evaluate_condition(node_type, config, phone, message, organization_id)
                if passed:
                    # Se passou, continua a travessia
                    child_actions = await self._traverse(target_id, nodes, edges, phone, message, organization_id)
                    collected_actions.extend(child_actions)
            elif category == "action":
                # Coletar a ação
                action_result = {
                    "action": node_type,
                    "action_config": config,
                    "workflow_node_id": target_id
                }
                collected_actions.append(action_result)
                # Mesmo sendo uma ação, pode haver próximos nós (ex: tag e depois auto_response)
                child_actions = await self._traverse(target_id, nodes, edges, phone, message, organization_id)
                collected_actions.extend(child_actions)
                
        return collected_actions

    async def _evaluate_condition(
        self,
        condition_type: str,
        config: Dict[str, Any],
        phone: str,
        message: str,
        organization_id: str
    ) -> bool:
        """Avaliar um nó de condição"""
        if condition_type == "keyword":
            keywords = config.get("keywords", [])
            message_lower = message.lower()
            return any(kw.lower() in message_lower for kw in keywords)
            
        elif condition_type == "time":
            start_time = datetime.strptime(config.get("start", "08:00"), "%H:%M").time()
            end_time = datetime.strptime(config.get("end", "18:00"), "%H:%M").time()
            now = datetime.now().time()
            if start_time > end_time:
                is_outside = start_time <= now or now <= end_time
            else:
                is_outside = not (start_time <= now <= end_time)
            # Retorna True se estiver FORA do horário comercial
            return is_outside
            
        elif condition_type == "sentiment":
            from app.services.ai_engine import AIEngine
            ai = AIEngine()
            sentiment_result = await ai.analyze_sentiment(message)
            target = config.get("sentiment", "negative")
            return sentiment_result["sentiment"] == target
            
        return False
