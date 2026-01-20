-- =====================================================
-- MIGRATION: Add Document Associations (SAFE VERSION)
-- Adiciona apenas os campos novos, sem recriar policies existentes
-- =====================================================

-- Adicionar campos à tabela documents (IF NOT EXISTS para segurança)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS business_rule_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'organization' CHECK (access_level IN ('private', 'shared', 'organization', 'public'));

-- Comentários para documentação
COMMENT ON COLUMN documents.conversation_id IS 'Associa documento a uma conversa específica (opcional)';
COMMENT ON COLUMN documents.business_rule_ids IS 'IDs das regras de negócio que podem usar este documento';
COMMENT ON COLUMN documents.storage_path IS 'Caminho completo no storage: org-{id}/[conversation-{id}|knowledge-base]/filename';
COMMENT ON COLUMN documents.file_size_bytes IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN documents.access_level IS 'Nível de acesso: private (conversa), shared (múltiplas conversas), organization (toda org), public';

-- Criar índices para melhor performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_documents_conversation ON documents(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_business_rules ON documents USING GIN(business_rule_ids) WHERE business_rule_ids != '{}';
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON documents(organization_id, access_level);

-- Atualizar função de busca para suportar filtros
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding VECTOR(1536),
    org_id UUID,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5,
    conversation_filter UUID DEFAULT NULL,
    rule_filter UUID DEFAULT NULL,
    access_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    filename TEXT,
    content TEXT,
    similarity FLOAT,
    conversation_id UUID,
    business_rule_ids UUID[],
    access_level TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.filename,
        d.content,
        1 - (d.embedding <=> query_embedding) AS similarity,
        d.conversation_id,
        d.business_rule_ids,
        d.access_level
    FROM documents d
    WHERE d.organization_id = org_id
        AND d.status = 'ready'
        AND d.embedding IS NOT NULL
        AND 1 - (d.embedding <=> query_embedding) > match_threshold
        -- Filtros opcionais
        AND (conversation_filter IS NULL OR d.conversation_id = conversation_filter)
        AND (rule_filter IS NULL OR rule_filter = ANY(d.business_rule_ids))
        AND (access_filter IS NULL OR d.access_level = access_filter)
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
