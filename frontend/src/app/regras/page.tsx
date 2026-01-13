"use client";

import { useState } from "react";
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
} from "lucide-react";

export default function MotorDeRegras() {
    const [propertiesOpen, setPropertiesOpen] = useState(true);

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

                            <div className="flex items-center gap-3">
                                <button className="text-sm text-slate-600 hover:text-slate-900">
                                    Todas as Regras
                                </button>
                                <button className="text-sm text-slate-600 hover:text-slate-900">
                                    Modelos
                                </button>
                                <button className="text-sm text-slate-600 hover:text-slate-900">
                                    Histórico
                                </button>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className="badge badge-neutral">RASCUNHO</span>
                                    <span className="badge badge-primary">ATIVO</span>
                                </div>
                                <button className="btn btn-secondary ml-4">Descartar</button>
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
                        <div className="flex flex-col items-center mb-8">
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

                        {/* Blacklist Rule */}
                        <div className="mb-12">
                            <p className="text-center text-xs text-slate-400 uppercase tracking-wider mb-4">
                                Regra de Blacklist
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <ConditionNode
                                    title="Blacklist Check"
                                    attribute="Número de Telefone"
                                    operator="Está na lista"
                                    value=""
                                    listName="Spam_Blacklist_v1"
                                />
                                <ConnectionLine />
                                <ActionNode
                                    type="block"
                                    title="Bloquear / Encerrar"
                                    description="Finaliza a sessão imediatamente para números na lista negra."
                                />
                            </div>
                        </div>

                        {/* Add Node Button */}
                        <div className="flex justify-center mb-12">
                            <button className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* VIP Priority Rule */}
                        <div className="mb-8">
                            <p className="text-center text-xs text-slate-400 uppercase tracking-wider mb-4">
                                Prioridade VIP
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <ConditionNode
                                    title="VIP Check"
                                    attribute="Tag do Cliente"
                                    operator="É igual a"
                                    value="VIP"
                                />
                                <ConnectionLine />
                                <ActionNode
                                    type="transfer"
                                    title="Transf. para Humano"
                                    description="Encaminha para a fila de suporte executivo."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-white border-t border-slate-200 px-6 py-3">
                        <button className="btn btn-primary w-full">
                            <Plus className="w-4 h-4" />
                            Nova Regra
                        </button>
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
