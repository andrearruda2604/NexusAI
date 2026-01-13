"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
    label: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative";
    icon: ReactNode;
    iconColor: "blue" | "green" | "orange";
}

export default function KPICard({
    label,
    value,
    change,
    changeType = "positive",
    icon,
    iconColor,
}: KPICardProps) {
    const iconBgColors = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        orange: "bg-orange-100 text-orange-600",
    };

    return (
        <div className="kpi-card animate-fade-in">
            <div>
                <p className="kpi-label">{label}</p>
                <p className="kpi-value">{value}</p>
                {change && (
                    <p className={`kpi-change flex items-center gap-1 ${changeType}`}>
                        {changeType === "positive" ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        {change}
                    </p>
                )}
            </div>
            <div className={`kpi-icon ${iconBgColors[iconColor]}`}>{icon}</div>
        </div>
    );
}
