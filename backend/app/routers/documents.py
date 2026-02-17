from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from app.database import get_supabase
from app.services.document_processor import DocumentProcessor

router = APIRouter()
processor = DocumentProcessor()


class DocumentCreate(BaseModel):
    organization_id: str
    filename: str
    content: Optional[str] = None
    file_type: Optional[str] = None


class URLCrawlRequest(BaseModel):
    organization_id: str
    url: str


@router.get("/")
async def list_documents(organization_id: str):
    """Listar documentos de uma organização"""
    supabase = get_supabase()
    
    # Buscar documentos pai (sem parent_document_id)
    result = supabase.table("documents").select("*").eq("organization_id", organization_id).is_("parent_document_id", "null").order("created_at", desc=True).execute()
    
    documents = result.data or []
    
    # Para cada documento pai, contar os fragmentos (chunks filhos)
    for doc in documents:
        chunks = supabase.table("documents").select("id", count="exact").eq("parent_document_id", doc["id"]).execute()
        doc["fragments"] = chunks.count if chunks.count else 0
        
        # Se metadata tem total_chunks, usar como fallback
        if doc["fragments"] == 0 and doc.get("metadata") and doc["metadata"].get("total_chunks"):
            doc["fragments"] = doc["metadata"]["total_chunks"]
    
    return documents


@router.get("/{document_id}")
async def get_document(document_id: str):
    """Buscar documento por ID"""
    supabase = get_supabase()
    
    result = supabase.table("documents").select("*").eq("id", document_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    return result.data


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    organization_id: str = Form(...),
    conversation_id: Optional[str] = Form(None),
    business_rule_ids: Optional[str] = Form(None),  # JSON string array
    access_level: str = Form("organization")
):
    """Upload de documento para processamento"""
    import json
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"📤 Upload iniciado: {file.filename}")
    
    # Validar tipo de arquivo
    allowed_types = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv']
    allowed_extensions = ['.txt', '.pdf', '.docx', '.csv']
    
    file_ext = '.' + file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    
    if file.content_type not in allowed_types and file_ext not in allowed_extensions:
        logger.error(f"❌ Tipo não suportado: {file.content_type}, ext: {file_ext}")
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de arquivo não suportado. Use: TXT, PDF, DOCX ou CSV"
        )
    
    # Validar tamanho (50MB)
    content = await file.read()
    file_size = len(content)
    max_size = 50 * 1024 * 1024  # 50MB
    
    logger.info(f"📊 Tamanho do arquivo: {file_size} bytes")
    
    if file_size > max_size:
        logger.error(f"❌ Arquivo muito grande: {file_size} bytes")
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo muito grande. Tamanho máximo: 50MB"
        )
    
    supabase = get_supabase()
    
    # Parse business_rule_ids se fornecido
    rule_ids = []
    if business_rule_ids:
        try:
            rule_ids = json.loads(business_rule_ids)
        except:
            pass
    
    # Sanitizar nome do arquivo (remover caracteres especiais)
    import re
    import unicodedata
    
    # Normalizar unicode e remover acentos
    filename_normalized = unicodedata.normalize('NFKD', file.filename)
    filename_ascii = filename_normalized.encode('ASCII', 'ignore').decode('ASCII')
    
    # Remover caracteres não permitidos (manter apenas letras, números, pontos, hífens e underscores)
    filename_safe = re.sub(r'[^a-zA-Z0-9._-]', '_', filename_ascii)
    
    # Remover múltiplos underscores consecutivos
    filename_safe = re.sub(r'_+', '_', filename_safe)
    
    logger.info(f"📝 Nome original: {file.filename}")
    logger.info(f"📝 Nome sanitizado: {filename_safe}")
    
    # Criar storage path
    storage_path = f"org-{organization_id}/"
    if conversation_id:
        storage_path += f"conversation-{conversation_id}/"
    else:
        storage_path += "knowledge-base/"
    storage_path += filename_safe
    
    logger.info(f"📁 Storage path: {storage_path}")
    
    # Upload para Supabase Storage
    try:
        logger.info("☁️ Iniciando upload para Supabase Storage...")
        storage_response = supabase.storage.from_("nexus-documents").upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
        logger.info(f"✅ Upload para storage concluído: {storage_response}")
        
        # Obter URL pública (ou assinada se privado)
        file_url = supabase.storage.from_("nexus-documents").get_public_url(storage_path)
        logger.info(f"🔗 URL do arquivo: {file_url}")
        
    except Exception as e:
        logger.error(f"❌ Erro no upload para storage: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao fazer upload para storage: {str(e)}"
        )
    
    # Criar registro inicial
    try:
        logger.info("💾 Criando registro no banco de dados...")
        result = supabase.table("documents").insert({
            "organization_id": organization_id,
            "conversation_id": conversation_id,
            "filename": file.filename,
            "file_type": file.content_type,
            "file_size_bytes": file_size,
            "file_url": file_url,
            "storage_path": storage_path,
            "business_rule_ids": rule_ids,
            "access_level": access_level,
            "status": "processing"
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Erro ao criar documento")
        
        document_id = result.data[0]["id"]
        logger.info(f"✅ Documento criado: {document_id}")
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar registro: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao criar documento: {str(e)}")
    
    # Processar documento em background (simplificado)
    try:
        logger.info(f"🔄 Processando documento {document_id}...")
        await processor.process_document(document_id, content, file.filename)
        logger.info(f"✅ Documento processado com sucesso: {document_id}")
    except Exception as e:
        logger.error(f"❌ Erro ao processar documento: {str(e)}", exc_info=True)
        supabase.table("documents").update({
            "status": "error",
            "error_message": str(e)
        }).eq("id", document_id).execute()
        raise HTTPException(status_code=500, detail=f"Erro ao processar documento: {str(e)}")
    
    return {"message": "Documento enviado para processamento", "document_id": document_id}


@router.post("/crawl")
async def crawl_url(data: URLCrawlRequest):
    """Escanear URL e extrair conteúdo"""
    supabase = get_supabase()
    
    # Criar registro inicial
    result = supabase.table("documents").insert({
        "organization_id": data.organization_id,
        "filename": data.url,
        "file_type": "url",
        "status": "processing"
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao criar documento")
    
    document_id = result.data[0]["id"]
    
    # Processar URL em background
    try:
        await processor.process_url(document_id, data.url)
    except Exception as e:
        supabase.table("documents").update({
            "status": "error",
            "error_message": str(e)
        }).eq("id", document_id).execute()
    
    return {"message": "URL enviada para processamento", "document_id": document_id}


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Excluir documento e seus fragmentos"""
    supabase = get_supabase()
    
    # Excluir fragmentos primeiro
    supabase.table("documents").delete().eq("parent_document_id", document_id).execute()
    
    # Excluir documento principal
    supabase.table("documents").delete().eq("id", document_id).execute()
    
    return {"message": "Documento excluído com sucesso"}


@router.post("/search")
async def semantic_search(organization_id: str, query: str, limit: int = 5):
    """Busca semântica em documentos"""
    try:
        results = await processor.search(organization_id, query, limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
