"use client";

import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import {
    ArrowLeft,
    CreditCard,
    CheckCircle,
    Zap,
    MessageSquare,
    FileText,
    Globe,
    Users,
    Crown,
} from "lucide-react";

const currentPlan = {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    features: [
        { label: "Até 100 conversas/mês", icon: MessageSquare, current: 12, limit: 100 },
        { label: "Até 5 documentos na base", icon: FileText, current: 1, limit: 5 },
        { label: "1 canal de integração", icon: Globe, current: 0, limit: 1 },
        { label: "1 usuário", icon: Users, current: 1, limit: 1 },
    ],
};

const plans = [
    {
        name: "Pro",
        price: "R$ 97",
        period: "/mês",
        highlight: true,
        features: [
            "1.000 conversas/mês",
            "50 documentos na base",
            "3 canais de integração",
            "5 usuários",
            "Relatórios avançados",
            "Suporte prioritário",
        ],
    },
    {
        name: "Enterprise",
        price: "Sob consulta",
        period: "",
        highlight: false,
        features: [
            "Conversas ilimitadas",
            "Documentos ilimitados",
            "Todos os canais",
            "Usuários ilimitados",
            "API dedicada",
            "SLA garantido",
        ],
    },
];

export default function PlanoPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar />
            <main className="ml-[260px]">
                <Header title="Configurações" />
                <div className="p-8 max-w-4xl">
                    <button
                        onClick={() => router.push("/configuracoes")}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Voltar às Configurações</span>
                    </button>

                    {/* Current Plan */}
                    <div className="card mb-6">
                        <div className="card-header flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            <span>Plano Atual</span>
                        </div>
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-bold text-slate-900">{currentPlan.name}</h3>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                            Ativo
                                        </span>
                                    </div>
                                    <p className="text-slate-500">
                                        <span className="text-3xl font-bold text-slate-900">{currentPlan.price}</span>
                                        {currentPlan.period}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {currentPlan.features.map((feature) => (
                                    <div key={feature.label} className="p-3 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <feature.icon className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm text-slate-600">{feature.label}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min((feature.current / feature.limit) * 100, 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {feature.current} de {feature.limit} usados
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Upgrade Plans */}
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Fazer Upgrade
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`card overflow-hidden ${plan.highlight ? "ring-2 ring-blue-500" : ""
                                    }`}
                            >
                                {plan.highlight && (
                                    <div className="bg-blue-500 text-white text-center text-xs font-medium py-1.5 flex items-center justify-center gap-1">
                                        <Crown className="w-3 h-3" /> Mais Popular
                                    </div>
                                )}
                                <div className="p-6">
                                    <h4 className="text-xl font-bold text-slate-900">{plan.name}</h4>
                                    <p className="text-slate-500 mt-1">
                                        <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                                        {plan.period}
                                    </p>

                                    <ul className="space-y-3 mt-6">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className={`w-full mt-6 py-2.5 rounded-lg font-medium transition-colors ${plan.highlight
                                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                            }`}
                                    >
                                        {plan.highlight ? "Assinar Pro" : "Falar com Vendas"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
