"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import {
    ConditionNode,
    ActionNode,
    ConnectionLine,
    RuleModal,
} from "@/components/rules";
import {
    Plus,
    Search,
    MessageSquare,
    Loader2,
    List,
    GitBranch,
    ToggleLeft,
    ToggleRight,
    Pencil,
    Trash2,
    Filter,
    Ban,
    UserCheck,
    ArrowRightLeft,
    Tag,
    Bell,
    Clock,
    Zap,
    AlertTriangle,
    Workflow,
    Play,
    Pause,
    ExternalLink,
} from "lucide-react";
import { api } from "@/services/api";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

interface Rule {
    id: string;
    name: string;
    description?: string;
    condition_type: string;
    condition_config: any;
    action_type: string;
    action_config: any;
    priority: number;
    is_active: boolean;
    created_at?: string;
}

const conditionLabels: Record<string, string> = {
    blocklist: "BlockList",
    vip: "Cliente VIP",
    keyword: "Palavra-chave",
    time: "Horário",
    sentiment: "Sentimento",
};

const actionLabels: Record<string, string> = {
    block: "Bloquear",
    prioritize: "Priorizar",
    transfer: "Transferir",
    auto_response: "Resposta Auto",
    tag: "Adicionar Tag",
    notify: "Notificar",
};

const actionIcons: Record<string, React.ReactNode> = {
    block: <Ban className="w-4 h-4" />,
    prioritize: <UserCheck className="w-4 h-4" />,
    transfer: <ArrowRightLeft className="w-4 h-4" />,
    auto_response: <MessageSquare className="w-4 h-4" />,
    tag: <Tag className="w-4 h-4" />,
    notify: <Bell className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
    block: "bg-red-100 text-red-700",
    prioritize: "bg-blue-100 text-blue-700",
    transfer: "bg-purple-100 text-purple-700",
    auto_response: "bg-cyan-100 text-cyan-700",
    tag: "bg-green-100 text-green-700",
    notify: "bg-orange-100 text-orange-700",
};

const conditionIcons: Record<string, React.ReactNode> = {
    blocklist: <Ban className="w-4 h-4" />,
    vip: <UserCheck className="w-4 h-4" />,
    keyword: <Filter className="w-4 h-4" />,
    time: <Clock className="w-4 h-4" />,
    sentiment: <Zap className="w-4 h-4" />,
};

