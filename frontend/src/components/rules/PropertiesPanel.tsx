"use client";

import { X } from "lucide-react";

interface PropertiesPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PropertiesPanel({ isOpen, onClose }: PropertiesPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="w-[320px] bg-white border-l border-slate-200 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Propriedades</h3>
                <button
                    onClick={onClose}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Empty State */}
            <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                        />
                    </svg>
                </div>
                <p className="text-sm text-slate-500">
                    Selecione um card para editar suas propriedades específicas.
                </p>
            </div>

            {/* Global Variables */}
            <div className="px-6 py-4 border-t border-slate-200">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">
                    Variáveis Globais
                </h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">idioma_usuario</span>
                        <span className="text-sm font-medium text-blue-600">PT_BR</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">horario_local</span>
                        <span className="text-sm font-medium text-blue-600">UTC-3</span>
                    </div>
                </div>
            </div>

            {/* Validate Button */}
            <div className="px-6 py-4">
                <button className="w-full btn btn-primary py-3">
                    Validar Lógica
                </button>
            </div>
        </div>
    );
}
