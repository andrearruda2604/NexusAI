"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Node,
    type Edge,
    ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { customNodeTypes } from "@/components/flow/FlowNodes";
import NodePalette from "@/components/flow/NodePalette";
import FlowPropertiesPanel from "@/components/flow/FlowPropertiesPanel";
import { api } from "@/services/api";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

function WorkflowEditorContent() {
    const params = useParams();
    const router = useRouter();
    const workflowId = params.id as string;
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [workflowName, setWorkflowName] = useState("");
    const [workflowDesc, setWorkflowDesc] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [hasUnsaved, setHasUnsaved] = useState(false);

    // Load workflow
    useEffect(() => {
        if (workflowId && workflowId !== "new") {
            loadWorkflow();
        } else {
            setIsLoading(false);
            setWorkflowName("Novo Workflow");
        }
    }, [workflowId]);

    const loadWorkflow = async () => {
        try {
            const data = await api.workflows.get(workflowId);
            setWorkflowName(data.name);
            setWorkflowDesc(data.description || "");
            setIsActive(data.is_active);
            if (data.nodes && data.nodes.length > 0) {
                setNodes(data.nodes);
            }
            if (data.edges && data.edges.length > 0) {
                setEdges(data.edges);
            }
        } catch (error) {
            console.error("Error loading workflow:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Connection handler
    const onConnect = useCallback(
        (connection: Connection) => {
            const newEdge: Edge = {
                id: `e_${connection.source}_${connection.target}_${Date.now()}`,
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle ?? undefined,
                targetHandle: connection.targetHandle ?? undefined,
                animated: true,
                style: { stroke: "#94a3b8", strokeWidth: 2 },
            };
            setEdges((eds) => [...eds, newEdge]);
            setHasUnsaved(true);
        },
        [setEdges]
    );

    // Node selection
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    // Update node data from properties panel
    const handleNodeUpdate = useCallback((nodeId: string, newData: Record<string, any>) => {
        setNodes((nds) =>
            nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n))
        );
        setSelectedNode((prev) => (prev && prev.id === nodeId ? { ...prev, data: newData } : prev));
        setHasUnsaved(true);
    }, [setNodes]);

    // Drag & drop from palette
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const templateData = event.dataTransfer.getData("application/reactflow");
            if (!templateData || !reactFlowInstance) return;

            const template = JSON.parse(templateData);
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `${template.nodeType}_${Date.now()}`,
                type: template.category,
                position,
                data: {
                    label: template.label,
                    category: template.category,
                    nodeType: template.nodeType,
                    description: template.description,
                    config: { ...template.defaultConfig },
                },
            };

            setNodes((nds) => [...nds, newNode]);
            setHasUnsaved(true);
        },
        [reactFlowInstance, setNodes]
    );

    // Delete selected node
    const handleDeleteNode = useCallback(() => {
        if (!selectedNode) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
        setHasUnsaved(true);
    }, [selectedNode, setNodes, setEdges]);

    // Save workflow
    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (workflowId === "new") {
                const created = await api.workflows.create({
                    organization_id: DEMO_ORG_ID,
                    name: workflowName,
                    description: workflowDesc,
                    nodes: nodes,
                    edges: edges,
                    is_active: isActive,
                });
                router.replace(`/regras/workflow/${created.id}`);
            } else {
                await api.workflows.update(workflowId, {
                    name: workflowName,
                    description: workflowDesc,
                    nodes: nodes,
                    edges: edges,
                    is_active: isActive,
                });
            }
            setHasUnsaved(false);
        } catch (error) {
            console.error("Error saving workflow:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle active
    const handleToggle = () => {
        setIsActive(!isActive);
        setHasUnsaved(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Top toolbar */}
            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/regras")}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => { setWorkflowName(e.target.value); setHasUnsaved(true); }}
                        className="text-lg font-semibold text-slate-900 bg-transparent border-none outline-none focus:bg-slate-50 focus:px-2 rounded transition-all w-64"
                        placeholder="Nome do workflow"
                    />
                    {hasUnsaved && (
                        <span className="text-xs text-amber-500 font-medium">• Não salvo</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle active */}
                    <button
                        onClick={handleToggle}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                    >
                        {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {isActive ? "Ativo" : "Inativo"}
                    </button>

                    {/* Delete selected node */}
                    {selectedNode && (
                        <button
                            onClick={handleDeleteNode}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Excluir Nó
                        </button>
                    )}

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? "Salvando..." : "Salvar"}
                    </button>
                </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Palette */}
                <NodePalette />

                {/* Canvas */}
                <div className="flex-1 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={(changes) => { onNodesChange(changes); setHasUnsaved(true); }}
                        onEdgesChange={(changes) => { onEdgesChange(changes); setHasUnsaved(true); }}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={customNodeTypes}
                        fitView
                        snapToGrid
                        snapGrid={[16, 16]}
                        defaultEdgeOptions={{
                            animated: true,
                            style: { stroke: "#94a3b8", strokeWidth: 2 },
                        }}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Controls
                            className="!bg-white !border !border-slate-200 !rounded-xl !shadow-lg"
                            showInteractive={false}
                        />
                        <MiniMap
                            className="!bg-white !border !border-slate-200 !rounded-xl !shadow-lg"
                            nodeStrokeWidth={3}
                            pannable
                            zoomable
                        />
                        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
                    </ReactFlow>
                </div>

                {/* Properties panel */}
                {selectedNode && (
                    <FlowPropertiesPanel
                        node={selectedNode}
                        onClose={() => setSelectedNode(null)}
                        onUpdate={handleNodeUpdate}
                    />
                )}
            </div>
        </div>
    );
}

export default function WorkflowEditorPage() {
    return (
        <ReactFlowProvider>
            <WorkflowEditorContent />
        </ReactFlowProvider>
    );
}
