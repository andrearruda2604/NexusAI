"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import { ArrowLeft, User, Camera, Save, Loader2, CheckCircle, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function PerfilPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
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

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith("image/")) {
            alert("Por favor, selecione uma imagem (JPG, PNG, WebP ou GIF)");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 2MB");
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${DEMO_ORG_ID}-${Date.now()}.${fileExt}`;
            const filePath = `profiles/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                alert("Erro ao fazer upload da imagem: " + uploadError.message);
                return;
            }

            // Get public URL
            const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            // Update profile state
            setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));

            // Save immediately to backend
            await fetch(`${API_URL}/settings/profile/${DEMO_ORG_ID}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatar_url: publicUrl }),
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Avatar upload error:", error);
            alert("Erro ao fazer upload da imagem");
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemoveAvatar = async () => {
        setProfile((prev) => ({ ...prev, avatar_url: "" }));
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
                    avatar_url: profile.avatar_url || null,
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

    const initials = profile.full_name
        .split(" ")
        .map((n) => n.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

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
                                            {profile.avatar_url ? (
                                                <img
                                                    src={profile.avatar_url}
                                                    alt={profile.full_name}
                                                    className="w-20 h-20 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                                    {initials || "A"}
                                                </div>
                                            )}
                                            {/* Hidden file input */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                className="hidden"
                                                onChange={handleAvatarUpload}
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                                ) : (
                                                    <Camera className="w-4 h-4 text-slate-600" />
                                                )}
                                            </button>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{profile.full_name || "Admin"}</p>
                                            <p className="text-sm text-slate-500 capitalize">{profile.role}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="text-xs text-blue-600 hover:text-blue-700"
                                                >
                                                    {isUploading ? "Enviando..." : "Alterar foto"}
                                                </button>
                                                {profile.avatar_url && (
                                                    <>
                                                        <span className="text-slate-300">|</span>
                                                        <button
                                                            onClick={handleRemoveAvatar}
                                                            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Remover
                                                        </button>
                                                    </>
                                                )}
                                            </div>
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
