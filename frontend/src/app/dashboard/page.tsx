"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/layout";
import { KPICard, VolumeChart, RecentChatsTable } from "@/components/dashboard";
import { MessageSquare, Zap, Clock } from "lucide-react";
import { api } from "@/services/api";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await api.dashboard.stats(DEMO_ORG_ID);
            setStats(data);
        } catch (error) {
            console.error("Error loading stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const kpis = stats?.kpis || {
        total_chats: "-",
        ai_resolution_rate: "-",
        avg_time: "-"
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar />
            <main className="ml-[260px]">
                <Header title="Visão Geral" />
                <div className="p-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <KPICard
                            label="Total de Atendimentos"
                            value={kpis.total_chats?.toString()}
                            change="+12% vs mês anterior"
                            changeType="positive"
                            icon={<MessageSquare className="w-6 h-6" />}
                            iconColor="blue"
                        />
                        <KPICard
                            label="Taxa de Resolução IA"
                            value={`${kpis.ai_resolution_rate}%`}
                            change="+5,4% de melhoria"
                            changeType="positive"
                            icon={<Zap className="w-6 h-6" />}
                            iconColor="green"
                        />
                        <KPICard
                            label="Tempo Médio"
                            value={kpis.avg_time}
                            change="-8% mais rápido que a média"
                            changeType="positive"
                            icon={<Clock className="w-6 h-6" />}
                            iconColor="orange"
                        />
                    </div>

                    {/* Volume Chart */}
                    <div className="mb-8">
                        <VolumeChart data={stats?.volume_chart} />
                    </div>

                    {/* Recent Chats Table */}
                    <RecentChatsTable />
                </div>
            </main>
        </div>
    );
}
