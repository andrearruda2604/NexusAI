"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/layout";
import { api } from "@/services/api";
import {
    FlaskConical,
    Send,
    Trash2,
    Loader2,
    Bot,
    User,
    Clock,
    Shield,
    Zap,
    AlertTriangle,
    CheckCircle2,
    Settings2,
    Workflow,
    Play,
    RotateCcw,
    ChevronRight,
    MessageSquare,
    Phone,
} from "lucide-react";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

interface TestMessage {
    id: string;
    sender: "client" | "ai";
    content: string;
    created_at: string;
}

interface RulesEvaluation {
    action: string;
    rule_name?: string;
    action_config?: Record<string, unknown>;
    context: Record<string, unknown>;
}

interface TestMetadata {
    rules_time_ms: number;
    ai_time_ms: number;
    total_time_ms: number;
}

interface TestResult {
    conversation_id: string;
    client_message: TestMessage;
    ai_response: TestMessage;
    rules_evaluation: RulesEvaluation;
    metadata: TestMetadata;
}

interface WorkflowItem {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    nodes: Array<{ id: string; type: string; data: { label: string; nodeType: string } }>;
    edges: Array<{ id: string; source: string; target: string }>;
}

interface LogEntry {
    step: number;
    nodeId: string;
    nodeLabel: string;
    nodeType: string;
    status: "success" | "skipped" | "waiting";
    message: string;
}

