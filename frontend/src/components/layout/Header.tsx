"use client";

import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

interface HeaderProps {
    title: string;
}

export default function Header({ title }: HeaderProps) {
    const [profile, setProfile] = useState({ full_name: "", avatar_url: "", role: "admin" });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/profile/${DEMO_ORG_ID}`);
            if (res.ok) {
                const data = await res.json();
                setProfile({
                    full_name: data.full_name || "Admin",
                    avatar_url: data.avatar_url || "",
                    role: data.role || "admin",
                });
            }
        } catch (error) {
            console.error("Error loading profile for header:", error);
        }
    };

    const initials = profile.full_name
        .split(" ")
        .map((n) => n.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    const roleLabel =
        profile.role === "admin" ? "Administrador" : profile.role === "manager" ? "Gerente" : "Agente";

    return (
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
            {/* Title */}
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>

            {/* Right Side */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Busca global..."
                        className="pl-10 pr-4 py-2 w-[280px] text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
                </button>

                {/* User */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">{profile.full_name || "Admin"}</p>
                        <p className="text-xs text-slate-500">{roleLabel}</p>
                    </div>
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                            {initials || "A"}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
