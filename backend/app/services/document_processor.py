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
        
        try:
            if filename_lower.endswith('.txt'):
                return content.decode('utf-8')
            
            elif filename_lower.endswith('.csv'):
                return content.decode('utf-8')
            
            elif filename_lower.endswith('.pdf'):
                # Usar PyPDF2 para extrair texto de PDF
                try:
                    from PyPDF2 import PdfReader
                    import io
                    
                    pdf_file = io.BytesIO(content)
                    pdf_reader = PdfReader(pdf_file)
                    
                    text_parts = []
                    for page in pdf_reader.pages:
                        text_parts.append(page.extract_text())
                    
                    return '\n'.join(text_parts)
                except Exception as e:
                    raise ValueError(f"Erro ao processar PDF: {str(e)}")
            
            elif filename_lower.endswith('.docx'):
                # Usar python-docx para extrair texto de DOCX
                try:
                    from docx import Document
                    import io
                    
                    docx_file = io.BytesIO(content)
                    doc = Document(docx_file)
                    
                    text_parts = []
                    for paragraph in doc.paragraphs:
                        text_parts.append(paragraph.text)
                    
                    return '\n'.join(text_parts)
                except Exception as e:
                    raise ValueError(f"Erro ao processar DOCX: {str(e)}")
            
            else:
                # Tentar decodificar como texto simples
                return content.decode('utf-8', errors='ignore')
                
        except UnicodeDecodeError:
            raise ValueError(f"Não foi possível decodificar o arquivo {filename}")
        except Exception as e:
            raise ValueError(f"Erro ao processar arquivo {filename}: {str(e)}")
    
    def _extract_text_from_html(self, html: str) -> str:
        """Extrair texto de HTML usando BeautifulSoup"""
        try:
            from bs4 import BeautifulSoup
            
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remover scripts e styles
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Extrair texto
            text = soup.get_text()
            
            # Limpar espaços extras
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return text
        except Exception as e:
            # Fallback para regex se BeautifulSoup falhar
            import re
            html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
            html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', html)
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
        """Gerar embedding usando Gemini com retry e rate limiting"""
        import asyncio
        import logging
        from google.api_core import exceptions
        
        logger = logging.getLogger(__name__)
        
        # Retry mechanism
        max_retries = 5
        base_delay = 2  # segundos
        
        for attempt in range(max_retries):
            try:
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=text,
                    task_type="retrieval_document"
                )
                return result['embedding']
                
            except exceptions.ResourceExhausted as e:
                # Quota excedida (429)
                delay = base_delay * (2 ** attempt)  # Exponential backoff: 2, 4, 8, 16...
                if delay > 60: delay = 60
                
                logger.warning(f"⚠️ Quota do Gemini excedida. Aguardando {delay}s antes de tentar novamente (Tentativa {attempt+1}/{max_retries})")
                await asyncio.sleep(delay)
                
            except Exception as e:
                logger.error(f"❌ Erro ao gerar embedding: {str(e)}")
                if attempt == max_retries - 1:
                    raise e
                await asyncio.sleep(1)
        
        raise Exception("Falha ao gerar embedding após várias tentativas")
    
    async def _get_doc_org(self, document_id: str) -> str:
        """Buscar organization_id do documento"""
        
        supabase = get_supabase()
        result = supabase.table("documents").select("organization_id").eq("id", document_id).single().execute()
        
        return result.data["organization_id"]
