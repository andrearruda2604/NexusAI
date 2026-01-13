"use client";

import { MessageSquare } from "lucide-react";

interface Chat {
    id: string;
    name: string;
    avatar: string;
    channel: "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "WEBCHAT";
    status: "ATIVO" | "FINALIZADO" | "TRANSFERIDO";
    sentiment: "positive" | "neutral" | "negative";
    lastMessage: string;
}

const mockChats: Chat[] = [
    {
        id: "1",
        name: "Sarah Jenkins",
        avatar: "SJ",
        channel: "WHATSAPP",
        status: "ATIVO",
        sentiment: "positive",
        lastMessage: "há 2 min",
    },
    {
        id: "2",
        name: "David Chen",
        avatar: "DC",
        channel: "WHATSAPP",
        status: "FINALIZADO",
        sentiment: "neutral",
        lastMessage: "há 15 min",
    },
    {
        id: "3",
        name: "Elena Rodriguez",
        avatar: "ER",
        channel: "WHATSAPP",
        status: "ATIVO",
        sentiment: "negative",
        lastMessage: "Agora",
    },
    {
        id: "4",
        name: "Marcus Williams",
        avatar: "MW",
        channel: "INSTAGRAM",
        status: "ATIVO",
        sentiment: "positive",
        lastMessage: "há 8 min",
    },
    {
        id: "5",
        name: "Ana Souza",
        avatar: "AS",
        channel: "WEBCHAT",
        status: "TRANSFERIDO",
        sentiment: "neutral",
        lastMessage: "há 25 min",
    },
];

const channelColors: Record<Chat["channel"], string> = {
    WHATSAPP: "text-green-600",
    INSTAGRAM: "text-pink-500",
    FACEBOOK: "text-blue-600",
    WEBCHAT: "text-slate-600",
};

const statusStyles: Record<Chat["status"], string> = {
    ATIVO: "badge-primary",
    FINALIZADO: "badge-neutral",
    TRANSFERIDO: "badge-warning",
};

const sentimentEmoji: Record<Chat["sentiment"], string> = {
    positive: "😊",
    neutral: "😐",
    negative: "😠",
};

const sentimentLabel: Record<Chat["sentiment"], string> = {
    positive: "Positivo",
    neutral: "Neutro",
    negative: "Frustrado",
};

export default function RecentChatsTable() {
    return (
        <div className="card animate-fade-in">
            <div className="flex items-center justify-between p-6 pb-4">
                <h3 className="font-semibold text-slate-900">Atendimentos Recentes</h3>
                <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                    Ver Atividade Completa
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Canal</th>
                            <th>Status</th>
                            <th>Sentimento</th>
                            <th>Última Mensagem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockChats.map((chat) => (
                            <tr key={chat.id} className="cursor-pointer">
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-medium text-slate-600">
                                            {chat.avatar}
                                        </div>
                                        <span className="font-medium">{chat.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className={`flex items-center gap-2 ${channelColors[chat.channel]}`}>
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="text-sm font-medium">{chat.channel}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${statusStyles[chat.status]}`}>
                                        {chat.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{sentimentEmoji[chat.sentiment]}</span>
                                        <span className="text-sm text-slate-600">
                                            {sentimentLabel[chat.sentiment]}
                                        </span>
                                    </div>
                                </td>
                                <td className="text-slate-500 text-sm">{chat.lastMessage}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
