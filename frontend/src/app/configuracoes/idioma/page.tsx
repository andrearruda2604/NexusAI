"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import { ArrowLeft, Globe, Save, Loader2, CheckCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

const TIMEZONES = [
    { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
    { value: "America/Manaus", label: "Manaus (GMT-4)" },
    { value: "America/Belem", label: "Belém (GMT-3)" },
    { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
    { value: "America/Recife", label: "Recife (GMT-3)" },
    { value: "America/Cuiaba", label: "Cuiabá (GMT-4)" },
    { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
    { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
    { value: "America/New_York", label: "Nova York (GMT-5)" },
    { value: "Europe/London", label: "Londres (GMT+0)" },
    { value: "Europe/Lisbon", label: "Lisboa (GMT+0)" },
    { value: "Asia/Tokyo", label: "Tóquio (GMT+9)" },
];

const LANGUAGES = [
    { value: "pt-BR", label: "Português (Brasil)" },
    { value: "en-US", label: "English (US)" },
    { value: "es", label: "Español" },
];

export default function IdiomaPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [language, setLanguage] = useState("pt-BR");
    const [timezone, setTimezone] = useState("America/Sao_Paulo");

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/preferences/${DEMO_ORG_ID}`);
            if (res.ok) {
                const data = await res.json();
                setLanguage(data.language || "pt-BR");
                setTimezone(data.timezone || "America/Sao_Paulo");
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
                body: JSON.stringify({ language, timezone }),
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
                            <Globe className="w-5 h-5 text-blue-600" />
                            <span>Idioma e Região</span>
                        </div>
                        <div className="card-body space-y-5">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Idioma
                                        </label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="input w-full"
                                        >
                                            {LANGUAGES.map((lang) => (
                                                <option key={lang.value} value={lang.value}>
                                                    {lang.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Define o idioma da interface e das respostas da IA.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Fuso Horário
                                        </label>
                                        <select
                                            value={timezone}
                                            onChange={(e) => setTimezone(e.target.value)}
                                            className="input w-full"
                                        >
                                            {TIMEZONES.map((tz) => (
                                                <option key={tz.value} value={tz.value}>
                                                    {tz.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Usado para exibir horários de mensagens e relatórios.
                                        </p>
                                    </div>
                                </>
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
