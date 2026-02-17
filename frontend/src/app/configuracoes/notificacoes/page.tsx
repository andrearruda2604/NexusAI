"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import { ArrowLeft, Bell, Save, Loader2, CheckCircle, Mail, Volume2, MessageSquare } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function NotificacoesPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sound: true,
        digest_frequency: "daily",
    });

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/preferences/${DEMO_ORG_ID}`);
            if (res.ok) {
                const data = await res.json();
                if (data.notifications) {
                    setNotifications(data.notifications);
                }
            }
        } catch (error) {
            console.error("Error loading preferences:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaved(false);
        try {
            await fetch(`${API_URL}/settings/preferences/${DEMO_ORG_ID}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notifications }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving:", error);
            alert("Erro ao salvar preferências");
        } finally {
            setIsSaving(false);
        }
    };

    const notificationItems = [
        { key: "email", label: "Notificações por Email", description: "Receba alertas e resumos no seu email", icon: Mail },
        { key: "push", label: "Notificações Push", description: "Notificações em tempo real no navegador", icon: MessageSquare },
        { key: "sound", label: "Som de Notificação", description: "Reproduzir som ao receber novas mensagens", icon: Volume2 },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar />
            <main className="ml-[260px]">
                <Header title="Configurações" />
                <div className="p-8 max-w-3xl">
                    <button
                        onClick={() => router.push("/configuracoes")}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Voltar às Configurações</span>
                    </button>

                    <div className="card mb-6">
                        <div className="card-header flex items-center gap-3">
                            <Bell className="w-5 h-5 text-blue-600" />
                            <span>Notificações</span>
                        </div>
                        <div className="card-body">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {notificationItems.map((item) => (
                                        <div key={item.key} className="flex items-center justify-between py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                                    <item.icon className="w-5 h-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{item.label}</p>
                                                    <p className="text-sm text-slate-500">{item.description}</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={(notifications as any)[item.key]}
                                                    onChange={(e) =>
                                                        setNotifications({ ...notifications, [item.key]: e.target.checked })
                                                    }
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    ))}

                                    {/* Digest frequency */}
                                    <div className="py-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Frequência de Resumos
                                        </label>
                                        <select
                                            value={notifications.digest_frequency}
                                            onChange={(e) =>
                                                setNotifications({ ...notifications, digest_frequency: e.target.value })
                                            }
                                            className="input w-full max-w-xs"
                                        >
                                            <option value="realtime">Tempo real</option>
                                            <option value="hourly">A cada hora</option>
                                            <option value="daily">Diário</option>
                                            <option value="weekly">Semanal</option>
                                            <option value="never">Nunca</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex items-center gap-2">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? "Salvando..." : "Salvar Alterações"}
                        </button>
                        {saved && (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4" /> Salvo!
                            </span>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
