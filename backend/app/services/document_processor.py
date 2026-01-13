import google.generativeai as genai
import httpx
from typing import List, Dict, Any
from app.config import get_settings
from app.database import get_supabase

settings = get_settings()
genai.configure(api_key=settings.gemini_api_key)


class DocumentProcessor:
    """Processador de documentos para vetorização"""
    
    def __init__(self):
        self.chunk_size = 1000
        self.chunk_overlap = 200
    
    async def process_document(self, document_id: str, content: bytes, filename: str):
        """Processar documento e criar embeddings"""
        
        supabase = get_supabase()
        
        # Extrair texto baseado no tipo de arquivo
        text = await self._extract_text(content, filename)
        
        if not text:
            raise ValueError("Não foi possível extrair texto do documento")
        
        # Dividir em chunks
        chunks = self._split_text(text)
        
        # Gerar embeddings e salvar
        for i, chunk in enumerate(chunks):
            embedding = await self._generate_embedding(chunk)
            
            supabase.table("documents").insert({
                "organization_id": (await self._get_doc_org(document_id)),
                "filename": f"{filename} [Parte {i+1}]",
                "content": chunk,
                "embedding": embedding,
                "chunk_index": i,
                "parent_document_id": document_id,
                "status": "ready"
            }).execute()
        
        # Atualizar documento principal
        supabase.table("documents").update({
            "content": text[:1000] + "...",  # Preview
            "status": "ready",
            "metadata": {"total_chunks": len(chunks)}
        }).eq("id", document_id).execute()
    
    async def process_url(self, document_id: str, url: str):
        """Escanear URL e criar embeddings"""
        
        supabase = get_supabase()
        
        # Buscar conteúdo da URL
        async with httpx.AsyncClient() as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            html = response.text
        
        # Extrair texto do HTML (simplificado)
        text = self._extract_text_from_html(html)
        
        if not text:
            raise ValueError("Não foi possível extrair texto da URL")
        
        # Dividir em chunks
        chunks = self._split_text(text)
        
        # Gerar embeddings e salvar
        for i, chunk in enumerate(chunks):
            embedding = await self._generate_embedding(chunk)
            
            supabase.table("documents").insert({
                "organization_id": (await self._get_doc_org(document_id)),
                "filename": f"{url} [Parte {i+1}]",
                "content": chunk,
                "embedding": embedding,
                "chunk_index": i,
                "parent_document_id": document_id,
                "status": "ready"
            }).execute()
        
        # Atualizar documento principal
        supabase.table("documents").update({
            "content": text[:1000] + "...",
            "status": "ready",
            "metadata": {"total_chunks": len(chunks), "source_url": url}
        }).eq("id", document_id).execute()
    
    async def search(self, organization_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Buscar documentos similares"""
        
        embedding = await self._generate_embedding(query)
        
        supabase = get_supabase()
        response = supabase.rpc('search_documents', {
            'query_embedding': embedding,
            'org_id': organization_id,
            'match_threshold': 0.5,
            'match_count': limit
        }).execute()
        
        return response.data
    
    async def _extract_text(self, content: bytes, filename: str) -> str:
        """Extrair texto de diferentes formatos"""
        
        filename_lower = filename.lower()
        
        if filename_lower.endswith('.txt'):
            return content.decode('utf-8')
        
        elif filename_lower.endswith('.csv'):
            return content.decode('utf-8')
        
        elif filename_lower.endswith('.pdf'):
            # Simplificado - em produção use PyPDF2 ou pdfplumber
            try:
                import io
                # Placeholder - precisa de lib PDF
                return content.decode('utf-8', errors='ignore')
            except:
                return ""
        
        elif filename_lower.endswith('.docx'):
            # Simplificado - em produção use python-docx
            try:
                return content.decode('utf-8', errors='ignore')
            except:
                return ""
        
        return content.decode('utf-8', errors='ignore')
    
    def _extract_text_from_html(self, html: str) -> str:
        """Extrair texto de HTML (simplificado)"""
        import re
        
        # Remover scripts e styles
        html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
        html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
        
        # Remover tags HTML
        text = re.sub(r'<[^>]+>', ' ', html)
        
        # Limpar espaços extras
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _split_text(self, text: str) -> List[str]:
        """Dividir texto em chunks"""
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            if end < len(text):
                # Tentar encontrar fim de frase
                last_period = text.rfind('.', start, end)
                if last_period > start + self.chunk_size // 2:
                    end = last_period + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - self.chunk_overlap
        
        return chunks
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Gerar embedding usando Gemini"""
        
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        
        return result['embedding']
    
    async def _get_doc_org(self, document_id: str) -> str:
        """Buscar organization_id do documento"""
        
        supabase = get_supabase()
        result = supabase.table("documents").select("organization_id").eq("id", document_id).single().execute()
        
        return result.data["organization_id"]
