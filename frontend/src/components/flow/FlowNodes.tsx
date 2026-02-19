"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
    MessageSquare,
    Clock,
    Webhook,
    Zap,
    Ban,
    UserCheck,
    ArrowRightLeft,
    Tag,
    Bell,
    Filter,
    GitBranch,
    Database,
    FileText,
    Search,
    Save,
    Timer,
    Repeat,
    Merge,
    type LucideIcon,
} from "lucide-react";

/* ===================================================
   Shared styles & helpers
   =================================================== */

const categoryStyles: Record<string, { bg: string; border: string; accent: string; icon: string }> = {
    trigger: { bg: "bg-blue-50", border: "border-blue-300", accent: "bg-blue-500", icon: "text-blue-600" },
    condition: { bg: "bg-emerald-50", border: "border-emerald-300", accent: "bg-emerald-500", icon: "text-emerald-600" },
    action: { bg: "bg-amber-50", border: "border-amber-300", accent: "bg-amber-500", icon: "text-amber-600" },
    integration: { bg: "bg-purple-50", border: "border-purple-300", accent: "bg-purple-500", icon: "text-purple-600" },
    data: { bg: "bg-rose-50", border: "border-rose-300", accent: "bg-rose-500", icon: "text-rose-600" },
    logic: { bg: "bg-slate-50", border: "border-slate-300", accent: "bg-slate-500", icon: "text-slate-600" },
};

const nodeIcons: Record<string, LucideIcon> = {
    // Triggers
    new_message: MessageSquare,
    schedule: Clock,
    webhook_trigger: Webhook,
    integration_event: Zap,
    // Conditions
    keyword: Filter,
    sentiment: Zap,
    time_check: Clock,
    blocklist: Ban,
    vip_check: UserCheck,
    channel_check: MessageSquare,
    // Actions
    auto_response: MessageSquare,
    transfer: ArrowRightLeft,
    block: Ban,
    add_tag: Tag,
    notify: Bell,
    prioritize: UserCheck,
    // Integrations
    erp_query: Database,
    http_request: Webhook,
    // Data
    search_docs: Search,
    search_knowledge: FileText,
    save_variable: Save,
    // Logic
    if_else: GitBranch,
    switch_node: GitBranch,
    delay: Timer,
    loop: Repeat,
    merge: Merge,
};

/* ===================================================
   Base Flow Node
   =================================================== */

interface FlowNodeData {
    label: string;
    category: string;
    nodeType: string;
    config?: Record<string, any>;
    description?: string;
    [key: string]: unknown;
}

