-- =====================================================
-- NEXUS AI - DATABASE SCHEMA
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Habilitar extensão pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Organizações (Multi-tenancy)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Usuários (extende Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Regras de Negócio (Motor de Regras)
CREATE TABLE business_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('blacklist', 'vip', 'keyword', 'time', 'sentiment')),
    condition_config JSONB NOT NULL DEFAULT '{}',
    action_type TEXT NOT NULL CHECK (action_type IN ('block', 'prioritize', 'transfer', 'tag', 'notify', 'auto_response')),
    action_config JSONB NOT NULL DEFAULT '{}',
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blacklists
CREATE TABLE blacklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    phone_numbers TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documentos (Base de Conhecimento)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_url TEXT,
    content TEXT,
    embedding VECTOR(1536), -- Para embeddings do OpenAI/Gemini
    metadata JSONB DEFAULT '{}',
    chunk_index INT DEFAULT 0,
    parent_document_id UUID REFERENCES documents(id),
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversas
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    client_phone TEXT,
    client_name TEXT,
    client_metadata JSONB DEFAULT '{}',
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'facebook', 'webchat')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'transferred', 'waiting')),
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score FLOAT,
    handled_by TEXT DEFAULT 'ai' CHECK (handled_by IN ('ai', 'human')),
    assigned_agent_id UUID REFERENCES profiles(id),
    context_summary TEXT, -- Resumo gerado por IA
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mensagens
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('client', 'ai', 'agent', 'system')),
    sender_id UUID, -- ID do agente se for humano
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'audio', 'document', 'location')),
    media_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Integrações
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('whatsapp', 'instagram', 'facebook', 'webhook', 'erp')),
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}', -- Configurações criptografadas
    status TEXT DEFAULT 'pending' CHECK (status IN ('connected', 'disconnected', 'pending', 'error')),
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL, -- Hash da chave, nunca armazene em texto plano
    key_prefix TEXT NOT NULL, -- Prefixo para identificação (ex: nx_prod_xxx)
    permissions JSONB DEFAULT '{"read": true, "write": false}',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Logs de Auditoria
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Métricas (para Dashboard)
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'conversations', 'resolution_rate', 'response_time', etc.
    value FLOAT NOT NULL,
    metadata JSONB DEFAULT '{}',
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_business_rules_org ON business_rules(organization_id);
CREATE INDEX idx_business_rules_active ON business_rules(organization_id, is_active);
CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_status ON documents(organization_id, status);
CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_conversations_status ON conversations(organization_id, status);
CREATE INDEX idx_conversations_channel ON conversations(organization_id, channel);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(conversation_id, created_at);
CREATE INDEX idx_integrations_org ON integrations(organization_id);
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_metrics_org ON metrics(organization_id);
CREATE INDEX idx_metrics_type ON metrics(organization_id, metric_type, period_start);

-- Índice para busca vetorial (HNSW para melhor performance)
CREATE INDEX idx_documents_embedding ON documents 
USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Policies: Usuário só vê dados da própria organização
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view own profile" ON profiles
    FOR ALL USING (id = auth.uid());

CREATE POLICY "Users can view org business rules" ON business_rules
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view org blacklists" ON blacklists
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view org documents" ON documents
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view org conversations" ON conversations
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view conversation messages" ON messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can view org integrations" ON integrations
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view org api keys" ON api_keys
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view org audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can view org metrics" ON metrics
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- FUNÇÕES
-- =====================================================

-- Função para busca semântica em documentos
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding VECTOR(1536),
    org_id UUID,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    filename TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.filename,
        d.content,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM documents d
    WHERE d.organization_id = org_id
        AND d.status = 'ready'
        AND d.embedding IS NOT NULL
        AND 1 - (d.embedding <=> query_embedding) > match_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_business_rules_updated_at
    BEFORE UPDATE ON business_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_blacklists_updated_at
    BEFORE UPDATE ON blacklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- DADOS INICIAIS (Opcional)
-- =====================================================

-- Criar organização de demonstração
INSERT INTO organizations (id, name, slug) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Demo Organization', 'demo');

-- Criar regras de exemplo
INSERT INTO business_rules (organization_id, name, condition_type, condition_config, action_type, action_config, priority) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Blacklist Check', 'blacklist', '{"list_id": "spam_blacklist"}', 'block', '{"message": "Número bloqueado"}', 100),
    ('00000000-0000-0000-0000-000000000001', 'VIP Priority', 'vip', '{"tags": ["vip", "premium"]}', 'prioritize', '{"notify_agents": true}', 90),
    ('00000000-0000-0000-0000-000000000001', 'After Hours', 'time', '{"start": "18:00", "end": "08:00"}', 'auto_response', '{"message": "Obrigado pelo contato! Nosso horário de atendimento é das 8h às 18h. Retornaremos sua mensagem em breve."}', 50);

-- Criar blacklist de exemplo
INSERT INTO blacklists (organization_id, name, description, phone_numbers) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Spam_Blacklist_v1', 'Lista de números de spam conhecidos', ARRAY['5511999990000', '5511999990001']);
