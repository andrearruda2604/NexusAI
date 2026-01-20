"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout";
import {
    ConditionNode,
    ActionNode,
    ConnectionLine,
    PropertiesPanel,
} from "@/components/rules";
import {
    Plus,
    ZoomIn,
    ZoomOut,
    Maximize,
    Wand2,
    Search,
    MessageSquare,
    Loader2,
} from "lucide-react";
import { api } from "@/services/api";

// Demo Organization ID (same as Chat)
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

interface Rule {
    id: string;
    name: string;
    condition_type: string;
    condition_config: any;
    action_type: string;
    action_config: any;
}

export default function MotorDeRegras() {
    const [propertiesOpen, setPropertiesOpen] = useState(true);
    const [rules, setRules] = useState<Rule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadRules();
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

    const renderCondition = (rule: Rule) => {
        let attribute = "Desconhecido";
        let operator = "N/A";
        let value = "";
        let listName = undefined;

        switch (rule.condition_type) {
            case "blacklist":
                attribute = "Telefone";
                operator = "Está na lista";
                listName = rule.condition_config.list_id;
                break;
            case "vip":
                attribute = "Tag";
                operator = "Contém";
                value = "VIP";
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
        }

        return (
            <ConditionNode
                title={rule.name}
                attribute={attribute}
                operator={operator}
                value={value}
                listName={listName}
            />
        );
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
        }

        return (
            <ActionNode
                type={rule.action_type as any}
                title={title}
                description={description}
            />
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            <Sidebar />

            <div className="flex-1 ml-[260px] flex">
                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <header className="bg-white border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                    <span>REGRAS</span>
                                    <span>/</span>
                                    <span className="text-slate-400">EDITOR DE FLUXO</span>
                                </div>
                                <h1 className="text-xl font-semibold text-slate-900">
                                    Encaminhamento de Entrada
                                </h1>
                            </div>
                        </div>
                    </header>

                    {/* Toolbar */}
                    <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <ZoomIn className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <Maximize className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <Wand2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar nós..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>

                        <button className="btn btn-primary">
                            <Plus className="w-4 h-4" />
                            Adicionar Nó
                        </button>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 p-8 overflow-auto">
                        {/* Trigger Node */}
                        <div className="flex flex-col items-center mb-12">
                            <div className="px-6 py-4 bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-medium text-slate-700">
                                    GATILHO: NOVO CHAT RECEBIDO
                                </span>
                            </div>
                            <ConnectionLine direction="vertical" />
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : rules.length === 0 ? (
                            <div className="text-center text-slate-500">
                                Nenhuma regra configurada.
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-8">
                                {rules.map((rule) => (
                                    <div key={rule.id} className="flex flex-col items-center w-full">
                                        <div className="flex items-center justify-center gap-6 relative">
                                            {/* Label da Regra */}
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-400 uppercase tracking-wider bg-[#f8fafc] px-2 z-10">
                                                {rule.name}
                                            </div>

                                            {/* Nodes */}
                                            {renderCondition(rule)}
                                            <ConnectionLine />
                                            {renderAction(rule)}
                                        </div>
                                        {/* Conector vertical para o próximo se houver */}
                                        <div className="h-12 border-l-2 border-dashed border-slate-300 my-2"></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Node Button */}
                        <div className="flex justify-center mt-4">
                            <button className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Properties Panel */}
                <PropertiesPanel
                    isOpen={propertiesOpen}
                    onClose={() => setPropertiesOpen(false)}
                />
            </div>
        </div>
    );
}
