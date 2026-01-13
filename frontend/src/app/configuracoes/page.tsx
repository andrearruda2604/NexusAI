"use client";

import { Sidebar, Header } from "@/components/layout";
import {
    User,
    Building,
    Bell,
    Shield,
    Palette,
    Globe,
    CreditCard,
    HelpCircle,
    ChevronRight,
} from "lucide-react";

const settingsSections = [
    {
        title: "Conta",
        items: [
            { name: "Perfil", description: "Nome, email e foto", icon: User },
            { name: "Empresa", description: "Informações da organização", icon: Building },
        ],
    },
    {
        title: "Preferências",
        items: [
            { name: "Notificações", description: "Alertas e emails", icon: Bell },
            { name: "Aparência", description: "Tema e exibição", icon: Palette },
            { name: "Idioma e Região", description: "Localização e fuso horário", icon: Globe },
        ],
    },
    {
        title: "Segurança",
        items: [
            { name: "Segurança", description: "Senha e autenticação", icon: Shield },
        ],
    },
    {
        title: "Faturamento",
        items: [
            { name: "Plano e Pagamento", description: "Assinatura e faturas", icon: CreditCard },
        ],
    },
    {
        title: "Suporte",
        items: [
            { name: "Central de Ajuda", description: "Documentação e tutoriais", icon: HelpCircle },
        ],
    },
];

export default function Configuracoes() {
    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar />
            <main className="ml-[260px]">
                <Header title="Configurações" />
                <div className="p-8 max-w-3xl">
                    {settingsSections.map((section) => (
                        <div key={section.title} className="mb-8">
                            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                                {section.title}
                            </h2>
                            <div className="card divide-y divide-slate-100">
                                {section.items.map((item) => (
                                    <button
                                        key={item.name}
                                        className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <item.icon className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{item.name}</p>
                                            <p className="text-sm text-slate-500">{item.description}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
