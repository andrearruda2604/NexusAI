"use client";

import { Ban, UserCheck, ArrowRightLeft, Tag, Bell, MessageSquare } from "lucide-react";
import { ReactNode } from "react";

interface ActionNodeProps {
    type: "block" | "prioritize" | "transfer" | "tag" | "notify" | "auto_response";
    title: string;
    description: string;
}

const actionIcons: Record<ActionNodeProps["type"], ReactNode> = {
    block: <Ban className="w-6 h-6" />,
    prioritize: <UserCheck className="w-6 h-6" />,
    transfer: <ArrowRightLeft className="w-6 h-6" />,
    tag: <Tag className="w-6 h-6" />,
    notify: <Bell className="w-6 h-6" />,
    auto_response: <MessageSquare className="w-6 h-6" />,
};

const actionColors: Record<ActionNodeProps["type"], { bg: string; icon: string; border: string }> = {
    block: { bg: "bg-red-50", icon: "text-red-500", border: "border-red-200" },
    prioritize: { bg: "bg-blue-50", icon: "text-blue-500", border: "border-blue-200" },
    transfer: { bg: "bg-purple-50", icon: "text-purple-500", border: "border-purple-200" },
    tag: { bg: "bg-green-50", icon: "text-green-500", border: "border-green-200" },
    notify: { bg: "bg-orange-50", icon: "text-orange-500", border: "border-orange-200" },
    auto_response: { bg: "bg-cyan-50", icon: "text-cyan-500", border: "border-cyan-200" },
};

export default function ActionNode({ type, title, description }: ActionNodeProps) {
    const colors = actionColors[type];

    return (
        <div className={`w-[240px] ${colors.bg} border ${colors.border} rounded-xl shadow-sm hover:shadow-md transition-shadow`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-opacity-50" style={{ borderColor: colors.border }}>
                <div className="flex items-center gap-2 px-2 py-1 bg-green-500 rounded text-white text-xs font-medium">
                    ENTÃO
                </div>
                <span className="text-sm font-medium text-slate-700">AÇÃO</span>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full ${colors.bg} ${colors.icon} flex items-center justify-center mb-3`}>
                    {actionIcons[type]}
                </div>
                <h4 className="font-semibold text-slate-800">{title}</h4>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
        </div>
    );
}