export default function TestesPage() {
    const [activeTab, setActiveTab] = useState<"chat" | "workflow">("chat");

    // === Chat Simulator State ===
    const [messages, setMessages] = useState<TestMessage[]>([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<TestResult | null>(null);
    const [clientPhone, setClientPhone] = useState("+5511999999999");
    const [clientName, setClientName] = useState("Teste Admin");
    const [showSettings, setShowSettings] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // === Workflow Tester State ===
    const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
    const [isLoadingWf, setIsLoadingWf] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [executionLog, setExecutionLog] = useState<LogEntry[]>([]);

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Load workflows on mount
    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            const data = await api.workflows.list(DEMO_ORG_ID);
            setWorkflows(data || []);
        } catch (error) {
            console.error("Error loading workflows:", error);
        } finally {
            setIsLoadingWf(false);
        }
    };

    // === Chat Simulator Handlers ===
    const handleSend = async () => {
        if (!input.trim() || isSending) return;

        const userMsg: TestMessage = {
            id: `temp-${Date.now()}`,
            sender: "client",
            content: input,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        const msg = input;
        setInput("");
        setIsSending(true);

        try {
            const result: TestResult = await api.chat.test({
                organization_id: DEMO_ORG_ID,
                message: msg,
                client_phone: clientPhone,
                client_name: clientName,
                conversation_id: conversationId || undefined,
            });

            if (!conversationId && result.conversation_id) {
                setConversationId(result.conversation_id);
            }

            // Replace temp message with real one and add AI response
            setMessages((prev) => {
                const withoutTemp = prev.filter((m) => m.id !== userMsg.id);
                const newMessages = [...withoutTemp];
                if (result.client_message) newMessages.push(result.client_message);
                if (result.ai_response) newMessages.push(result.ai_response);
                return newMessages;
            });

            setLastResult(result);
        } catch (error) {
            console.error("Error testing message:", error);
            const errorMsg: TestMessage = {
                id: `err-${Date.now()}`,
                sender: "ai",
                content: "❌ Erro ao processar a mensagem. Verifique o backend.",
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsSending(false);
        }
    };

    const handleClearConversation = () => {
        setMessages([]);
        setConversationId(null);
        setLastResult(null);
    };

    // === Workflow Simulator ===
    const simulateWorkflow = async () => {
        if (!selectedWorkflow) return;
        setIsSimulating(true);
        setExecutionLog([]);

        const nodes = selectedWorkflow.nodes || [];
        const edges = selectedWorkflow.edges || [];

        // Find trigger node (entry point)
        const triggerNode = nodes.find(
            (n) => n.data?.nodeType?.includes("trigger") || n.type === "trigger"
        );

        if (!triggerNode) {
            setExecutionLog([
                {
                    step: 1,
                    nodeId: "none",
                    nodeLabel: "Nenhum Trigger",
                    nodeType: "error",
                    status: "skipped",
                    message: "Workflow não possui um nó de trigger (ponto de entrada).",
                },
            ]);
            setIsSimulating(false);
            return;
        }

        // BFS through the graph
        const visited = new Set<string>();
        const queue: string[] = [triggerNode.id];
        let step = 0;
        const log: LogEntry[] = [];

        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);
            step++;

            const node = nodes.find((n) => n.id === currentId);
            if (!node) continue;

            const entry: LogEntry = {
                step,
                nodeId: node.id,
                nodeLabel: node.data?.label || node.type || "Desconhecido",
                nodeType: node.data?.nodeType || node.type || "unknown",
                status: "success",
                message: getNodeSimulationMessage(node.data?.nodeType || node.type || ""),
            };

            log.push(entry);
            setExecutionLog([...log]);

            await delay(600);

            // Find connected nodes
            const nextEdges = edges.filter((e) => e.source === currentId);
            for (const edge of nextEdges) {
                if (!visited.has(edge.target)) {
                    queue.push(edge.target);
                }
            }
        }

        // Check unvisited nodes
        const unvisited = nodes.filter((n) => !visited.has(n.id));
        for (const node of unvisited) {
            step++;
            log.push({
                step,
                nodeId: node.id,
                nodeLabel: node.data?.label || node.type || "Desconhecido",
                nodeType: node.data?.nodeType || node.type || "unknown",
                status: "skipped",
                message: "Nó não conectado ao fluxo principal.",
            });
        }
        setExecutionLog([...log]);
        setIsSimulating(false);
    };

    const getNodeSimulationMessage = (nodeType: string): string => {
        const messages: Record<string, string> = {
            trigger_new_message: "✅ Trigger ativado: nova mensagem recebida.",
            trigger_keyword: "✅ Trigger ativado: palavra-chave detectada.",
            trigger_schedule: "✅ Trigger ativado: execução agendada.",
            trigger_webhook: "✅ Trigger ativado: webhook recebido.",
            condition_vip: "🔍 Verificando se o cliente é VIP...",
            condition_time: "🔍 Verificando horário comercial...",
            condition_sentiment: "🔍 Analisando sentimento da mensagem...",
            condition_keyword_match: "🔍 Verificando correspondência de palavras-chave...",
            action_auto_response: "💬 Gerando resposta automática via IA...",
            action_transfer: "🔄 Transferindo para atendente humano...",
            action_add_tag: "🏷️ Adicionando tag ao contato...",
            action_send_template: "📋 Enviando template de mensagem...",
            action_notify_team: "🔔 Notificando equipe...",
            action_close: "✅ Encerrando conversa...",
            integration_whatsapp: "📱 Conectando via WhatsApp...",
            integration_erp: "🔗 Consultando ERP...",
            integration_webhook: "🌐 Chamando webhook externo...",
            data_search_docs: "📄 Buscando documentos na base de conhecimento...",
            data_erp_query: "🔍 Executando consulta no ERP...",
            data_api_call: "🌐 Chamando API externa...",
            logic_if_else: "🔀 Avaliando condição If/Else...",
            logic_switch: "🔀 Avaliando Switch/Case...",
            logic_delay: "⏳ Aguardando delay...",
            logic_loop: "🔄 Executando loop...",
        };
        return messages[nodeType] || `⚙️ Executando nó: ${nodeType}`;
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-[260px] p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <FlaskConical className="w-7 h-7 text-purple-600" />
                            Sandbox de Testes
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Teste conversas com a IA e simule a execução de workflows
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "chat"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat Simulador
                    </button>
                    <button
                        onClick={() => setActiveTab("workflow")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "workflow"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        <Workflow className="w-4 h-4" />
                        Workflow Tester
                    </button>
                </div>

                {/* === CHAT SIMULATOR === */}
                {activeTab === "chat" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chat Panel */}
                        <div className="lg:col-span-2 card flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Sandbox de Conversa</h3>
                                        <p className="text-xs text-slate-500">
                                            {conversationId
                                                ? `Conversa: ${conversationId.slice(0, 8)}...`
                                                : "Nova conversa será criada ao enviar"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                                        title="Configurações"
                                    >
                                        <Settings2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleClearConversation}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Limpar
                                    </button>
                                </div>
                            </div>

                            {/* Settings Panel */}
                            {showSettings && (
                                <div className="bg-slate-50 rounded-lg p-3 mb-3 grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 block mb-1">
                                            <Phone className="w-3 h-3 inline mr-1" />
                                            Telefone do Cliente
                                        </label>
                                        <input
                                            type="text"
                                            value={clientPhone}
                                            onChange={(e) => setClientPhone(e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 block mb-1">
                                            <User className="w-3 h-3 inline mr-1" />
                                            Nome do Cliente
                                        </label>
                                        <input
                                            type="text"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <FlaskConical className="w-12 h-12 mb-3 opacity-30" />
                                        <p className="text-sm font-medium">Envie uma mensagem para testar</p>
                                        <p className="text-xs mt-1">
                                            A mensagem passará pelo pipeline completo: regras → IA
                                        </p>
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.sender === "client"
                                                ? "bg-purple-600 text-white rounded-br-md"
                                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                {msg.sender === "ai" ? (
                                                    <Bot className="w-3.5 h-3.5 text-purple-500" />
                                                ) : (
                                                    <User className="w-3.5 h-3.5 opacity-70" />
                                                )}
                                                <span className="text-[10px] opacity-60">
                                                    {msg.sender === "ai" ? "Nexus AI" : clientName}
                                                </span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            {msg.created_at && (
                                                <p
                                                    className={`text-[10px] mt-1 ${msg.sender === "client"
                                                        ? "text-purple-200"
                                                        : "text-slate-400"
                                                        }`}
                                                >
                                                    {formatTime(msg.created_at)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isSending && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                                Processando pipeline...
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="flex items-center gap-2 pt-3 border-t border-slate-200 mt-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                    placeholder="Digite uma mensagem para testar..."
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                    disabled={isSending}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isSending || !input.trim()}
                                    className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Metadata Panel */}
                        <div className="space-y-4">
                            {/* Rules Evaluation */}
                            <div className="card">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4 text-amber-500" />
                                    Avaliação de Regras
                                </h3>
                                {lastResult ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            {lastResult.rules_evaluation.action === "continue" ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            )}
                                            <span className="text-sm font-medium text-slate-700">
                                                Ação: {lastResult.rules_evaluation.action}
                                            </span>
                                        </div>
                                        {lastResult.rules_evaluation.rule_name && (
                                            <p className="text-xs text-slate-500 bg-amber-50 rounded-lg px-3 py-2">
                                                🔔 Regra disparada:{" "}
                                                <strong>{lastResult.rules_evaluation.rule_name}</strong>
                                            </p>
                                        )}
                                        {Object.keys(lastResult.rules_evaluation.context).length > 0 && (
                                            <pre className="text-xs bg-slate-50 rounded-lg p-2 overflow-auto max-h-32 text-slate-600">
                                                {JSON.stringify(lastResult.rules_evaluation.context, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">
                                        Envie uma mensagem para ver a avaliação de regras.
                                    </p>
                                )}
                            </div>

                            {/* Performance */}
                            <div className="card">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    Performance
                                </h3>
                                {lastResult?.metadata ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Regras</span>
                                            <span className="font-mono text-slate-700">
                                                {lastResult.metadata.rules_time_ms}ms
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">IA (Gemini)</span>
                                            <span className="font-mono text-slate-700">
                                                {lastResult.metadata.ai_time_ms}ms
                                            </span>
                                        </div>
                                        <div className="h-px bg-slate-200 my-1" />
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-slate-700">Total</span>
                                            <span
                                                className={`font-mono ${lastResult.metadata.total_time_ms > 5000
                                                    ? "text-red-500"
                                                    : lastResult.metadata.total_time_ms > 2000
                                                        ? "text-amber-500"
                                                        : "text-green-500"
                                                    }`}
                                            >
                                                {lastResult.metadata.total_time_ms}ms
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">
                                        Métricas de tempo aparecerão aqui.
                                    </p>
                                )}
                            </div>

                            {/* Session Info */}
                            <div className="card">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                                    <Zap className="w-4 h-4 text-purple-500" />
                                    Sessão
                                </h3>
                                <div className="space-y-1.5 text-xs text-slate-500">
                                    <div className="flex justify-between">
                                        <span>Mensagens</span>
                                        <span className="font-medium text-slate-700">{messages.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Canal</span>
                                        <span className="font-medium text-slate-700">Sandbox</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Telefone</span>
                                        <span className="font-medium text-slate-700">{clientPhone}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === WORKFLOW TESTER === */}
                {activeTab === "workflow" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Workflow Selection */}
                        <div className="card">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
                                <Workflow className="w-4 h-4 text-indigo-500" />
                                Selecionar Workflow
                            </h3>

                            {isLoadingWf ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                </div>
                            ) : workflows.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <Workflow className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Nenhum workflow encontrado.</p>
                                    <p className="text-xs mt-1">Crie um no Motor de Regras.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {workflows.map((wf) => (
                                        <button
                                            key={wf.id}
                                            onClick={() => {
                                                setSelectedWorkflow(wf);
                                                setExecutionLog([]);
                                            }}
                                            className={`w-full text-left p-3 rounded-xl border transition-all ${selectedWorkflow?.id === wf.id
                                                ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-200"
                                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-800">
                                                    {wf.name}
                                                </span>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full ${wf.is_active
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-slate-100 text-slate-500"
                                                        }`}
                                                >
                                                    {wf.is_active ? "Ativo" : "Inativo"}
                                                </span>
                                            </div>
                                            {wf.description && (
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                    {wf.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                                                <span>{(wf.nodes || []).length} nós</span>
                                                <span>{(wf.edges || []).length} conexões</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedWorkflow && (
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={simulateWorkflow}
                                        disabled={isSimulating}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isSimulating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Play className="w-4 h-4" />
                                        )}
                                        {isSimulating ? "Simulando..." : "Simular Execução"}
                                    </button>
                                    <button
                                        onClick={() => setExecutionLog([])}
                                        className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
                                        title="Limpar log"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Execution Log */}
                        <div className="lg:col-span-2 card" style={{ height: "calc(100vh - 220px)" }}>
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
                                <Zap className="w-4 h-4 text-amber-500" />
                                Log de Execução
                            </h3>

                            {executionLog.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[calc(100%-40px)] text-slate-400">
                                    <Play className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm font-medium">
                                        {selectedWorkflow
                                            ? 'Clique em "Simular Execução" para iniciar'
                                            : "Selecione um workflow para testar"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-0 overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
                                    {executionLog.map((entry, idx) => (
                                        <div key={`${entry.nodeId}-${idx}`} className="flex items-start gap-3 py-3">
                                            {/* Step Line */}
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${entry.status === "success"
                                                        ? "bg-green-100 text-green-700"
                                                        : entry.status === "skipped"
                                                            ? "bg-slate-100 text-slate-500"
                                                            : "bg-amber-100 text-amber-700"
                                                        }`}
                                                >
                                                    {entry.step}
                                                </div>
                                                {idx < executionLog.length - 1 && (
                                                    <div className="w-0.5 h-6 bg-slate-200 mt-1" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-slate-800">
                                                        {entry.nodeLabel}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
                                                        {entry.nodeType}
                                                    </span>
                                                    {entry.status === "success" && (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                    )}
                                                    {entry.status === "skipped" && (
                                                        <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{entry.message}</p>
                                            </div>

                                            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                                        </div>
                                    ))}

                                    {!isSimulating && executionLog.length > 0 && (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                                            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Simulação concluída
                                            </div>
                                            <p className="text-xs text-green-600 mt-1">
                                                {executionLog.filter((e) => e.status === "success").length} nó(s)
                                                executado(s),{" "}
                                                {executionLog.filter((e) => e.status === "skipped").length} ignorado(s)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
