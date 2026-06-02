"use client";

import { useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, Controls, MiniMap, Node, Edge, addEdge, Connection,
  useNodesState, useEdgesState, MarkerType, Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// گره کاستوم (بدون تغییر)
const CustomNode = ({ data }: any) => {
  const stepData = data.stepData;
  const choices = stepData?.config?.choices || [];
  const isModal = stepData?.action_detail?.code === 'SHOW_RESOLUTION_MODAL';

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm w-56 text-right dir-rtl relative hover:border-blue-400 transition-colors" dir="rtl">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-300 border-2 border-white" />
      <div className="flex items-center justify-between mb-2 mt-1">
        <span className="text-sm font-black text-slate-800">{data.title}</span>
        {data.isStart && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />}
      </div>
      <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mb-2">
        {data.actionCode}
      </p>
      {isModal && choices.length > 0 ? (
        <div className="flex flex-col gap-1.5 mt-2 border-t border-slate-100 pt-3">
          <span className="text-[9px] text-slate-400 font-bold mb-1">گزینه‌های خروجی:</span>
          {choices.map((choice: any) => (
            <div key={choice.id} className="relative bg-slate-50 border border-slate-100 rounded-md p-1.5 text-[10px] font-bold text-slate-600 text-center">
              {choice.label}
              <Handle type="source" position={Position.Bottom} id={choice.id} className="w-2.5 h-2.5 bg-indigo-500" />
            </div>
          ))}
        </div>
      ) : (
        <Handle type="source" position={Position.Bottom} id="default" className="w-3 h-3 bg-blue-500 border-2 border-white" />
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

export default function WorkflowCanvas({ 
  workflow, onNodeClick, onNodeDragStop, onEdgeCreate, onEdgeDelete // 🌟 تابع حذف مسیر اضافه شد
}: { 
  workflow: any, 
  onNodeClick: (stepData: any) => void,
  onNodeDragStop: (stepData: any, newPosition: {x: number, y: number}) => void,
  onEdgeCreate: (sourceId: string, targetId: string, handleId: string) => void,
  onEdgeDelete: (routeId: string) => void // 🌟
}) {
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!workflow || !workflow.steps) return;
    const validStepIds = new Set(workflow.steps.map((s: any) => s.id.toString()));

    const mappedNodes: Node[] = workflow.steps.map((step: any, index: number) => ({
      id: step.id.toString(),
      type: 'custom',
      position: step.config?.position || { x: 250, y: index * 150 + 50 },
      data: { 
        title: step.title, 
        actionCode: step.action_detail?.title || "بدون اکشن",
        isStart: step.is_start_node,
        stepData: step 
      },
    }));

    const mappedEdges: Edge[] = (workflow.routes || [])
      .filter((route: any) => validStepIds.has(route.from_step.toString()) && validStepIds.has(route.to_step.toString()))
      .map((route: any) => {
        const fromStep = workflow.steps.find((s:any) => s.id === route.from_step);
        let labelName = "";
        if (route.condition_value && fromStep?.config?.choices) {
          const choice = fromStep.config.choices.find((c:any) => c.id === route.condition_value);
          if (choice) labelName = choice.label;
        }

        return {
          id: route.id.toString(), // 🌟 شناسه مسیر را دقیقاً برابر ID دیتابیس گذاشتیم
          source: route.from_step.toString(),
          target: route.to_step.toString(),
          sourceHandle: route.condition_value || 'default',
          label: labelName, 
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          labelStyle: { fontFamily: 'Vazirmatn, sans-serif', fontWeight: 'bold', fill: '#475569', fontSize: 11 },
          labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9, rx: 4, ry: 4 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
        }
      });

    setNodes(mappedNodes);
    setEdges(mappedEdges);
  }, [workflow, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
      if (params.source && params.target && params.sourceHandle) {
        onEdgeCreate(params.source, params.target, params.sourceHandle);
      }
    },
    [setEdges, onEdgeCreate]
  );

  // 🌟 تابع حذف مسیرها (با کلید Delete/Backspace کیبورد)
  const onEdgesDeleted = useCallback(
    (deletedEdges: Edge[]) => {
      deletedEdges.forEach((edge) => {
        onEdgeDelete(edge.id);
      });
    },
    [onEdgeDelete]
  );

  return (
    <div style={{ width: '100%', height: '600px' }} className="bg-slate-50/50 rounded-3xl border border-slate-200/60 relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDeleted} // 🌟 فعال‌سازی حذف با کیبورد
        onEdgeDoubleClick={(event, edge) => {
          // 🌟 امکان حذف فلش با دابل‌کلیک روی آن
          if (window.confirm("آیا از حذف این مسیر اطمینان دارید؟")) {
            onEdgeDelete(edge.id);
          }
        }}
        nodeTypes={nodeTypes}
        onNodeClick={(event, node) => onNodeClick(node.data.stepData)} 
        onNodeDragStop={(event, node) => onNodeDragStop(node.data.stepData, node.position)}
        fitView 
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background color="#cbd5e1" gap={20} size={2} />
        <Controls className="bg-white border-slate-200 shadow-sm mb-4 ml-4" />
        <MiniMap className="bg-slate-50 rounded-xl border border-slate-200" nodeColor="#94a3b8" maskColor="rgba(248, 250, 252, 0.8)" />
      </ReactFlow>

      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
        <div className="bg-blue-50/90 backdrop-blur px-3 py-2 rounded-xl text-[10px] font-bold text-blue-600 border border-blue-100 shadow-sm">
          💡 برای حذف اتصال (فلش): روی آن دابل‌کلیک کنید یا با کیبورد Delete بزنید.
        </div>
      </div>
    </div>
  );
}