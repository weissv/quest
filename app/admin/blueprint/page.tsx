
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Wand2, Plus, Maximize } from 'lucide-react';
import dagre from 'dagre';
import QuestionNode from '../components/QuestionNode';
import QuestionForm from '../components/QuestionForm';

const nodeTypes = {
  questionNode: QuestionNode,
};

function BlueprintCanvas({ questions, setQuestions, initialNodes, initialEdges }: any) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const { fitView } = useReactFlow();

  const handleAutoLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 400, ranksep: 300 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 340, height: 250 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 340 / 2,
          y: nodeWithPosition.y - 250 / 2,
        },
      };
    });

    setNodes(layoutedNodes);
    setTimeout(() => fitView({ duration: 800 }), 50);
  }, [nodes, edges, setNodes, fitView]);

  const handleSaveGraph = async () => {
    const updatedQuestions = questions.map((q: any) => {
      const node = nodes.find(n => n.id === q.id);
      if (node) {
        return { ...q, position: node.position };
      }
      return q;
    });

    try {
      const res = await fetch('/api/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQuestions),
      });
      if (res.ok) {
        setQuestions(updatedQuestions);
        alert('Граф успешно сохранен!');
      } else {
        alert('Ошибка при сохранении графа');
      }
    } catch (e) {
      alert('Ошибка при сохранении графа');
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const isBranch = params.sourceHandle === 'branch-source' || params.targetHandle === 'branch-target';
      return setEdges((eds) => addEdge({ 
        ...params, 
        type: isBranch ? 'bezier' : 'smoothstep',
        animated: isBranch, 
        style: { stroke: isBranch ? '#A04A84' : '#4a3a3a', strokeWidth: 2 }, 
        markerEnd: { type: MarkerType.ArrowClosed, color: isBranch ? '#A04A84' : '#4a3a3a' },
        data: { isBranch }
      }, eds));
    },
    [setEdges],
  );

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setEditingData(node.data);
    setIsFormOpen(true);
  }, []);

  const handleAddNode = () => {
    setEditingData(null);
    setIsFormOpen(true);
  };

  const handleSaveNode = async (formData: any) => {
    setSaving(true);
    let updated;
    if (questions.find((q: any) => q.id === formData.id)) {
      updated = questions.map((q: any) => (q.id === formData.id ? formData : q));
    } else {
      updated = [...questions, formData];
    }
    
    try {
      const res = await fetch('/api/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setQuestions(updated);
        // We do a full reload to make sure edges are correctly re-rendered 
        // This is a simple approach for now
        window.location.reload();
      } else {
        alert('Ошибка при сохранении');
      }
    } catch (e) {
      alert('Ошибка при сохранении');
    }
    setSaving(false);
  };

  const styledEdges = useMemo(() => {
    if (!hoveredNodeId) {
      return edges.map(e => ({
        ...e,
        style: { 
          ...e.style, 
          opacity: 1, 
          strokeWidth: e.style?.strokeWidth || 2,
          strokeDasharray: e.data?.isBranch ? '5,5' : 'none'
        },
        animated: e.data?.isBranch ? true : false,
      }));
    }
    
    return edges.map(e => {
      const isConnected = e.source === hoveredNodeId || e.target === hoveredNodeId;
      return {
        ...e,
        style: {
          ...e.style,
          opacity: isConnected ? 1 : 0.15,
          strokeWidth: isConnected ? 3 : 1,
          filter: isConnected ? 'drop-shadow(0 0 8px rgba(160, 74, 132, 0.8))' : 'none',
          strokeDasharray: e.data?.isBranch ? '5,5' : 'none'
        },
        animated: isConnected,
      };
    });
  }, [edges, hoveredNodeId]);

  return (
    <>
      <div className="flex-1 border border-foreground-tertiary/20 rounded-2xl overflow-hidden glass-card relative animate-slide-up bg-surface" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        
        {/* Floating Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-surface-raised/90 backdrop-blur-md p-2 rounded-xl border border-foreground-tertiary/20 shadow-glass">
          <button onClick={() => fitView({ duration: 800 })} className="p-2 hover:bg-white/10 rounded-lg text-foreground-secondary hover:text-foreground transition-colors" title="Zoom to Fit">
            <Maximize className="w-5 h-5" />
          </button>
          <button onClick={handleAutoLayout} className="p-2 hover:bg-white/10 rounded-lg text-foreground-secondary hover:text-plum transition-colors" title="Auto-Layout">
            <Wand2 className="w-5 h-5" />
          </button>
          <button onClick={handleAddNode} className="p-2 hover:bg-white/10 rounded-lg text-foreground-secondary hover:text-success transition-colors" title="Добавить узел">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
          minZoom={0.1}
        >
          <Controls className="bg-surface-raised border border-foreground-tertiary/20 fill-foreground shadow-lg !mb-20 !ml-4" showInteractive={false} />
          <MiniMap 
            className="bg-surface-raised border border-foreground-tertiary/20 shadow-lg !mb-20 !mr-6 opacity-80 rounded-xl overflow-hidden" 
            nodeColor={(n) => {
               if (n.data?.block === '0') return '#00859E';
               if (n.data?.block === 'A') return '#57A7B3';
               if (n.data?.block === 'B') return '#FCD5A6';
               return '#A04A84';
            }} 
            maskColor="rgba(30, 21, 21, 0.7)"
          />
          <Background gap={24} size={1} color="rgba(255,255,255,0.05)" />
        </ReactFlow>

        {/* Floating Action Bar (FAB) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <button onClick={handleSaveGraph} className="flex items-center gap-2 px-6 py-3 bg-plum/20 hover:bg-plum/40 border border-plum/50 text-white font-bold rounded-full shadow-glow backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95" title="Сохранить текущее расположение узлов">
            <Save className="w-5 h-5" /> Сохранить граф
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl shadow-2xl">
            <QuestionForm 
              initialData={editingData} 
              onSave={handleSaveNode} 
              onCancel={() => {
                setIsFormOpen(false);
                setEditingData(null);
              }} 
              saving={saving} 
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function BlueprintPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [initialData, setInitialData] = useState<{nodes: Node[], edges: Edge[]} | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const generateGraph = useCallback((data: any[], filter: string | null) => {
    // Filter data based on activeFilter
    const filteredData = data.filter((q) => {
      if (!filter) return true; // All
      return !q.cohort || q.cohort === filter;
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yOffset = 50;
    const xOffsetMap: Record<string, number> = {};

    filteredData.forEach((q: any, idx: number) => {
      const block = q.block || '0';
      if (!xOffsetMap[block]) {
         xOffsetMap[block] = Object.keys(xOffsetMap).length * 450 + 50;
      }

      const x = q.position?.x ?? xOffsetMap[block];
      const y = q.position?.y ?? (yOffset + (idx * 220)) % 2000;

      nodes.push({
        id: q.id,
        type: 'questionNode',
        position: { x, y }, 
        data: { ...q },
      });

      // Create edges based on dependsOn
      if (q.dependsOn && q.dependsOn.questionId) {
         // Only add edge if target exists in filtered data
         if (filteredData.some(t => t.id === q.dependsOn.questionId)) {
           edges.push({
             id: `e-${q.dependsOn.questionId}-${q.id}`,
             source: q.dependsOn.questionId,
             target: q.id,
             sourceHandle: 'branch-source',
             targetHandle: 'branch-target',
             type: 'bezier',
             data: { isBranch: true },
             label: Array.isArray(q.dependsOn.value) ? q.dependsOn.value.join(' ИЛИ ') : q.dependsOn.value,
             style: { stroke: '#A04A84', strokeWidth: 2 },
             labelBgStyle: { fill: '#1E1515', fillOpacity: 0.9, stroke: '#A04A84', strokeWidth: 1, rx: 12, ry: 12 },
             labelBgPadding: [8, 4],
             labelStyle: { fill: '#f0f0f0', fontWeight: 700, fontSize: 10, letterSpacing: '1px' },
             markerEnd: {
               type: MarkerType.ArrowClosed,
               color: '#A04A84',
             },
           });
         }
      }
      
      // Connect to next question in same block if no explicit dependency
      const nextQ = filteredData[idx + 1];
      if (nextQ && nextQ.block === q.block && !nextQ.dependsOn) {
        edges.push({
           id: `seq-${q.id}-${nextQ.id}`,
           source: q.id,
           target: nextQ.id,
           sourceHandle: 'seq-source',
           targetHandle: 'seq-target',
           type: 'smoothstep',
           data: { isBranch: false },
           style: { stroke: '#4a3a3a', strokeWidth: 2 },
           markerEnd: {
             type: MarkerType.ArrowClosed,
             color: '#4a3a3a',
           },
        });
      }
    });

    // Automatically apply dagre layout on initial load or filter change
    const hasSavedPositions = filteredData.some((q: any) => q.position && q.position.x !== undefined);
    
    if (!hasSavedPositions || filter !== null) {
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({ rankdir: 'TB', nodesep: 400, ranksep: 300 });
      
      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 340, height: 250 });
      });
      
      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });
      
      dagre.layout(dagreGraph);
      
      nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.position = {
          x: nodeWithPosition.x - 340 / 2,
          y: nodeWithPosition.y - 250 / 2,
        };
      });
    }

    setInitialData({ nodes, edges });
  }, []);

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        generateGraph(data, activeFilter);
      });
  }, []);

  // Update graph when filter changes
  useEffect(() => {
    if (questions.length > 0) {
      generateGraph(questions, activeFilter);
    }
  }, [activeFilter, generateGraph]); // questions omitted deliberately or it will double render

  if (!initialData) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="w-12 h-12 rounded-full border-4 border-plum/20 border-t-plum animate-spin shadow-glow"></div>
    </div>
  );

  return (
    <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col animate-fade-in">
      <div className="flex justify-between items-end shrink-0 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div>
          <h1 className="text-4xl font-black tracking-tight sp-title"><span>Blueprint: Граф вопросов</span></h1>
          <div className="flex items-center gap-4 mt-3">
            <p className="text-foreground-secondary text-lg">Визуализация связей и логики ветвления анкеты</p>
            
            <div className="flex items-center gap-2 bg-surface-raised px-3 py-1.5 rounded-xl border border-foreground-tertiary/20 ml-4">
              <span className="text-sm font-bold text-foreground-tertiary uppercase tracking-wider">Когорта:</span>
              <select
                value={activeFilter || ''}
                onChange={(e) => setActiveFilter(e.target.value === '' ? null : e.target.value)}
                className="bg-transparent text-sm text-plum font-bold outline-none cursor-pointer"
              >
                <option value="">Все вопросы</option>
                <option value="GRADE_1_4">1-4 классы</option>
                <option value="GRADE_5_8">5-8 классы</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <ReactFlowProvider>
        <BlueprintCanvas 
          key={activeFilter || 'all'}
          questions={questions} 
          setQuestions={setQuestions} 
          initialNodes={initialData.nodes} 
          initialEdges={initialData.edges} 
        />
      </ReactFlowProvider>
    </div>
  );
}