function BaseFlowNode({ data, selected }: NodeProps & { data: FlowNodeData }) {
    const category = data.category || "trigger";
    const styles = categoryStyles[category] || categoryStyles.trigger;
    const Icon = nodeIcons[data.nodeType] || Zap;

    const hasInput = category !== "trigger";
    const isLogicNode = data.nodeType === "if_else" || data.nodeType === "switch_node";

    return (
        <div
            className={`
                relative rounded-xl border-2 shadow-sm min-w-[200px] max-w-[260px]
                transition-all duration-150
                ${styles.bg} ${styles.border}
                ${selected ? "ring-2 ring-blue-400 ring-offset-2 shadow-lg scale-[1.02]" : "hover:shadow-md"}
            `}
        >
            {/* Input Handle */}
            {hasInput && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !-left-1.5"
                />
            )}

            {/* Header */}
            <div className={`flex items-center gap-2 px-3 py-2 ${styles.accent} rounded-t-[10px]`}>
                <Icon className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white uppercase tracking-wide truncate">
                    {data.label}
                </span>
            </div>

            {/* Body */}
            <div className="px-3 py-2.5">
                {data.description && (
                    <p className="text-xs text-slate-500 leading-relaxed">{data.description}</p>
                )}
                {data.config && Object.keys(data.config).length > 0 && (
                    <div className="mt-1.5 space-y-1">
                        {Object.entries(data.config).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1.5 text-[11px]">
                                <span className="text-slate-400 font-medium">{key}:</span>
                                <span className="text-slate-600 truncate">
                                    {Array.isArray(value) ? value.join(", ") : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Output Handles */}
            {isLogicNode ? (
                <>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="true"
                        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white !-right-1.5"
                        style={{ top: "40%" }}
                    />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="false"
                        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white !-right-1.5"
                        style={{ top: "70%" }}
                    />
                    {/* Labels for handles */}
                    <span className="absolute right-4 text-[9px] font-bold text-emerald-600" style={{ top: "36%" }}>SIM</span>
                    <span className="absolute right-4 text-[9px] font-bold text-red-500" style={{ top: "66%" }}>NÃO</span>
                </>
            ) : (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !-right-1.5"
                />
            )}
        </div>
    );
}

export const TriggerNode = memo(BaseFlowNode);
export const ConditionFlowNode = memo(BaseFlowNode);
export const ActionFlowNode = memo(BaseFlowNode);
export const IntegrationNode = memo(BaseFlowNode);
export const DataNode = memo(BaseFlowNode);
export const LogicNode = memo(BaseFlowNode);

export const customNodeTypes = {
    trigger: TriggerNode,
    condition: ConditionFlowNode,
    action: ActionFlowNode,
    integration: IntegrationNode,
    data: DataNode,
    logic: LogicNode,
};

/* ===================================================
   Node Templates (for palette)
   =================================================== */

export interface NodeTemplate {
    nodeType: string;
    category: string;
    label: string;
    description: string;
    defaultConfig: Record<string, any>;
}

export const nodeTemplates: NodeTemplate[] = [
    // Triggers
    { nodeType: "new_message", category: "trigger", label: "Nova Mensagem", description: "Dispara quando uma nova mensagem chega", defaultConfig: {} },
    { nodeType: "schedule", category: "trigger", label: "Agendamento", description: "Dispara em horários programados", defaultConfig: { cron: "0 9 * * *" } },
    { nodeType: "webhook_trigger", category: "trigger", label: "Webhook", description: "Dispara ao receber webhook externo", defaultConfig: { path: "/webhook" } },
    { nodeType: "integration_event", category: "trigger", label: "Evento de Integração", description: "Dispara por evento de ERP/CRM", defaultConfig: { source: "bling" } },

    // Conditions
    { nodeType: "keyword", category: "condition", label: "Palavra-chave", description: "Verifica palavras na mensagem", defaultConfig: { keywords: [] } },
    { nodeType: "sentiment", category: "condition", label: "Sentimento", description: "Analisa sentimento da mensagem", defaultConfig: { sentiment: "negative" } },
    { nodeType: "time_check", category: "condition", label: "Horário", description: "Verifica horário atual", defaultConfig: { start: "08:00", end: "18:00" } },
    { nodeType: "blocklist", category: "condition", label: "BlockList", description: "Verifica se está na blocklist", defaultConfig: { list_id: "" } },
    { nodeType: "vip_check", category: "condition", label: "Cliente VIP", description: "Verifica tag VIP do contato", defaultConfig: { tags: ["vip"] } },
    { nodeType: "channel_check", category: "condition", label: "Canal", description: "Verifica canal de entrada", defaultConfig: { channel: "whatsapp" } },

    // Actions
    { nodeType: "auto_response", category: "action", label: "Resposta Automática", description: "Envia mensagem automática", defaultConfig: { message: "" } },
    { nodeType: "transfer", category: "action", label: "Transferir", description: "Transfere para agente/fila", defaultConfig: { queue: "" } },
    { nodeType: "block", category: "action", label: "Bloquear", description: "Bloqueia a conversa", defaultConfig: { message: "Bloqueado" } },
    { nodeType: "add_tag", category: "action", label: "Adicionar Tag", description: "Adiciona tag à conversa", defaultConfig: { tag: "" } },
    { nodeType: "notify", category: "action", label: "Notificar", description: "Notifica equipe", defaultConfig: { channel: "system" } },
    { nodeType: "prioritize", category: "action", label: "Priorizar", description: "Marca como alta prioridade", defaultConfig: {} },

    // Integrations
    { nodeType: "erp_query", category: "integration", label: "Consultar ERP", description: "Busca dados no Bling/Tiny", defaultConfig: { erp: "bling", endpoint: "" } },
    { nodeType: "http_request", category: "integration", label: "HTTP Request", description: "Requisição HTTP externa", defaultConfig: { method: "GET", url: "" } },

    // Data
    { nodeType: "search_docs", category: "data", label: "Buscar Documento", description: "Busca na base de documentos", defaultConfig: { query: "" } },
    { nodeType: "search_knowledge", category: "data", label: "Base de Conhecimento", description: "Busca semântica no KB", defaultConfig: { query: "" } },
    { nodeType: "save_variable", category: "data", label: "Salvar Variável", description: "Salva valor para uso posterior", defaultConfig: { name: "", value: "" } },

    // Logic
    { nodeType: "if_else", category: "logic", label: "IF / ELSE", description: "Ramificação condicional", defaultConfig: { expression: "" } },
    { nodeType: "switch_node", category: "logic", label: "Switch", description: "Múltiplas ramificações", defaultConfig: { cases: [] } },
    { nodeType: "delay", category: "logic", label: "Delay", description: "Aguarda antes de prosseguir", defaultConfig: { seconds: 5 } },
    { nodeType: "loop", category: "logic", label: "Loop", description: "Repete ação N vezes", defaultConfig: { count: 3 } },
    { nodeType: "merge", category: "logic", label: "Merge", description: "Combina múltiplas entradas", defaultConfig: {} },
];

export const categoryLabels: Record<string, string> = {
    trigger: "Gatilhos",
    condition: "Condições",
    action: "Ações",
    integration: "Integrações",
    data: "Dados",
    logic: "Lógica",
};

export const categoryColors: Record<string, string> = {
    trigger: "text-blue-600 bg-blue-100",
    condition: "text-emerald-600 bg-emerald-100",
    action: "text-amber-600 bg-amber-100",
    integration: "text-purple-600 bg-purple-100",
    data: "text-rose-600 bg-rose-100",
    logic: "text-slate-600 bg-slate-100",
};
