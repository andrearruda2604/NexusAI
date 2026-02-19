"use client";

import { X } from "lucide-react";
import { nodeTemplates } from "./FlowNodes";

interface FlowPropertiesPanelProps {
    node: any | null;
    onClose: () => void;
    onUpdate: (nodeId: string, data: Record<string, any>) => void;
}

export default function FlowPropertiesPanel({ node, onClose, onUpdate }: FlowPropertiesPanelProps) {
    if (!node) return null;

    const { data } = node;
    const template = nodeTemplates.find((t) => t.nodeType === data.nodeType);

    const handleConfigChange = (key: string, value: any) => {
        const newConfig = { ...data.config, [key]: value };
        onUpdate(node.id, { ...data, config: newConfig });
    };

    const handleLabelChange = (label: string) => {
        onUpdate(node.id, { ...data, label });
    };

    const handleDescChange = (description: string) => {
        onUpdate(node.id, { ...data, description });
    };

    const renderConfigFields = () => {
        const nodeType = data.nodeType;

        switch (nodeType) {
            case "keyword":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Palavras-chave</label>
                        <input
                            type="text"
                            value={data.config?.keywords?.join(", ") || ""}
                            onChange={(e) => handleConfigChange("keywords", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            placeholder="urgente, reclamação, cancelar"
                        />
                    </div>
                );

            case "sentiment":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Sentimento</label>
                        <select
                            value={data.config?.sentiment || "negative"}
                            onChange={(e) => handleConfigChange("sentiment", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                        >
                            <option value="positive">Positivo</option>
                            <option value="neutral">Neutro</option>
                            <option value="negative">Negativo</option>
                        </select>
                    </div>
                );

            case "time_check":
                return (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Início</label>
                            <input
                                type="time"
                                value={data.config?.start || "08:00"}
                                onChange={(e) => handleConfigChange("start", e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Fim</label>
                            <input
                                type="time"
                                value={data.config?.end || "18:00"}
                                onChange={(e) => handleConfigChange("end", e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            />
                        </div>
                    </div>
                );

            case "blocklist":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">ID da BlockList</label>
                        <input
                            type="text"
                            value={data.config?.list_id || ""}
                            onChange={(e) => handleConfigChange("list_id", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            placeholder="spam_blocklist"
                        />
                    </div>
                );

            case "channel_check":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Canal</label>
                        <select
                            value={data.config?.channel || "whatsapp"}
                            onChange={(e) => handleConfigChange("channel", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                        >
                            <option value="whatsapp">WhatsApp</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="webchat">Webchat</option>
                        </select>
                    </div>
                );

            case "auto_response":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Mensagem</label>
                        <textarea
                            value={data.config?.message || ""}
                            onChange={(e) => handleConfigChange("message", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 min-h-[80px] resize-none"
                            placeholder="Olá! Como posso ajudá-lo?"
                        />
                    </div>
                );

            case "transfer":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Transferir para</label>
                        <input
                            type="text"
                            value={data.config?.queue || ""}
                            onChange={(e) => handleConfigChange("queue", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            placeholder="suporte, vendas"
                        />
                    </div>
                );

            case "block":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Mensagem de bloqueio</label>
                        <input
                            type="text"
                            value={data.config?.message || ""}
                            onChange={(e) => handleConfigChange("message", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            placeholder="Número bloqueado"
                        />
                    </div>
                );

            case "add_tag":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Tag</label>
                        <input
                            type="text"
                            value={data.config?.tag || ""}
                            onChange={(e) => handleConfigChange("tag", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            placeholder="urgente"
                        />
                    </div>
                );

            case "erp_query":
                return (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">ERP</label>
                            <select
                                value={data.config?.erp || "bling"}
                                onChange={(e) => handleConfigChange("erp", e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            >
                                <option value="bling">Bling ERP</option>
                                <option value="tiny">Tiny ERP</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Endpoint</label>
                            <input
                                type="text"
                                value={data.config?.endpoint || ""}
                                onChange={(e) => handleConfigChange("endpoint", e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                placeholder="/produtos, /pedidos"
                            />
                        </div>
                    </>
                );

            case "http_request":
                return (
                    <>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Método</label>
                                <select
                                    value={data.config?.method || "GET"}
                                    onChange={(e) => handleConfigChange("method", e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                >
                                    <option>GET</option>
                                    <option>POST</option>
                                    <option>PUT</option>
                                    <option>DELETE</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-600 mb-1">URL</label>
                                <input
                                    type="text"
                                    value={data.config?.url || ""}
                                    onChange={(e) => handleConfigChange("url", e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                    placeholder="https://api.example.com"
                                />
                            </div>
                        </div>
                    </>
                );

            case "search_docs":
            case "search_knowledge":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Consulta</label>
                        <input
                            type="text"
                            value={data.config?.query || ""}
                            onChange={(e) => handleConfigChange("query", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            placeholder="Buscar por..."
                        />
                    </div>
                );

            case "save_variable":
                return (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
                            <input
                                type="text"
                                value={data.config?.name || ""}
                                onChange={(e) => handleConfigChange("name", e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                placeholder="minha_variavel"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Valor</label>
                            <input
                                type="text"
                                value={data.config?.value || ""}
                                onChange={(e) => handleConfigChange("value", e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                placeholder="{{resultado}}"
                            />
                        </div>
                    </>
                );

            case "if_else":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Expressão</label>
                        <input
                            type="text"
                            value={data.config?.expression || ""}
                            onChange={(e) => handleConfigChange("expression", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            placeholder='{{sentimento}} == "negativo"'
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Saída SIM (verde) ou NÃO (vermelho)</p>
                    </div>
                );

            case "delay":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Aguardar (segundos)</label>
                        <input
                            type="number"
                            value={data.config?.seconds || 5}
                            onChange={(e) => handleConfigChange("seconds", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            min={1}
                        />
                    </div>
                );

            case "schedule":
                return (
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Expressão Cron</label>
                        <input
                            type="text"
                            value={data.config?.cron || ""}
                            onChange={(e) => handleConfigChange("cron", e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                            placeholder="0 9 * * * (todo dia às 9h)"
                        />
                    </div>
                );

            default:
                return (
                    <p className="text-xs text-slate-400 italic">Nenhuma configuração adicional.</p>
                );
        }
    };

    return (
        <div className="w-[280px] bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Propriedades</h3>
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Label */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nome do Nó</label>
                    <input
                        type="text"
                        value={data.label || ""}
                        onChange={(e) => handleLabelChange(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
                    <textarea
                        value={data.description || ""}
                        onChange={(e) => handleDescChange(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 min-h-[50px] resize-none"
                    />
                </div>

                {/* Category badge */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded font-medium">
                        {template?.label || data.nodeType}
                    </span>
                </div>

                {/* Separator */}
                <hr className="border-slate-100" />

                {/* Config fields */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Configuração</label>
                    <div className="space-y-3">
                        {renderConfigFields()}
                    </div>
                </div>
            </div>
        </div>
    );
}
