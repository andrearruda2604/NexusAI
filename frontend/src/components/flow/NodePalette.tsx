"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, GripVertical, Search } from "lucide-react";
import {
    nodeTemplates,
    categoryLabels,
    categoryColors,
    type NodeTemplate,
} from "./FlowNodes";

interface NodePaletteProps {
    onDragStart?: (event: React.DragEvent, template: NodeTemplate) => void;
}

export default function NodePalette({ onDragStart }: NodePaletteProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        trigger: true,
        condition: true,
        action: true,
        integration: false,
        data: false,
        logic: false,
    });

    const toggleCategory = (cat: string) => {
        setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
    };

    const filteredTemplates = nodeTemplates.filter(
        (t) =>
            t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = Object.keys(categoryLabels);

    const handleDragStart = (event: React.DragEvent, template: NodeTemplate) => {
        event.dataTransfer.setData("application/reactflow", JSON.stringify(template));
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(event, template);
    };

    return (
        <div className="w-[240px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Nós</h3>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar nós..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                    />
                </div>
            </div>

            {/* Node list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                {categories.map((cat) => {
                    const catNodes = filteredTemplates.filter((t) => t.category === cat);
                    if (catNodes.length === 0) return null;

                    return (
                        <div key={cat}>
                            {/* Category header */}
                            <button
                                onClick={() => toggleCategory(cat)}
                                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                {openCategories[cat] ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                )}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${categoryColors[cat]}`}>
                                    {categoryLabels[cat]}
                                </span>
                                <span className="ml-auto text-slate-300 text-[10px]">{catNodes.length}</span>
                            </button>

                            {/* Nodes */}
                            {openCategories[cat] && (
                                <div className="ml-2 space-y-0.5 mb-1">
                                    {catNodes.map((template) => (
                                        <div
                                            key={template.nodeType}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, template)}
                                            className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                                        >
                                            <GripVertical className="w-3 h-3 text-slate-300 group-hover:text-slate-400 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-slate-700 truncate">{template.label}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{template.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
