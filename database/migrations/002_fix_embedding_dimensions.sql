-- =====================================================
-- MIGRATION: Fix Embedding Dimensions for Gemini
-- Change vector size from 1536 (OpenAI) to 768 (Gemini)
-- =====================================================

-- 1. Alterar a coluna embedding na tabela documents
ALTER TABLE documents ALTER COLUMN embedding TYPE vector(768);

-- 2. Atualizar a função de busca para aceitar vetor de 768 dimensões
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding VECTOR(768),
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
