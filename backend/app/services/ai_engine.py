import google.generativeai as genai
from app.config import get_settings
from app.database import get_supabase
from typing import List, Dict, Any, Optional

settings = get_settings()
genai.configure(api_key=settings.gemini_api_key)


class AIEngine:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-pro')
    
    async def generate_response(
        self,
        organization_id: str,
        message: str,
        conversation_history: List[Dict[str, Any]] = None,
        rules_context: Dict[str, Any] = None
    ) -> str:
        """Gerar resposta usando RAG + Gemini"""
        
        # 1. Buscar contexto relevante da base de conhecimento
        knowledge_context = await self._search_knowledge(organization_id, message)
        
        # 2. Buscar regras aplicáveis
        business_rules = await self._get_business_rules(organization_id)
        
        # 3. Formatar histórico
        history_text = self._format_history(conversation_history or [])
        
        # 4. Construir prompt do sistema
        system_prompt = self._build_system_prompt(
            knowledge_context,
            business_rules,
            rules_context
        )
        
        # 5. Gerar resposta
        prompt = f"""
{system_prompt}

### Histórico da Conversa:
{history_text}

### Mensagem do Cliente:
{message}

### Sua Resposta (como assistente Nexus AI):
"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente ou aguarde que um atendente humano irá ajudá-lo."
    
    async def _search_knowledge(self, organization_id: str, query: str, limit: int = 3) -> str:
        """Buscar documentos relevantes usando embeddings"""
        try:
            # Gerar embedding da query
            embedding_model = genai.GenerativeModel('models/embedding-001')
            result = genai.embed_content(
                model="models/embedding-001",
                content=query,
                task_type="retrieval_query"
            )
            query_embedding = result['embedding']
            
            # Buscar documentos similares no Supabase
            supabase = get_supabase()
            response = supabase.rpc('search_documents', {
                'query_embedding': query_embedding,
                'org_id': organization_id,
                'match_threshold': 0.7,
                'match_count': limit
            }).execute()
            
            if response.data:
                contexts = [doc['content'] for doc in response.data if doc.get('content')]
                return "\n\n---\n\n".join(contexts)
        except Exception as e:
            print(f"Erro na busca de conhecimento: {e}")
        
        return ""
    
    async def _get_business_rules(self, organization_id: str) -> str:
        """Buscar regras de negócio ativas"""
        supabase = get_supabase()
        
        result = supabase.table("business_rules").select("*").eq("organization_id", organization_id).eq("is_active", True).order("priority", desc=True).execute()
        
        if not result.data:
            return ""
        
        rules_text = []
        for rule in result.data:
            rules_text.append(f"- {rule['name']}: {rule.get('description', 'Sem descrição')}")
        
        return "\n".join(rules_text)
    
    def _format_history(self, history: List[Dict[str, Any]], max_messages: int = 10) -> str:
        """Formatar histórico de conversa"""
        if not history:
            return "Nenhuma mensagem anterior."
        
        recent = history[-max_messages:]
        formatted = []
        
        for msg in recent:
            sender = "Cliente" if msg['sender'] == 'client' else "Assistente"
            formatted.append(f"{sender}: {msg['content']}")
        
        return "\n".join(formatted)
    
    def _build_system_prompt(
        self,
        knowledge_context: str,
        business_rules: str,
        rules_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Construir prompt do sistema com contexto e regras"""
        
        prompt = """Você é o assistente virtual Nexus AI, especializado em atendimento ao cliente.

## Diretrizes Fundamentais:
1. Seja sempre cordial, profissional e eficiente
2. Responda de forma concisa e direta
3. Use emojis com moderação para tornar a conversa mais amigável
4. Se não souber a resposta, indique que vai encaminhar para um atendente humano
5. NUNCA invente informações - use apenas o contexto fornecido

## RESTRIÇÕES INVIOLÁVEIS (Regras de Negócio):
"""
        
        if business_rules:
            prompt += f"\n{business_rules}\n"
        else:
            prompt += "\nNenhuma regra específica configurada.\n"
        
        if knowledge_context:
            prompt += f"""
## Base de Conhecimento Relevante:
{knowledge_context}

Use estas informações para responder às perguntas do cliente.
"""
        
        if rules_context:
            if rules_context.get("is_vip"):
                prompt += "\n⚠️ ATENÇÃO: Este é um cliente VIP. Priorize o atendimento e ofereça tratamento especial.\n"
        
        return prompt
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analisar sentimento da mensagem"""
        prompt = f"""Analise o sentimento da seguinte mensagem e retorne APENAS um JSON no formato:
{{"sentiment": "positive" | "neutral" | "negative", "score": 0.0 a 1.0, "keywords": ["lista", "de", "palavras-chave"]}}

Mensagem: {text}

JSON:"""
        
        try:
            response = self.model.generate_content(prompt)
            import json
            return json.loads(response.text.strip())
        except:
            return {"sentiment": "neutral", "score": 0.5, "keywords": []}
    
    async def generate_summary(self, messages: List[Dict[str, Any]]) -> str:
        """Gerar resumo da conversa"""
        if not messages:
            return "Conversa sem mensagens."
        
        conversation_text = self._format_history(messages, max_messages=50)
        
        prompt = f"""Resuma a seguinte conversa de atendimento em 2-3 linhas, destacando:
1. Assunto principal
2. Resolução (se houver)
3. Próximos passos (se houver)

Conversa:
{conversation_text}

Resumo:"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except:
            return "Não foi possível gerar o resumo."
