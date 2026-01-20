"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout";
import { api } from "@/services/api";
import { useWebSocket } from "@/contexts/WebSocketContext";
import {
    Search,
    Send,
    Paperclip,
    MoreVertical,
    Phone,
    Video,
    User,
    Bot,
    Clock,
    Tag,
    FileText,
    MessageSquare,
    Loader2
} from "lucide-react";

// Types matching backend
interface Message {
    id: string;
    sender: "client" | "ai" | "agent";
    content: string;
    created_at: string;
}

interface Conversation {
    id: string;
    client_name: string;
    client_phone: string;
    channel: "whatsapp" | "instagram" | "facebook" | "webchat";
    status: "active" | "closed" | "transferred" | "waiting";
    unread_count?: number; // Optional metadata
    updated_at: string;
    handled_by: "ai" | "human";
}

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function ChatAoVivo() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    // Fetch conversations
    useEffect(() => {
        loadConversations();

        // Polling for demo (ideal: WebSocket)
        const interval = setInterval(loadConversations, 10000);
        return () => clearInterval(interval);
    }, []);

    // Fetch messages when conversation changes
    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    // WebSocket handling
    const { lastMessage } = useWebSocket();

    useEffect(() => {
        if (lastMessage && lastMessage.type === "new_message") {
            const { conversation_id, message } = lastMessage;

            // If current conversation is active, append message
            if (selectedConversation && conversation_id === selectedConversation.id) {
                setMessages((prev) => {
                    if (prev.find(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }

            // Update conversation list preview
            setConversations(prev => prev.map(c => {
                if (c.id === conversation_id) {
                    return { ...c, last_message: message.content, updated_at: message.created_at };
                }
                return c;
            }));
        }
    }, [lastMessage, selectedConversation]);

    const loadConversations = async () => {
        try {
            const data = await api.chat.list(DEMO_ORG_ID);
            setConversations(data || []);
            setIsLoading(false);

            // Auto-select first if none selected
            if (!selectedConversation && data && data.length > 0) {
                // setSelectedConversation(data[0]);
            }
        } catch (error) {
            console.error("Error loading conversations:", error);
            setIsLoading(false);
        }
    };

    const loadMessages = async (id: string) => {
        try {
            const data = await api.chat.getMessages(id);
            setMessages(data || []);
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        setIsSending(true);
        try {
            // Optimistic update
            const tempMsg: Message = {
                id: "temp-" + Date.now(),
                sender: "agent", // Assuming agent is sending
                content: newMessage,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMsg]);
            setNewMessage("");

            await api.chat.sendMessage(selectedConversation.id, tempMsg.content, "agent");
            await loadMessages(selectedConversation.id);
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (name: string) => {
        return name ? name.substring(0, 2).toUpperCase() : "?";
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            <Sidebar />

            <div className="flex-1 ml-[260px] flex h-screen">
                {/* Conversations List */}
                <div className="w-[360px] bg-white border-r border-slate-200 flex flex-col">
                    <header className="p-4 border-b border-slate-200">
                        <h1 className="text-lg font-semibold text-slate-900 mb-3">Conversas</h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar conversa..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </header>

                    <div className="flex gap-2 p-3 border-b border-slate-200">
                        <button className="flex-1 btn btn-primary py-2 text-sm">Todas</button>
                        <button className="flex-1 btn btn-ghost py-2 text-sm">IA</button>
                        <button className="flex-1 btn btn-ghost py-2 text-sm">Humanos</button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                Nenhuma conversa encontrada.
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`w-full p-4 flex gap-3 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left ${selectedConversation?.id === conv.id ? "bg-blue-50" : ""
                                        }`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-medium text-slate-600">
                                            {getInitials(conv.client_name || conv.client_phone)}
                                        </div>
                                        {conv.channel === "whatsapp" && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-slate-900 truncate">
                                                {conv.client_name || conv.client_phone}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {formatTime(conv.updated_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 truncate">
                                            {conv.status === "active" ? "Em atendimento" : conv.status}
                                        </p>
                                    </div>
                                    {conv.handled_by === "ai" && (
                                        <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center" title="Atendido por IA">
                                            <Bot className="w-3 h-3 text-purple-600" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                {selectedConversation ? (
                    <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
                        {/* Chat Header */}
                        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-medium text-slate-600">
                                    {getInitials(selectedConversation.client_name || selectedConversation.client_phone)}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        {selectedConversation.client_name || selectedConversation.client_phone}
                                    </h2>
                                    <p className="text-sm text-green-600 flex items-center gap-2">
                                        online • {selectedConversation.channel}
                                        {selectedConversation.handled_by === "ai" && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                                IA Nexus
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                    <Video className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.sender === "client" ? "justify-start" : "justify-end"
                                        }`}
                                >
                                    {msg.sender === "client" && (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-slate-600" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-md px-4 py-3 rounded-2xl ${msg.sender === "client"
                                            ? "bg-white border border-slate-200"
                                            : msg.sender === "ai"
                                                ? "bg-purple-50 border border-purple-200 text-slate-800"
                                                : "bg-blue-500 text-white"
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-line">{msg.content}</p>
                                        <p
                                            className={`text-xs mt-1 ${msg.sender === "agent" ? "text-blue-200" : "text-slate-400"
                                                }`}
                                        >
                                            {formatTime(msg.created_at)}
                                        </p>
                                    </div>
                                    {msg.sender !== "client" && (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === "ai" ? "bg-purple-100" : "bg-blue-100"
                                            }`}>
                                            {msg.sender === "ai" ? (
                                                <Bot className="w-4 h-4 text-purple-600" />
                                            ) : (
                                                <User className="w-4 h-4 text-blue-600" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Message Input */}
                        <div className="bg-white border-t border-slate-200 p-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    type="text"
                                    placeholder="Digite sua mensagem..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isSending || !newMessage.trim()}
                                    className="btn btn-primary px-4 py-3 disabled:opacity-50"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">
                        <div className="text-center">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Selecione uma conversa para iniciar</p>
                        </div>
                    </div>
                )}

                {/* Context Panel (Only if logic dictates, keep it simple for now or conditional) */}
                {selectedConversation && (
                    <div className="w-[320px] bg-white border-l border-slate-200 overflow-y-auto hidden xl:block">
                        <div className="p-6 border-b border-slate-200">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-medium text-2xl text-slate-600 mx-auto mb-4">
                                {getInitials(selectedConversation.client_name || selectedConversation.client_phone)}
                            </div>
                            <h3 className="font-semibold text-slate-900 text-center">
                                {selectedConversation.client_name || "Cliente"}
                            </h3>
                            <p className="text-sm text-slate-500 text-center">
                                {selectedConversation.client_phone}
                            </p>
                        </div>

                        <div className="p-4">
                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                                Resumo da IA
                            </h4>
                            <div className="p-4 bg-blue-50 rounded-xl text-sm text-slate-700">
                                <p className="mb-2 italic text-slate-500">
                                    Resumo ainda não disponível.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200">
                            <button className="btn btn-secondary w-full mb-2">
                                Assumir Conversa
                            </button>
                            <button className="btn btn-ghost w-full text-red-500 hover:bg-red-50">
                                Encerrar Atendimento
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
