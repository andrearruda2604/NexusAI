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
    
    result = supabase.table("documents").select("*").eq("organization_id", organization_id).is_("parent_document_id", "null").order("created_at", desc=True).execute()
    
    return result.data


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
    
    # Validar tipo de arquivo
    allowed_types = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv']
    allowed_extensions = ['.txt', '.pdf', '.docx', '.csv']
    
    file_ext = '.' + file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    
    if file.content_type not in allowed_types and file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de arquivo não suportado. Use: TXT, PDF, DOCX ou CSV"
        )
    
    # Validar tamanho (50MB)
    content = await file.read()
    file_size = len(content)
    max_size = 50 * 1024 * 1024  # 50MB
    
    if file_size > max_size:
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
    
    # Criar storage path
    storage_path = f"org-{organization_id}/"
    if conversation_id:
        storage_path += f"conversation-{conversation_id}/"
    else:
        storage_path += "knowledge-base/"
    storage_path += file.filename
    
    # Criar registro inicial
    result = supabase.table("documents").insert({
        "organization_id": organization_id,
        "conversation_id": conversation_id,
        "filename": file.filename,
        "file_type": file.content_type,
        "file_size_bytes": file_size,
        "storage_path": storage_path,
        "business_rule_ids": rule_ids,
        "access_level": access_level,
        "status": "processing"
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao criar documento")
    
    document_id = result.data[0]["id"]
    
    # Processar documento em background (simplificado)
    # Em produção, use Celery ou similar
    try:
        await processor.process_document(document_id, content, file.filename)
    except Exception as e:
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
