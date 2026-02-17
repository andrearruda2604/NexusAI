"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import { ArrowLeft, Shield, Eye, EyeOff, Save, Loader2, CheckCircle, Key, Lock } from "lucide-react";

export default function SegurancaPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: "",
    });
    const [error, setError] = useState("");

    const handleSave = async () => {
        setError("");

        if (!passwords.current || !passwords.new || !passwords.confirm) {
            setError("Preencha todos os campos");
            return;
        }

        if (passwords.new.length < 8) {
            setError("A nova senha deve ter pelo menos 8 caracteres");
            return;
        }

        if (passwords.new !== passwords.confirm) {
            setError("As senhas não coincidem");
            return;
        }

        setIsSaving(true);
        try {
            // TODO: Integrate with Supabase Auth updateUser
            // For now, simulate success
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSaved(true);
            setPasswords({ current: "", new: "", confirm: "" });
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError("Erro ao alterar senha");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleShowPassword = (field: "current" | "new" | "confirm") => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
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

                    {/* Password Change */}
                    <div className="card mb-6">
                        <div className="card-header flex items-center gap-3">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <span>Alterar Senha</span>
                        </div>
                        <div className="card-body space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {[
                                { key: "current" as const, label: "Senha Atual", placeholder: "Digite sua senha atual" },
                                { key: "new" as const, label: "Nova Senha", placeholder: "Mínimo de 8 caracteres" },
                                { key: "confirm" as const, label: "Confirmar Nova Senha", placeholder: "Repita a nova senha" },
                            ].map((field) => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        {field.label}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords[field.key] ? "text" : "password"}
                                            value={passwords[field.key]}
                                            onChange={(e) =>
                                                setPasswords({ ...passwords, [field.key]: e.target.value })
                                            }
                                            className="input w-full pr-10"
                                            placeholder={field.placeholder}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowPassword(field.key)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPasswords[field.key] ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Two-Factor Auth (future) */}
                    <div className="card mb-6">
                        <div className="card-header flex items-center gap-3">
                            <Key className="w-5 h-5 text-amber-600" />
                            <span>Autenticação em Dois Fatores</span>
                        </div>
                        <div className="card-body">
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="font-medium text-slate-900">2FA não habilitado</p>
                                    <p className="text-sm text-slate-500">
                                        Adicione uma camada extra de segurança à sua conta.
                                    </p>
                                </div>
                                <button className="btn btn-secondary text-sm" disabled>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Em breve
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex items-center gap-2">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? "Salvando..." : "Alterar Senha"}
                        </button>
                        {saved && (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4" /> Senha alterada!
                            </span>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
