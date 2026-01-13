"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const weeklyData = [
    { name: "SEG", value: 1200 },
    { name: "TER", value: 1800 },
    { name: "QUA", value: 2400 },
    { name: "QUI", value: 2100 },
    { name: "SEX", value: 3200 },
    { name: "SÁB", value: 2800 },
    { name: "DOM", value: 1900 },
];

const dailyData = [
    { name: "00h", value: 120 },
    { name: "04h", value: 80 },
    { name: "08h", value: 340 },
    { name: "12h", value: 520 },
    { name: "16h", value: 680 },
    { name: "20h", value: 420 },
    { name: "23h", value: 180 },
];

const monthlyData = [
    { name: "Sem 1", value: 12400 },
    { name: "Sem 2", value: 15800 },
    { name: "Sem 3", value: 18200 },
    { name: "Sem 4", value: 21000 },
];

type Period = "Dia" | "Semana" | "Mês";

const dataByPeriod: Record<Period, typeof weeklyData> = {
    Dia: dailyData,
    Semana: weeklyData,
    Mês: monthlyData,
};

export default function VolumeChart() {
    const [period, setPeriod] = useState<Period>("Semana");

    return (
        <div className="card animate-fade-in">
            <div className="flex items-center justify-between p-6 pb-0">
                <div>
                    <h3 className="font-semibold text-slate-900">Volume de Mensagens</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Análise diária de tráfego de entrada em tempo real
                    </p>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    {(["Dia", "Semana", "Mês"] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${period === p
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-6 pt-4">
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={dataByPeriod[period]}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "#1e293b",
                                border: "none",
                                borderRadius: "8px",
                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            }}
                            labelStyle={{ color: "#94a3b8" }}
                            itemStyle={{ color: "#fff" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
