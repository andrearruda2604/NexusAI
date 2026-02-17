"use client";

import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import {
    ArrowLeft,
    HelpCircle,
    BookOpen,
    MessageCircle,
    Mail,
    Video,
    ExternalLink,
    FileQuestion,
    Lightbulb,
} from "lucide-react";

const resources = [
    {
        title: "Documentação",
        description: "Guia completo de todas as funcionalidades da plataforma",
        icon: BookOpen,
        color: "text-blue-600",
        bg: "bg-blue-50",
        link: "#",
    },
    {
        title: "Tutoriais em Vídeo",
        description: "Aprenda passo a passo com vídeos explicativos",
        icon: Video,
        color: "text-purple-600",
        bg: "bg-purple-50",
        link: "#",
    },
    {
        title: "FAQ",
        description: "Respostas para as perguntas mais frequentes",
        icon: FileQuestion,
        color: "text-amber-600",
        bg: "bg-amber-50",
        link: "#",
    },
    {
        title: "Dicas e Boas Práticas",
        description: "Aproveite ao máximo a Nexus AI",
        icon: Lightbulb,
        color: "text-green-600",
        bg: "bg-green-50",
        link: "#",
    },
];

const faqs = [
    {
        question: "Como adicionar documentos à Base de Conhecimento?",
        answer: "Acesse a página 'Conhecimento' no menu lateral e clique em 'Upload de Arquivo'. Você pode enviar PDFs, documentos Word e arquivos de texto. A IA processará automaticamente o conteúdo.",
    },
    {
        question: "Como a IA utiliza a base de conhecimento?",
        answer: "Quando um cliente envia uma mensagem, a IA busca automaticamente informações relevantes nos documentos e websites cadastrados para gerar respostas precisas e contextualizadas.",
    },
    {
        question: "Como integrar o WhatsApp?",
        answer: "Acesse 'Integrações' no menu lateral, clique em 'WhatsApp Business' e siga o passo a passo para conectar seu número. É necessário ter uma conta WhatsApp Business API.",
    },
    {
        question: "Posso personalizar o comportamento da IA?",
        answer: "Sim! Em Configurações > Empresa, você pode configurar o 'Prompt da IA' que define o tom, estilo e regras de resposta do assistente virtual.",
    },
    {
        question: "Como funcionam as regras de negócio?",
        answer: "As regras de negócio permitem automatizar ações baseadas em condições como palavras-chave, sentimento do cliente ou horário. Acesse 'Regras' no menu lateral para configurar.",
    },
];

export default function AjudaPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar />
            <main className="ml-[260px]">
                <Header title="Configurações" />
                <div className="p-8 max-w-3xl">
                    <button
                        onClick={() => router.push("/configuracoes")}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Voltar às Configurações</span>
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <HelpCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Como podemos ajudar?</h2>
                        <p className="text-slate-500 mt-1">Encontre respostas e recursos para usar a Nexus AI</p>
                    </div>

                    {/* Resources Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {resources.map((resource) => (
                            <a
                                key={resource.title}
                                href={resource.link}
                                className="card p-5 hover:shadow-md transition-shadow group"
                            >
                                <div className={`w-10 h-10 ${resource.bg} rounded-lg flex items-center justify-center mb-3`}>
                                    <resource.icon className={`w-5 h-5 ${resource.color}`} />
                                </div>
                                <h3 className="font-medium text-slate-900 flex items-center gap-1">
                                    {resource.title}
                                    <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">{resource.description}</p>
                            </a>
                        ))}
                    </div>

                    {/* FAQ */}
                    <div className="card mb-6">
                        <div className="card-header flex items-center gap-3">
                            <FileQuestion className="w-5 h-5 text-blue-600" />
                            <span>Perguntas Frequentes</span>
                        </div>
                        <div className="card-body divide-y divide-slate-100">
                            {faqs.map((faq, i) => (
                                <details key={i} className="py-4 group">
                                    <summary className="font-medium text-slate-900 cursor-pointer hover:text-blue-600 transition-colors list-none flex items-center justify-between">
                                        {faq.question}
                                        <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                                    </summary>
                                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{faq.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* Contact Support */}
                    <div className="card">
                        <div className="card-body text-center py-8">
                            <p className="text-slate-600 mb-4">Não encontrou o que procurava?</p>
                            <div className="flex items-center justify-center gap-4">
                                <a
                                    href="mailto:suporte@nexusai.com.br"
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <Mail className="w-4 h-4" />
                                    Enviar Email
                                </a>
                                <a
                                    href="#"
                                    className="btn btn-secondary flex items-center gap-2"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Chat de Suporte
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
