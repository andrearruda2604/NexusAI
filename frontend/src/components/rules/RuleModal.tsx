"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, AlertTriangle } from "lucide-react";

interface Rule {
    id?: string;
    organization_id?: string;
    name: string;
    description?: string;
    condition_type: string;
    condition_config: any;
    action_type: string;
    action_config: any;
    priority: number;
    is_active: boolean;
}

interface RuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (rule: any) => Promise<void>;
    editRule?: Rule | null;
}

const conditionTypes = [
    { id: "blocklist", label: "BlockList", description: "Verifica se o número está em uma lista de bloqueio" },
    { id: "vip", label: "Cliente VIP", description: "Verifica se o contato possui tag VIP" },
    { id: "keyword", label: "Palavra-chave", description: "Detecta palavras-chave na mensagem" },
    { id: "time", label: "Horário", description: "Verifica o horário da mensagem" },
    { id: "sentiment", label: "Sentimento", description: "Analisa o sentimento da mensagem" },
];

const actionTypes = [
    { id: "block", label: "Bloquear", description: "Bloqueia a conversa", color: "red" },
    { id: "prioritize", label: "Priorizar", description: "Marca como alta prioridade", color: "blue" },
    { id: "transfer", label: "Transferir", description: "Transfere para agente humano", color: "purple" },
    { id: "auto_response", label: "Resposta Automática", description: "Envia mensagem automática", color: "cyan" },
    { id: "tag", label: "Adicionar Tag", description: "Adiciona tag à conversa", color: "green" },
    { id: "notify", label: "Notificar", description: "Envia notificação para equipe", color: "orange" },
];

const emptyRule: Rule = {
    name: "",
    description: "",
    condition_type: "keyword",
    condition_config: {},
    action_type: "auto_response",
    action_config: {},
    priority: 0,
    is_active: true,
};

