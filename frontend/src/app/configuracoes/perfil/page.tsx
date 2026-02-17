"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import { ArrowLeft, User, Camera, Save, Loader2, CheckCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function PerfilPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [profile, setProfile] = useState({
        full_name: "",
        avatar_url: "",
        role: "admin",
        email: "admin@nexusai.com",
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/settings/profile/${DEMO_ORG_ID}`);
            if (response.ok) {
                const data = await response.json();
                setProfile((prev) => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaved(false);
        try {
            const response = await fetch(`${API_URL}/settings/profile/${DEMO_ORG_ID}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                }),
            });
            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Erro ao salvar perfil");
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
                    {/* Back button */}
                    <button
                        onClick={() => router.push("/configuracoes")}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Voltar às Configurações</span>
                    </button>

                    <div className="card">
                        <div className="card-header flex items-center gap-3">
                            <User className="w-5 h-5 text-blue-600" />
                            <span>Perfil</span>
                        </div>
                        <div className="card-body space-y-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <>
                                    {/* Avatar */}
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                                {profile.full_name?.charAt(0)?.toUpperCase() || "A"}
                                            </div>
                                            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200">
                                                <Camera className="w-4 h-4 text-slate-600" />
                                            </button>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{profile.full_name || "Admin"}</p>
                                            <p className="text-sm text-slate-500 capitalize">{profile.role}</p>
                                        </div>
                                    </div>

                                    {/* Form */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Nome Completo
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.full_name}
                                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                className="input w-full"
                                                placeholder="Seu nome completo"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                className="input w-full bg-slate-50"
                                                disabled
                                            />
                                            <p className="text-xs text-slate-400 mt-1">O email não pode ser alterado.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                URL do Avatar
                                            </label>
                                            <input
                                                type="url"
                                                value={profile.avatar_url || ""}
                                                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                                                className="input w-full"
                                                placeholder="https://exemplo.com/foto.jpg"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Cargo
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.role === "admin" ? "Administrador" : profile.role === "manager" ? "Gerente" : "Agente"}
                                                className="input w-full bg-slate-50"
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    {/* Save button */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
