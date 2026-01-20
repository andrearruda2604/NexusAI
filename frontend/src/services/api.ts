import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";

export const api = {
    chat: {
        list: async (organizationId: string, status?: string) => {
            // Backend call
            const url = new URL(`${API_URL}/chat/conversations`);
            url.searchParams.append("organization_id", organizationId);
            if (status) url.searchParams.append("status", status);

            const response = await fetch(url.toString());
            if (!response.ok) throw new Error("Failed to fetch conversations");
            return response.json();
        },

        get: async (id: string) => {
            const response = await fetch(`${API_URL}/chat/conversations/${id}`);
            if (!response.ok) throw new Error("Failed to fetch conversation");
            return response.json();
        },

        getMessages: async (id: string) => {
            const response = await fetch(`${API_URL}/chat/conversations/${id}/messages`);
            if (!response.ok) throw new Error("Failed to fetch messages");
            return response.json();
        },

        sendMessage: async (id: string, content: string, sender: "client" | "agent" = "client") => {
            const response = await fetch(`${API_URL}/chat/conversations/${id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversation_id: id, content, sender }),
            });
            if (!response.ok) throw new Error("Failed to send message");
            return response.json();
        },

        create: async (data: { organization_id: string; client_phone: string; client_name?: string; channel: string }) => {
            const response = await fetch(`${API_URL}/chat/conversations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to create conversation");
            return response.json();
        },
    },

    rules: {
        list: async (organizationId: string) => {
            const url = new URL(`${API_URL}/rules/`);
            url.searchParams.append("organization_id", organizationId);
            const response = await fetch(url.toString());
            if (!response.ok) throw new Error("Failed to fetch rules");
            return response.json();
        },
        get: async (id: string) => {
            const response = await fetch(`${API_URL}/rules/${id}`);
            if (!response.ok) throw new Error("Failed to fetch rule");
            return response.json();
        },
        create: async (data: any) => {
            const response = await fetch(`${API_URL}/rules/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to create rule");
            return response.json();
        },
        update: async (id: string, data: any) => {
            const response = await fetch(`${API_URL}/rules/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to update rule");
            return response.json();
        },
        delete: async (id: string) => {
            const response = await fetch(`${API_URL}/rules/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete rule");
            return response.json();
        },
        toggle: async (id: string) => {
            const response = await fetch(`${API_URL}/rules/${id}/toggle`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to toggle rule");
            return response.json();
        }
    },
    documents: {
        upload: async (organizationId: string, file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("organization_id", organizationId);

            const response = await fetch(`${API_URL}/documents/upload`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error("Failed to upload document");
            return response.json();
        },
        list: async (organizationId: string) => {
            const url = new URL(`${API_URL}/documents/`);
            url.searchParams.append("organization_id", organizationId);
            const response = await fetch(url.toString());
            if (!response.ok) throw new Error("Failed to list documents");
            return response.json();
        },
    },

    dashboard: {
        stats: async (organizationId: string) => {
            const url = new URL(`${API_URL}/dashboard/stats`);
            url.searchParams.append("organization_id", organizationId);
            const response = await fetch(url.toString());
            if (!response.ok) throw new Error("Failed to fetch dashboard stats");
            return response.json();
        }
    },

    // Helpers to use Supabase client directly when needed (e.g. real-time)
    supabase
};
