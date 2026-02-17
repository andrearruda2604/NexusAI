"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import { ArrowLeft, Building, Save, Loader2, CheckCircle, Sparkles } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

const SECTORS = [
    "Tecnologia",
    "E-commerce",
    "Saúde",
    "Educação",
    "Finanças",
    "Varejo",
    "Serviços",
    "Indústria",
    "Alimentação",
    "Imobiliário",
    "Outro",
];

export default function EmpresaPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [org, setOrg] = useState({
        name: "",
        cnpj: "",
        sector: "",
        ai_prompt: "",
    });

    useEffect(() => {
        loadOrganization();
    }, []);

    const loadOrganization = async () => {
        try {
            // Load org data
            const orgRes = await fetch(`${API_URL}/settings/organization/${DEMO_ORG_ID}`);
            if (orgRes.ok) {
                const orgData = await orgRes.json();
                setOrg((prev) => ({
                    ...prev,
                    name: orgData.name || "",
                }));
            }

            // Load preferences (settings JSONB)
            const prefRes = await fetch(`${API_URL}/settings/preferences/${DEMO_ORG_ID}`);
            if (prefRes.ok) {
                const prefData = await prefRes.json();
                setOrg((prev) => ({
                    ...prev,
                    cnpj: prefData.company_cnpj || "",
                    sector: prefData.company_sector || "",
                    ai_prompt: prefData.ai_prompt || "",
                }));
            }
        } catch (error) {
            console.error("Error loading organization:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaved(false);
        try {
            // Update org name
            await fetch(`${API_URL}/settings/organization/${DEMO_ORG_ID}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: org.name }),
            });

            // Update preferences
            await fetch(`${API_URL}/settings/preferences/${DEMO_ORG_ID}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company_cnpj: org.cnpj,
                    company_sector: org.sector,
                    ai_prompt: org.ai_prompt,
                }),
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving organization:", error);
            alert("Erro ao salvar informações da empresa");
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

                    {/* Company Basic Info */}
                    <div className="card mb-6">
                        <div className="card-header flex items-center gap-3">
                            <Building className="w-5 h-5 text-blue-600" />
                            <span>Informações da Empresa</span>
                        </div>
                        <div className="card-body space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Nome da Empresa
                                        </label>
                                        <input
                                            type="text"
                                            value={org.name}
                                            onChange={(e) => setOrg({ ...org, name: e.target.value })}
                                            className="input w-full"
                                            placeholder="Nome da sua empresa"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            CNPJ
                                        </label>
                                        <input
                                            type="text"
                                            value={org.cnpj}
                                            onChange={(e) => setOrg({ ...org, cnpj: e.target.value })}
                                            className="input w-full"
                                            placeholder="00.000.000/0000-00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Setor de Atuação
                                        </label>
                                        <select
                                            value={org.sector}
                                            onChange={(e) => setOrg({ ...org, sector: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="">Selecione o setor</option>
                                            {SECTORS.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* AI Prompt */}
                    <div className="card mb-6">
                        <div className="card-header flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            <span>Prompt da IA</span>
                        </div>
                        <div className="card-body space-y-4">
                            <p className="text-sm text-slate-500">
                                Configure o comportamento padrão da IA ao responder clientes. Este prompt será usado como instrução base para todas as conversas.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Instrução Base
                                </label>
                                <textarea
                                    value={org.ai_prompt}
                                    onChange={(e) => setOrg({ ...org, ai_prompt: e.target.value })}
                                    className="input w-full min-h-[160px] resize-y"
                                    placeholder="Ex: Você é um assistente da empresa XYZ. Seu tom deve ser profissional e amigável. Sempre ofereça soluções proativas..."
                                    rows={6}
                                />
                                <p className="text-xs text-slate-400 mt-1.5">
                                    Este prompt será adicionado ao contexto de toda conversa da IA.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Save button */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSaving ? "Salvando..." : "Salvar Alterações"}
                        </button>
                        {saved && (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                Salvo com sucesso!
                            </span>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