interface WorkflowItem {
    id: string;
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export default function MotorDeRegras() {
    const router = useRouter();
    const [rules, setRules] = useState<Rule[]>([]);
    const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"list" | "flow" | "workflows">("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteWfId, setDeleteWfId] = useState<string | null>(null);

    useEffect(() => {
        loadRules();
        loadWorkflows();
    }, []);

    const loadRules = async () => {
        try {
            const data = await api.rules.list(DEMO_ORG_ID);
            setRules(data || []);
        } catch (error) {
            console.error("Error loading rules:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadWorkflows = async () => {
        try {
            const data = await api.workflows.list(DEMO_ORG_ID);
            setWorkflows(data || []);
        } catch (error) {
            console.error("Error loading workflows:", error);
        }
    };

    const handleCreateWorkflow = async () => {
        try {
            const wf = await api.workflows.create({
                organization_id: DEMO_ORG_ID,
                name: "Novo Workflow",
                description: "",
                nodes: [],
                edges: [],
            });
            router.push(`/regras/workflow/${wf.id}`);
        } catch (error) {
            console.error("Error creating workflow:", error);
        }
    };

    const handleToggleWorkflow = async (id: string) => {
        try {
            await api.workflows.toggle(id);
            await loadWorkflows();
        } catch (error) {
            console.error("Error toggling workflow:", error);
        }
    };

    const handleDeleteWorkflow = async () => {
        if (!deleteWfId) return;
        setIsDeleting(true);
        try {
            await api.workflows.delete(deleteWfId);
            setDeleteWfId(null);
            await loadWorkflows();
        } catch (error) {
            console.error("Error deleting workflow:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreateRule = async (ruleData: any) => {
        const payload = {
            ...ruleData,
            organization_id: DEMO_ORG_ID,
        };
        delete payload.id;
        await api.rules.create(payload);
        await loadRules();
    };

    const handleUpdateRule = async (ruleData: any) => {
        const { id, organization_id, created_at, updated_at, ...updateData } = ruleData;
        await api.rules.update(id, updateData);
        await loadRules();
    };

    const handleToggle = async (ruleId: string) => {
        try {
            await api.rules.toggle(ruleId);
            await loadRules();
        } catch (error) {
            console.error("Error toggling rule:", error);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await api.rules.delete(deleteId);
            setDeleteId(null);
            await loadRules();
        } catch (error) {
            console.error("Error deleting rule:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredRules = rules.filter(
        (r) =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conditionLabels[r.condition_type]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            actionLabels[r.action_type]?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getConditionSummary = (rule: Rule) => {
        switch (rule.condition_type) {
            case "blocklist":
                return `Lista: ${rule.condition_config.list_id || "—"}`;
            case "vip":
                return `Tags: ${rule.condition_config.tags?.join(", ") || "—"}`;
            case "keyword":
                return `Palavras: ${rule.condition_config.keywords?.join(", ") || "—"}`;
            case "time":
                return `${rule.condition_config.start || "—"} às ${rule.condition_config.end || "—"}`;
            case "sentiment":
                return `Sentimento: ${rule.condition_config.sentiment || "—"}`;
            default:
                return "—";
        }
    };

    const getActionSummary = (rule: Rule) => {
        switch (rule.action_type) {
            case "block":
                return rule.action_config.message || "Bloqueia a conversa";
            case "prioritize":
                return "Marca como alta prioridade";
            case "transfer":
                return `Transfere para ${rule.action_config.queue || "humano"}`;
            case "auto_response":
                return rule.action_config.message?.slice(0, 60) + (rule.action_config.message?.length > 60 ? "..." : "") || "Envia mensagem automática";
            case "tag":
                return `Tag: ${rule.action_config.tag || "—"}`;
            case "notify":
                return "Notifica equipe";
            default:
                return "—";
        }
    };

    // === Flow view helpers ===
    const renderCondition = (rule: Rule) => {
        let attribute = "Desconhecido";
        let operator = "N/A";
        let value = "";
        let listName = undefined;

        switch (rule.condition_type) {
            case "blocklist":
                attribute = "Telefone";
                operator = "Está na lista";
                listName = rule.condition_config.list_id;
                break;
            case "vip":
                attribute = "Tag";
                operator = "Contém";
                value = rule.condition_config.tags?.join(", ") || "VIP";
                break;
            case "time":
                attribute = "Horário";
                operator = "Entre";
                value = `${rule.condition_config.start} - ${rule.condition_config.end}`;
                break;
            case "keyword":
                attribute = "Mensagem";
                operator = "Contém";
                value = rule.condition_config.keywords?.join(", ");
                break;
            case "sentiment":
                attribute = "Sentimento";
                operator = "É";
                value = rule.condition_config.sentiment || "—";
                break;
        }

        return <ConditionNode title={rule.name} attribute={attribute} operator={operator} value={value} listName={listName} />;
    };

    const renderAction = (rule: Rule) => {
        let title = "Ação";
        let description = "";

        switch (rule.action_type) {
            case "block":
                title = "Bloquear";
                description = rule.action_config.message || "Bloqueia o usuário.";
                break;
            case "prioritize":
                title = "Priorizar";
                description = "Marca como alta prioridade.";
                break;
            case "transfer":
                title = "Transferir";
                description = `Transfere para ${rule.action_config.queue || "humano"}.`;
                break;
            case "auto_response":
                title = "Resposta Auto";
                description = "Envia mensagem automática.";
                break;
            case "tag":
                title = "Adicionar Tag";
                description = `Tag: ${rule.action_config.tag}`;
                break;
            case "notify":
                title = "Notificar";
                description = "Notifica equipe.";
                break;
        }

        return <ActionNode type={rule.action_type as any} title={title} description={description} />;
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar />
            <main className="ml-[260px]">
                <Header title="Motor de Regras" />

                <div className="p-6">
                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Regras de Negócio</h2>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {rules.length} regra{rules.length !== 1 ? "s" : ""} configurada{rules.length !== 1 ? "s" : ""}
                                {" · "}
                                {rules.filter((r) => r.is_active).length} ativa{rules.filter((r) => r.is_active).length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* View toggle */}
                            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                    Regras
                                </button>
                                <button
                                    onClick={() => setViewMode("flow")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "flow" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    <GitBranch className="w-4 h-4" />
                                    Fluxo
                                </button>
                                <button
                                    onClick={() => setViewMode("workflows")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "workflows" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    <Workflow className="w-4 h-4" />
                                    Workflows
                                </button>
                            </div>

                            {viewMode === "workflows" ? (
                                <button
                                    onClick={handleCreateWorkflow}
                                    className="btn btn-primary"
                                >
                                    <Plus className="w-4 h-4" />
                                    Novo Workflow
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setEditingRule(null);
                                        setModalOpen(true);
                                    }}
                                    className="btn btn-primary"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nova Regra
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-md mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar regras..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10"
                        />
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex justify-center items-center h-60">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : viewMode === "workflows" ? (
                        /* ===== WORKFLOWS VIEW ===== */
                        <div>
                            {workflows.length === 0 ? (
                                <div className="card">
                                    <div className="card-body flex flex-col items-center justify-center py-16">
                                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                            <Workflow className="w-8 h-8 text-purple-500" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhum workflow criado</h3>
                                        <p className="text-sm text-slate-500 mb-4">Crie workflows visuais para automações complexas estilo n8n.</p>
                                        <button onClick={handleCreateWorkflow} className="btn btn-primary">
                                            <Plus className="w-4 h-4" />
                                            Criar primeiro workflow
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {workflows.map((wf) => (
                                        <div key={wf.id} className={`card transition-all hover:shadow-md cursor-pointer ${!wf.is_active ? "opacity-60" : ""}`}>
                                            <div className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1 min-w-0" onClick={() => router.push(`/regras/workflow/${wf.id}`)}>
                                                        <h3 className="font-semibold text-slate-900 truncate mb-1">{wf.name}</h3>
                                                        {wf.description && (
                                                            <p className="text-xs text-slate-500 line-clamp-2">{wf.description}</p>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${wf.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                        {wf.is_active ? "Ativo" : "Inativo"}
                                                    </span>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center gap-3 mb-4 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Workflow className="w-3.5 h-3.5" />
                                                        {wf.nodes?.length || 0} nós
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <GitBranch className="w-3.5 h-3.5" />
                                                        {wf.edges?.length || 0} conexões
                                                    </span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 border-t border-slate-100 pt-3">
                                                    <button
                                                        onClick={() => router.push(`/regras/workflow/${wf.id}`)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleWorkflow(wf.id)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${wf.is_active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                                                    >
                                                        {wf.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                        {wf.is_active ? "Desativar" : "Ativar"}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteWfId(wf.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : filteredRules.length === 0 ? (
                        <div className="card">
                            <div className="card-body flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Filter className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                                    {searchQuery ? "Nenhuma regra encontrada" : "Nenhuma regra configurada"}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    {searchQuery
                                        ? "Tente buscar por outro termo."
                                        : "Crie sua primeira regra para automatizar o atendimento."}
                                </p>
                                {!searchQuery && (
                                    <button
                                        onClick={() => {
                                            setEditingRule(null);
                                            setModalOpen(true);
                                        }}
                                        className="btn btn-primary"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Criar primeira regra
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : viewMode === "list" ? (
                        /* ===== LIST VIEW ===== */
                        <div className="space-y-3">
                            {filteredRules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className={`card transition-all hover:shadow-md ${!rule.is_active ? "opacity-60" : ""}`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                {/* Name + Priority */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-slate-900 truncate">{rule.name}</h3>
                                                    <span className="badge badge-neutral text-xs flex-shrink-0">
                                                        Prioridade {rule.priority}
                                                    </span>
                                                    {!rule.is_active && (
                                                        <span className="badge bg-slate-200 text-slate-600 text-xs flex-shrink-0">
                                                            Inativa
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Condition → Action */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Condition chip */}
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
                                                        {conditionIcons[rule.condition_type]}
                                                        <span className="font-medium">{conditionLabels[rule.condition_type] || rule.condition_type}</span>
                                                        <span className="text-slate-400 mx-0.5">·</span>
                                                        <span className="text-slate-500">{getConditionSummary(rule)}</span>
                                                    </div>

                                                    <span className="text-slate-300">→</span>

                                                    {/* Action chip */}
                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${actionColors[rule.action_type] || "bg-slate-100 text-slate-600"}`}>
                                                        {actionIcons[rule.action_type]}
                                                        <span>{actionLabels[rule.action_type] || rule.action_type}</span>
                                                        <span className="font-normal opacity-75 ml-0.5">{getActionSummary(rule)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                                                {/* Toggle */}
                                                <button
                                                    onClick={() => handleToggle(rule.id)}
                                                    className={`p-2 rounded-lg transition-colors ${rule.is_active ? "text-green-500 hover:bg-green-50" : "text-slate-400 hover:bg-slate-100"
                                                        }`}
                                                    title={rule.is_active ? "Desativar" : "Ativar"}
                                                >
                                                    {rule.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => {
                                                        setEditingRule(rule);
                                                        setModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => setDeleteId(rule.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* ===== FLOW VIEW ===== */
                        <div className="card">
                            <div className="card-body p-8 overflow-auto">
                                {/* Trigger Node */}
                                <div className="flex flex-col items-center mb-12">
                                    <div className="px-6 py-4 bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <MessageSquare className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-medium text-slate-700">GATILHO: NOVO CHAT RECEBIDO</span>
                                    </div>
                                    <ConnectionLine direction="vertical" />
                                </div>

                                {/* Rules flow */}
                                <div className="flex flex-col items-center gap-8">
                                    {filteredRules.map((rule, idx) => (
                                        <div key={rule.id} className="flex flex-col items-center w-full">
                                            <div className="flex items-center justify-center gap-6 relative">
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-400 uppercase tracking-wider bg-white px-2 z-10">
                                                    {rule.name}
                                                    {!rule.is_active && (
                                                        <span className="ml-2 text-red-400">(Inativa)</span>
                                                    )}
                                                </div>
                                                {renderCondition(rule)}
                                                <ConnectionLine />
                                                {renderAction(rule)}
                                            </div>
                                            {idx < filteredRules.length - 1 && (
                                                <div className="h-12 border-l-2 border-dashed border-slate-300 my-2"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Add button */}
                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={() => {
                                            setEditingRule(null);
                                            setModalOpen(true);
                                        }}
                                        className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                <RuleModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setEditingRule(null);
                    }}
                    onSave={editingRule ? handleUpdateRule : handleCreateRule}
                    editRule={editingRule}
                />

                {/* Delete Confirmation Modal */}
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Excluir regra</h3>
                                    <p className="text-sm text-slate-500">
                                        Tem certeza que deseja excluir esta regra? Esta ação não pode ser desfeita.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeleteId(null)} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    {isDeleting ? "Excluindo..." : "Excluir"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Workflow Confirmation */}
                {deleteWfId && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Excluir workflow</h3>
                                    <p className="text-sm text-slate-500">
                                        Tem certeza que deseja excluir este workflow? Esta ação não pode ser desfeita.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeleteWfId(null)} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteWorkflow}
                                    disabled={isDeleting}
                                    className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    {isDeleting ? "Excluindo..." : "Excluir"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
