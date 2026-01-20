"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type WebSocketContextType = {
    isConnected: boolean;
    lastMessage: any;
    sendMessage: (message: any) => void;
};

const WebSocketContext = createContext<WebSocketContextType>({
    isConnected: false,
    lastMessage: null,
    sendMessage: () => { },
});

export const useWebSocket = () => useContext(WebSocketContext);

// Use a fixed client ID for demo purposes, or generate one
const CLIENT_ID = "demo-client-123";
// Ensure we use the correct port (8002 as configured)
const WS_URL = "ws://localhost:8002/ws";

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}/${CLIENT_ID}`);

        ws.onopen = () => {
            console.log("WebSocket Connected");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WS Message:", data);
                setLastMessage(data);
            } catch (error) {
                console.error("WS Parse Error:", error);
            }
        };

        ws.onclose = () => {
            console.log("WebSocket Disconnected");
            setIsConnected(false);
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    const sendMessage = (message: any) => {
        if (socket && isConnected) {
            socket.send(JSON.stringify(message));
        }
    };

    return (
        <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};
