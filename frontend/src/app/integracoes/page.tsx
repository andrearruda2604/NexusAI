"use client";

import { useState } from "react";
import { Sidebar, Header } from "@/components/layout";
import {
    MessageSquare,
    Instagram,
    Facebook,
    Globe,
    Webhook,
    Key,
    QrCode,
    Check,
    AlertCircle,
    Plus,
    Copy,
    Eye,
    EyeOff,
    RefreshCw,
} from "lucide-react";

interface Integration {
    id: string;
    name: string;
    type: "whatsapp" | "instagram" | "facebook" | "webhook";
    status: "connected" | "disconnected" | "pending";
    lastSync?: string;
}

const integrations: Integration[] = [
    { id: "1", name: "WhatsApp Business", type: "whatsapp", status: "connected", lastSync: "há 2 min" },
    { id: "2", name: "Instagram DM", type: "instagram", status: "disconnected" },
    { id: "3", name: "Facebook Messenger", type: "facebook", status: "pending" },
];

const webhooks = [
    { id: "1", name: "Bling ERP", url: "https://api.bling.com/webhook", active: true },
    { id: "2", name: "Tiny ERP", url: "https://api.tiny.com/callback", active: false },
];

const apiKeys = [
    { id: "1", name: "Production Key", key: "nx_prod_xxx...xxx", createdAt: "01/01/2026" },
    { id: "2", name: "Development Key", key: "nx_dev_xxx...xxx", createdAt: "10/01/2026" },
];

export default function Integracoes() {
    const [showKey, setShowKey] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar />
            <main className="ml-[260px]">
                <Header title="Integrações" />
                <div className="p-8">
                    {/* Channels */}
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Canais de Atendimento</h2>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        {/* WhatsApp Card */}
                        <div className="card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-green-600" />
                                </div>
                                <span className="badge badge-success">Conectado</span>
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">WhatsApp Business</h3>
                            <p className="text-sm text-slate-500 mb-4">via Evolution API</p>

                            <div className="p-4 bg-slate-50 rounded-xl mb-4 flex items-center justify-center">
                                <div className="w-32 h-32 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center">
                                    <QrCode className="w-24 h-24 text-slate-300" />
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 text-center mb-4">
                                Escaneie o QR Code com seu WhatsApp
                            </p>

                            <button className="btn btn-secondary w-full">
                                <RefreshCw className="w-4 h-4" />
                                Gerar Novo QR
                            </button>
                        </div>

                        {/* Instagram Card */}
                        <div className="card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                                    <Instagram className="w-6 h-6 text-pink-600" />
                                </div>
                                <span className="badge badge-neutral">Desconectado</span>
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">Instagram Direct</h3>
                            <p className="text-sm text-slate-500 mb-4">Mensagens diretas do Instagram</p>

                            <div className="p-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl mb-4 flex items-center justify-center">
                                <Instagram className="w-16 h-16 text-white" />
                            </div>

                            <button className="btn btn-primary w-full">
                                Conectar Instagram
                            </button>
                        </div>

                        {/* Facebook Card */}
                        <div className="card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Facebook className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="badge badge-warning">Pendente</span>
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">Facebook Messenger</h3>
                            <p className="text-sm text-slate-500 mb-4">Mensagens da página do Facebook</p>

                            <div className="p-8 bg-blue-600 rounded-xl mb-4 flex items-center justify-center">
                                <Facebook className="w-16 h-16 text-white" />
                            </div>

                            <button className="btn btn-primary w-full">
                                Conectar Facebook
                            </button>
                        </div>
                    </div>

                    {/* Webhooks */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="card">
                            <div className="card-header flex items-center justify-between">
                                <span>Webhooks ERP/CRM</span>
                                <button className="btn btn-primary text-sm py-1.5">
                                    <Plus className="w-4 h-4" />
                                    Novo Webhook
                                </button>
                            </div>
                            <div className="p-4 space-y-3">
                                {webhooks.map((wh) => (
                                    <div key={wh.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <Webhook className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{wh.name}</p>
                                            <p className="text-sm text-slate-500 truncate max-w-[200px]">{wh.url}</p>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ${wh.active ? "bg-green-500" : "bg-slate-300"}`} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* API Keys */}
                        <div className="card">
                            <div className="card-header flex items-center justify-between">
                                <span>API Keys</span>
                                <button className="btn btn-primary text-sm py-1.5">
                                    <Plus className="w-4 h-4" />
                                    Nova Chave
                                </button>
                            </div>
                            <div className="p-4 space-y-3">
                                {apiKeys.map((ak) => (
                                    <div key={ak.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <Key className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{ak.name}</p>
                                            <p className="text-sm text-slate-500 font-mono">
                                                {showKey === ak.id ? "nx_prod_a1b2c3d4e5f6g7h8i9j0" : ak.key}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowKey(showKey === ak.id ? null : ak.id)}
                                            className="p-2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showKey === ak.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-slate-600">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
