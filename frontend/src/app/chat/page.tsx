"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout";
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
} from "lucide-react";

interface Message {
    id: string;
    sender: "client" | "ai" | "agent";
    content: string;
    timestamp: string;
}

interface Conversation {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    channel: "whatsapp" | "instagram";
    status: "active" | "waiting" | "closed";
}

const conversations: Conversation[] = [
    {
        id: "1",
        name: "Sarah Jenkins",
        avatar: "SJ",
        lastMessage: "Gostaria de saber sobre o prazo de entrega...",
        time: "Agora",
        unread: 2,
        channel: "whatsapp",
        status: "active",
    },
    {
        id: "2",
        name: "David Chen",
        avatar: "DC",
        lastMessage: "Obrigado pelo atendimento!",
        time: "5 min",
        unread: 0,
        channel: "whatsapp",
        status: "closed",
    },
    {
        id: "3",
        name: "Elena Rodriguez",
        avatar: "ER",
        lastMessage: "Ainda não recebi o código de rastreio",
        time: "12 min",
        unread: 1,
        channel: "instagram",
        status: "waiting",
    },
    {
        id: "4",
        name: "Marcus Williams",
        avatar: "MW",
        lastMessage: "Qual o horário de funcionamento?",
        time: "30 min",
        unread: 0,
        channel: "whatsapp",
        status: "active",
    },
];

const messages: Message[] = [
    { id: "1", sender: "client", content: "Olá, boa tarde!", timestamp: "14:30" },
    { id: "2", sender: "ai", content: "Olá Sarah! 👋 Bem-vinda ao suporte da Nexus. Como posso ajudá-la hoje?", timestamp: "14:30" },
    { id: "3", sender: "client", content: "Gostaria de saber sobre o prazo de entrega do meu pedido", timestamp: "14:31" },
    { id: "4", sender: "ai", content: "Claro! Para consultar seu pedido, poderia me informar o número do pedido ou o CPF cadastrado?", timestamp: "14:31" },
    { id: "5", sender: "client", content: "O número é #12345", timestamp: "14:32" },
    { id: "6", sender: "ai", content: "Encontrei seu pedido #12345! 📦\n\nStatus: Em trânsito\nPrevisão de entrega: 15/01/2026\nTransportadora: Total Express\n\nPosso ajudar com mais alguma coisa?", timestamp: "14:32" },
];

export default function ChatAoVivo() {
    const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
    const [newMessage, setNewMessage] = useState("");

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            <Sidebar />

            <div className="flex-1 ml-[260px] flex">
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
                        <button className="flex-1 btn btn-ghost py-2 text-sm">Aguardando</button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`w-full p-4 flex gap-3 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left ${selectedConversation.id === conv.id ? "bg-blue-50" : ""
                                    }`}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-medium text-slate-600">
                                        {conv.avatar}
                                    </div>
                                    {conv.status === "active" && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-slate-900">{conv.name}</span>
                                        <span className="text-xs text-slate-500">{conv.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">{conv.lastMessage}</p>
                                </div>
                                {conv.unread > 0 && (
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-white font-medium">{conv.unread}</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-slate-50">
                    {/* Chat Header */}
                    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-medium text-slate-600">
                                {selectedConversation.avatar}
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">{selectedConversation.name}</h2>
                                <p className="text-sm text-green-600">Online • WhatsApp</p>
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
                                className={`flex gap-3 ${msg.sender === "client" ? "justify-start" : "justify-end"}`}
                            >
                                {msg.sender === "client" && (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-slate-600" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-md px-4 py-3 rounded-2xl ${msg.sender === "client"
                                            ? "bg-white border border-slate-200"
                                            : "bg-blue-500 text-white"
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                                    <p className={`text-xs mt-1 ${msg.sender === "client" ? "text-slate-400" : "text-blue-200"}`}>
                                        {msg.timestamp}
                                    </p>
                                </div>
                                {msg.sender !== "client" && (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-blue-600" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <div className="bg-white border-t border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                placeholder="Digite sua mensagem..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button className="btn btn-primary px-4 py-3">
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Context Panel */}
                <div className="w-[320px] bg-white border-l border-slate-200 overflow-y-auto">
                    <div className="p-6 border-b border-slate-200">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-medium text-2xl text-slate-600 mx-auto mb-4">
                            {selectedConversation.avatar}
                        </div>
                        <h3 className="font-semibold text-slate-900 text-center">{selectedConversation.name}</h3>
                        <p className="text-sm text-slate-500 text-center">+55 11 99999-9999</p>
                    </div>

                    <div className="p-4">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                            Resumo da IA
                        </h4>
                        <div className="p-4 bg-blue-50 rounded-xl text-sm text-slate-700">
                            <p className="mb-2">
                                <strong>Assunto:</strong> Consulta de prazo de entrega
                            </p>
                            <p className="mb-2">
                                <strong>Pedido:</strong> #12345
                            </p>
                            <p>
                                <strong>Sentimento:</strong> Neutro → Satisfeito
                            </p>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                            Dados do Cliente
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Tag className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600">Cliente desde: Jan 2024</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600">5 pedidos realizados</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MessageSquare className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600">3 atendimentos anteriores</span>
                            </div>
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
            </div>
        </div>
    );
}
