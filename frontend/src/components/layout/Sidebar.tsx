"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    Workflow,
    Plug,
    MessageSquare,
    Settings,
    ChevronLeft,
} from "lucide-react";
import { useState } from "react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Base de Conhecimento", href: "/conhecimento", icon: BookOpen },
    { name: "Motor de Regras", href: "/regras", icon: Workflow },
    { name: "Integrações", href: "/integracoes", icon: Plug },
    { name: "Chat ao Vivo", href: "/chat", icon: MessageSquare },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-[#1e293b] text-white flex flex-col transition-all duration-300 z-50 ${collapsed ? "w-[72px]" : "w-[260px]"
                }`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-700">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                    </svg>
                </div>
                {!collapsed && (
                    <div>
                        <h1 className="font-bold text-lg leading-tight">Nexus AI</h1>
                        <span className="text-xs text-blue-400 uppercase tracking-wider">
                            Enterprise
                        </span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-3">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                            ? "bg-blue-500 text-white"
                                            : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                        }`}
                                    title={collapsed ? item.name : undefined}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    {!collapsed && (
                                        <span className="font-medium text-sm">{item.name}</span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Settings */}
            <div className="border-t border-slate-700 p-3">
                <Link
                    href="/configuracoes"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
                    title={collapsed ? "Configurações" : undefined}
                >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium text-sm">Configurações</span>}
                </Link>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 hover:text-white transition-colors shadow-md"
            >
                <ChevronLeft
                    className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
                />
            </button>
        </aside>
    );
}
