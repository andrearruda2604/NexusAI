"use client";

import { useState } from "react";
import { Sidebar, Header } from "@/components/layout";
import {
    Upload,
    Globe,
    FileText,
    Check,
    Loader2,
    AlertCircle,
    Trash2,
    RefreshCw,
} from "lucide-react";

interface Document {
    id: string;
    name: string;
    type: "pdf" | "docx" | "csv" | "url";
    status: "processing" | "ready" | "error";
    fragments: number;
    uploadedAt: string;
}

const mockDocuments: Document[] = [
    {
        id: "1",
        name: "Manual do Produto v2.pdf",
        type: "pdf",
        status: "ready",
        fragments: 342,
        uploadedAt: "há 2 dias",
    },
    {
        id: "2",
        name: "FAQ Atendimento.docx",
        type: "docx",
        status: "ready",
        fragments: 128,
        uploadedAt: "há 5 dias",
    },
    {
        id: "3",
        name: "https://empresa.com/suporte",
        type: "url",
        status: "processing",
        fragments: 0,
        uploadedAt: "Agora",
    },
    {
        id: "4",
        name: "Preços e Planos.csv",
        type: "csv",
        status: "error",
        fragments: 0,
        uploadedAt: "há 1 hora",
    },
];

const statusConfig = {
    processing: {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: "Processando",
        class: "text-blue-600 bg-blue-50",
    },
    ready: {
        icon: <Check className="w-4 h-4" />,
        text: "Pronto",
        class: "text-green-600 bg-green-50",
    },
    error: {
        icon: <AlertCircle className="w-4 h-4" />,
        text: "Erro",
        class: "text-red-600 bg-red-50",
    },
};

export default function BaseConhecimento() {
    const [url, setUrl] = useState("");
    const [dragActive, setDragActive] = useState(false);

    const totalFragments = mockDocuments
        .filter((d) => d.status === "ready")
        .reduce((sum, d) => sum + d.fragments, 0);
    const maxFragments = 10000;
    const progress = (totalFragments / maxFragments) * 100;

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar />
            <main className="ml-[260px]">
                <Header title="Base de Conhecimento" />
                <div className="p-8">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="card p-6">
                            <p className="text-sm text-slate-500 mb-1">Documentos Indexados</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {mockDocuments.filter((d) => d.status === "ready").length}
                            </p>
                        </div>
                        <div className="card p-6">
                            <p className="text-sm text-slate-500 mb-1">Total de Fragmentos</p>
                            <p className="text-2xl font-bold text-slate-900">{totalFragments.toLocaleString()}</p>
                        </div>
                        <div className="card p-6">
                            <p className="text-sm text-slate-500 mb-2">Capacidade Utilizada</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                    {progress.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        {/* Upload Center */}
                        <div className="card">
                            <div className="card-header">Upload de Arquivos</div>
                            <div className="card-body">
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-slate-300 hover:border-blue-400"
                                        }`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragActive(true);
                                    }}
                                    onDragLeave={() => setDragActive(false)}
                                    onDrop={() => setDragActive(false)}
                                >
                                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <p className="font-medium text-slate-700 mb-1">
                                        Arraste arquivos aqui
                                    </p>
                                    <p className="text-sm text-slate-500 mb-4">
                                        ou clique para selecionar
                                    </p>
                                    <button className="btn btn-primary">Selecionar Arquivos</button>
                                    <p className="text-xs text-slate-400 mt-4">
                                        PDF, DOCX, TXT, CSV • Máximo 50MB por arquivo
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* URL Crawler */}
                        <div className="card">
                            <div className="card-header">Escanear Website</div>
                            <div className="card-body">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mb-4">
                                    <Globe className="w-6 h-6 text-slate-400" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-700">URL Crawler</p>
                                        <p className="text-xs text-slate-500">
                                            Insira a URL do seu site para extrair conteúdo automaticamente
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="url"
                                        placeholder="https://empresa.com"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="input flex-1"
                                    />
                                    <button className="btn btn-primary">Escanear</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents List */}
                    <div className="card">
                        <div className="card-header flex items-center justify-between">
                            <span>Documentos Indexados</span>
                            <button className="btn btn-ghost text-sm">
                                <RefreshCw className="w-4 h-4" />
                                Atualizar
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Documento</th>
                                        <th>Tipo</th>
                                        <th>Status</th>
                                        <th>Fragmentos</th>
                                        <th>Upload</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockDocuments.map((doc) => {
                                        const status = statusConfig[doc.status];
                                        return (
                                            <tr key={doc.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-slate-400" />
                                                        <span className="font-medium">{doc.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-sm text-slate-500 uppercase">
                                                        {doc.type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${status.class}`}
                                                    >
                                                        {status.icon}
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="text-slate-600">
                                                    {doc.fragments > 0 ? doc.fragments.toLocaleString() : "-"}
                                                </td>
                                                <td className="text-slate-500 text-sm">{doc.uploadedAt}</td>
                                                <td>
                                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