export default function RuleModal({ isOpen, onClose, onSave, editRule }: RuleModalProps) {
    const [rule, setRule] = useState<Rule>(emptyRule);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (editRule) {
            setRule(editRule);
        } else {
            setRule(emptyRule);
        }
        setError("");
    }, [editRule, isOpen]);

    const handleSave = async () => {
        if (!rule.name.trim()) {
            setError("Nome da regra é obrigatório");
            return;
        }
        setIsSaving(true);
        setError("");
        try {
            await onSave(rule);
            onClose();
        } catch (err: any) {
            setError(err.message || "Erro ao salvar regra");
        } finally {
            setIsSaving(false);
        }
    };

    const updateConditionConfig = (key: string, value: any) => {
        setRule((prev) => ({
            ...prev,
            condition_config: { ...prev.condition_config, [key]: value },
        }));
    };

    const updateActionConfig = (key: string, value: any) => {
        setRule((prev) => ({
            ...prev,
            action_config: { ...prev.action_config, [key]: value },
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {editRule ? "Editar Regra" : "Nova Regra"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Informações Básicas</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da Regra *</label>
                            <input
                                type="text"
                                value={rule.name}
                                onChange={(e) => setRule({ ...rule, name: e.target.value })}
                                className="input w-full"
                                placeholder="Ex: Bloqueio de Spam"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                            <textarea
                                value={rule.description || ""}
                                onChange={(e) => setRule({ ...rule, description: e.target.value })}
                                className="input w-full min-h-[80px] resize-none"
                                placeholder="Descreva o objetivo desta regra..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Prioridade</label>
                            <input
                                type="number"
                                value={rule.priority}
                                onChange={(e) => setRule({ ...rule, priority: parseInt(e.target.value) || 0 })}
                                className="input w-32"
                                min={0}
                                max={100}
                            />
                            <p className="text-xs text-slate-400 mt-1">Regras com maior prioridade são avaliadas primeiro (0-100).</p>
                        </div>
                    </div>

                    {/* Condition */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Condição (SE...)</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Condição</label>
                            <select
                                value={rule.condition_type}
                                onChange={(e) => setRule({ ...rule, condition_type: e.target.value, condition_config: {} })}
                                className="input w-full"
                            >
                                {conditionTypes.map((ct) => (
                                    <option key={ct.id} value={ct.id}>{ct.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">
                                {conditionTypes.find((ct) => ct.id === rule.condition_type)?.description}
                            </p>
                        </div>

                        {/* Dynamic condition config */}
                        {rule.condition_type === "keyword" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Palavras-chave</label>
                                <input
                                    type="text"
                                    value={rule.condition_config.keywords?.join(", ") || ""}
                                    onChange={(e) => updateConditionConfig("keywords", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                                    className="input w-full"
                                    placeholder="urgente, reclamação, cancelar (separadas por vírgula)"
                                />
                            </div>
                        )}

                        {rule.condition_type === "time" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Início</label>
                                    <input
                                        type="time"
                                        value={rule.condition_config.start || "18:00"}
                                        onChange={(e) => updateConditionConfig("start", e.target.value)}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fim</label>
                                    <input
                                        type="time"
                                        value={rule.condition_config.end || "08:00"}
                                        onChange={(e) => updateConditionConfig("end", e.target.value)}
                                        className="input w-full"
                                    />
                                </div>
                            </div>
                        )}

                        {rule.condition_type === "blocklist" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">ID da BlockList</label>
                                <input
                                    type="text"
                                    value={rule.condition_config.list_id || ""}
                                    onChange={(e) => updateConditionConfig("list_id", e.target.value)}
                                    className="input w-full"
                                    placeholder="Ex: spam_blocklist"
                                />
                            </div>
                        )}

                        {rule.condition_type === "vip" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags VIP</label>
                                <input
                                    type="text"
                                    value={rule.condition_config.tags?.join(", ") || ""}
                                    onChange={(e) => updateConditionConfig("tags", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                                    className="input w-full"
                                    placeholder="vip, premium (separadas por vírgula)"
                                />
                            </div>
                        )}

                        {rule.condition_type === "sentiment" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sentimento</label>
                                <select
                                    value={rule.condition_config.sentiment || "negative"}
                                    onChange={(e) => updateConditionConfig("sentiment", e.target.value)}
                                    className="input w-full"
                                >
                                    <option value="positive">Positivo</option>
                                    <option value="neutral">Neutro</option>
                                    <option value="negative">Negativo</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Action */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Ação (ENTÃO...)</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Ação</label>
                            <select
                                value={rule.action_type}
                                onChange={(e) => setRule({ ...rule, action_type: e.target.value, action_config: {} })}
                                className="input w-full"
                            >
                                {actionTypes.map((at) => (
                                    <option key={at.id} value={at.id}>{at.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">
                                {actionTypes.find((at) => at.id === rule.action_type)?.description}
                            </p>
                        </div>

                        {/* Dynamic action config */}
                        {rule.action_type === "block" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mensagem de bloqueio</label>
                                <input
                                    type="text"
                                    value={rule.action_config.message || ""}
                                    onChange={(e) => updateActionConfig("message", e.target.value)}
                                    className="input w-full"
                                    placeholder="Ex: Número bloqueado por spam"
                                />
                            </div>
                        )}

                        {rule.action_type === "transfer" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Transferir para</label>
                                <input
                                    type="text"
                                    value={rule.action_config.queue || ""}
                                    onChange={(e) => updateActionConfig("queue", e.target.value)}
                                    className="input w-full"
                                    placeholder="Ex: suporte, vendas, humano"
                                />
                            </div>
                        )}

                        {rule.action_type === "auto_response" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mensagem automática</label>
                                <textarea
                                    value={rule.action_config.message || ""}
                                    onChange={(e) => updateActionConfig("message", e.target.value)}
                                    className="input w-full min-h-[100px] resize-none"
                                    placeholder="Ex: Olá! No momento estamos fora do horário de atendimento..."
                                />
                            </div>
                        )}

                        {rule.action_type === "tag" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da Tag</label>
                                <input
                                    type="text"
                                    value={rule.action_config.tag || ""}
                                    onChange={(e) => updateActionConfig("tag", e.target.value)}
                                    className="input w-full"
                                    placeholder="Ex: urgente, reclamação"
                                />
                            </div>
                        )}

                        {rule.action_type === "prioritize" && (
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="notify_agents"
                                    checked={rule.action_config.notify_agents || false}
                                    onChange={(e) => updateActionConfig("notify_agents", e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="notify_agents" className="text-sm text-slate-700">Notificar agentes sobre a priorização</label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 sticky bottom-0 bg-white rounded-b-2xl">
                    <button onClick={onClose} className="btn btn-secondary">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex items-center gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? "Salvando..." : editRule ? "Salvar Alterações" : "Criar Regra"}
                    </button>
                </div>
            </div>
        </div>
    );
}
