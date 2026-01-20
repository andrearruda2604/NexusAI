"use client";

import { useState, useEffect } from "react";
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
import { api } from "@/services/api";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

const statusConfig: any = {
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
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const data = await api.documents.list(DEMO_ORG_ID);
            setDocuments(data || []);
        } catch (error) {
            console.error("Error loading documents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validação de tipo
        const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv'];
        const allowedExtensions = ['.txt', '.pdf', '.docx', '.csv'];
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
            alert('Tipo de arquivo não suportado. Use: TXT, PDF, DOCX ou CSV');
            return;
        }

        // Validação de tamanho (50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Arquivo muito grande. Tamanho máximo: 50MB');
            return;
        }

        setIsUploading(true);

        try {
            await api.documents.upload(DEMO_ORG_ID, file, {
                accessLevel: 'organization'
            });
            await loadDocuments(); // Refresh list
            alert('Documento enviado com sucesso!');
        } catch (error: any) {
            console.error("Error uploading document:", error);
            alert(error.message || "Erro ao fazer upload do arquivo.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleUrlCrawl = async () => {
        if (!url) return;

        // Validar URL
        try {
            new URL(url);
        } catch {
            alert('URL inválida. Use o formato: https://exemplo.com');
            return;
        }

        setIsUploading(true);

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api'}/documents/crawl`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organization_id: DEMO_ORG_ID,
                    url: url
                })
            });

            setUrl('');
            await loadDocuments();
            alert('URL enviada para processamento!');
        } catch (error) {
            console.error("Error crawling URL:", error);
            alert("Erro ao processar URL.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (documentId: string) => {
        if (!confirm('Tem certeza que deseja excluir este documento?')) {
            return;
        }

        try {
            await api.documents.delete(documentId);
            await loadDocuments();
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Erro ao excluir documento.");
        }
    };

    const totalFragments = documents
        .filter((d) => d.status === "ready")
        .reduce((sum, d) => sum + (d.fragments || 0), 0);
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
                                {documents.filter((d) => d.status === "ready").length}
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
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragActive(false);
                                        handleFileUpload(e.dataTransfer.files);
                                    }}
                                >
                                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <p className="font-medium text-slate-700 mb-1">
                                        Arraste arquivos aqui
                                    </p>
                                    <p className="text-sm text-slate-500 mb-4">
                                        ou clique para selecionar
                                    </p>
                                    <input
                                        type="file"
                                        id="fileInput"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e.target.files)}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => document.getElementById("fileInput")?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? "Enviando..." : "Selecionar Arquivos"}
                                    </button>
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
                                    <button className="btn btn-primary" onClick={handleUrlCrawl}>Escanear</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents List */}
                    <div className="card">
                        <div className="card-header flex items-center justify-between">
                            <span>Documentos Indexados</span>
                            <button className="btn btn-ghost text-sm" onClick={loadDocuments}>
                                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
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
                                    {documents.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-slate-500">
                                                Nenhum documento indexado.
                                            </td>
                                        </tr>
                                    ) : (
                                        documents.map((doc) => {
                                            const status = statusConfig[doc.status] || statusConfig.processing;
                                            return (
                                                <tr key={doc.id}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="w-5 h-5 text-slate-400" />
                                                            <span className="font-medium">{doc.filename || doc.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="text-sm text-slate-500 uppercase">
                                                            {doc.file_type?.split("/")[1] || "DOC"}
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
                                                    <td className="text-slate-500 text-sm">
                                                        {new Date(doc.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            onClick={() => handleDeleteDocument(doc.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
