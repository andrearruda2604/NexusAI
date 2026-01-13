import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface Organization {
    id: string;
    name: string;
    created_at: string;
}

export interface BusinessRule {
    id: string;
    organization_id: string;
    name: string;
    condition_type: 'blacklist' | 'vip' | 'keyword' | 'time';
    condition_config: Record<string, unknown>;
    action_type: 'block' | 'prioritize' | 'transfer' | 'tag';
    action_config: Record<string, unknown>;
    priority: number;
    is_active: boolean;
    created_at: string;
}

export interface Document {
    id: string;
    organization_id: string;
    filename: string;
    content: string | null;
    embedding: number[] | null;
    metadata: Record<string, unknown>;
    status: 'processing' | 'ready' | 'error';
    created_at: string;
}

export interface Conversation {
    id: string;
    organization_id: string;
    client_phone: string;
    client_name: string;
    channel: 'whatsapp' | 'instagram' | 'facebook' | 'webchat';
    status: 'active' | 'closed' | 'transferred';
    sentiment: 'positive' | 'neutral' | 'negative';
    handled_by: 'ai' | 'human';
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender: 'client' | 'ai' | 'agent';
    content: string;
    created_at: string;
}

export interface Blacklist {
    id: string;
    organization_id: string;
    name: string;
    phone_numbers: string[];
    created_at: string;
}

// Helper functions
export async function getOrganization(orgId: string) {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

    if (error) throw error;
    return data as Organization;
}

export async function getBusinessRules(orgId: string) {
    const { data, error } = await supabase
        .from('business_rules')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

    if (error) throw error;
    return data as BusinessRule[];
}

export async function getConversations(orgId: string, status?: string) {
    let query = supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Conversation[];
}

export async function getMessages(conversationId: string) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
}

export async function getDocuments(orgId: string) {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Document[];
}
