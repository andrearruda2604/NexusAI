"use client";

import { Filter, Plus } from "lucide-react";

interface ConditionNodeProps {
    title: string;
    attribute: string;
    operator: string;
    value: string;
    listName?: string;
}

export default function ConditionNode({
    title,
    attribute,
    operator,
    value,
    listName,
}: ConditionNodeProps) {
    return (
        <div className="w-[280px] bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-800 rounded text-white text-xs font-medium">
                    SE
                </div>
                <span className="text-sm font-medium text-slate-700">CONDIÇÃO</span>
                <div className="ml-auto">
                    <Filter className="w-4 h-4 text-slate-400" />
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">
                        Atributo
                    </label>
                    <div className="mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                        {attribute}
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">
                        Operador
                    </label>
                    <div className="mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                        {operator}
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">
                        Valor
                    </label>
                    {listName ? (
                        <div className="mt-1 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-blue-500">≡</span>
                            <span className="text-sm text-blue-700 font-medium">
                                {listName}
                            </span>
                        </div>
                    ) : (
                        <div className="mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                            {value}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
