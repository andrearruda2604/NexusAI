"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import { ArrowLeft, Palette, Save, Loader2, CheckCircle, Sun, Moon, Monitor } from "lucide-react";
import { applyTheme } from "@/components/ThemeProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

const themes = [
    { id: "light", label: "Claro", icon: Sun, description: "Tema padrão com fundo claro" },
    { id: "dark", label: "Escuro", icon: Moon, description: "Reduz a fadiga ocular em ambientes escuros" },
    { id: "system", label: "Sistema", icon: Monitor, description: "Segue a preferência do sistema operacional" },
];

export default function AparenciaPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState("light");

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/preferences/${DEMO_ORG_ID}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedTheme(data.theme || "light");
            }
        } catch (error) {
            console.error("Error loading preferences:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleThemeSelect = (themeId: string) => {
        setSelectedTheme(themeId);
        // Preview the theme immediately
        applyTheme(themeId);
        localStorage.setItem("nexus-theme", themeId);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaved(false);
        try {
            await fetch(`${API_URL}/settings/preferences/${DEMO_ORG_ID}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme: selectedTheme }),
            });

            // Ensure theme is applied and saved
            localStorage.setItem("nexus-theme", selectedTheme);
            applyTheme(selectedTheme);

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
                            <Palette className="w-5 h-5 text-blue-600" />
                            <span>Aparência</span>
                        </div>
                        <div className="card-body">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-500 mb-6">
                                        Escolha o tema visual da plataforma.
                                    </p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {themes.map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => handleThemeSelect(theme.id)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedTheme === theme.id
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-slate-200 hover:border-slate-300"
                                                    }`}
                                            >
                                                <div
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${selectedTheme === theme.id
                                                        ? "bg-blue-100"
                                                        : "bg-slate-100"
                                                        }`}
                                                >
                                                    <theme.icon
                                                        className={`w-5 h-5 ${selectedTheme === theme.id
                                                            ? "text-blue-600"
                                                            : "text-slate-500"
                                                            }`}
                                                    />
                                                </div>
                                                <p className="font-medium text-slate-900 text-sm">{theme.label}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{theme.description}</p>
                                            </button>
                                        ))}
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
