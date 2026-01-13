import { Sidebar, Header } from "@/components/layout";
import { KPICard, VolumeChart, RecentChatsTable } from "@/components/dashboard";
import { MessageSquare, Zap, Clock } from "lucide-react";

export default function Dashboard() {
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
                            value="12.840"
                            change="+12% vs mês anterior"
                            changeType="positive"
                            icon={<MessageSquare className="w-6 h-6" />}
                            iconColor="blue"
                        />
                        <KPICard
                            label="Taxa de Resolução IA"
                            value="84,2%"
                            change="+5,4% de melhoria"
                            changeType="positive"
                            icon={<Zap className="w-6 h-6" />}
                            iconColor="green"
                        />
                        <KPICard
                            label="Tempo Médio"
                            value="1m 45s"
                            change="-8% mais rápido que a média"
                            changeType="positive"
                            icon={<Clock className="w-6 h-6" />}
                            iconColor="orange"
                        />
                    </div>

                    {/* Volume Chart */}
                    <div className="mb-8">
                        <VolumeChart />
                    </div>

                    {/* Recent Chats Table */}
                    <RecentChatsTable />
                </div>
            </main>
        </div>
    );
}
