'use client';

import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeProps,
  // 核心修正：导入正确的类型
  Connection, // 手动连线时的临时连接类型（无 id）
  OnConnect,  // onConnect 回调的类型
} from 'reactflow';
import 'reactflow/dist/style.css';



// 2. 核心组件（完全符合 TS 规范）
export default function BasicReactFlowTree() {
  // 初始节点（TS 类型明确）
  const initialNodes: Node[] = [
    {
      id: '1',
      type: 'default',
      position: { x: 500, y: 50 },
      data: { label: '根节点 - React Flow 基础' },
    },
    {
      id: '2',
      type: 'default',
      position: { x: 300, y: 200 },
      data: { label: '核心概念'},
    },
    {
      id: '3',
      type: 'default',
      position: { x: 700, y: 200 },
      data: { label: '常用功能'},
    },
    {
      id: '4',
      type: 'default',
      position: { x: 100, y: 350 },
      data: { label: '节点（Nodes）' },
    },
    {
      id: '5',
      type: 'default',
      position: { x: 500, y: 350 },
      data: { label: '连线（Edges）' },
    },
    {
      id: '6',
      type: 'default',
      position: { x: 900, y: 350 },
      data: { label: '交互控制' },
    },
  ];

  // 初始连线（TS 类型明确）
  const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '4' },
    { id: 'e1-3', source: '1', target: '3' },
    { id: 'e2-4', source: '2', target: '4' },
    { id: 'e2-5', source: '2', target: '5' },
    { id: 'e3-6', source: '3', target: '6' },
  ];

  // 3. 状态管理（React Flow 内置 Hooks）
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 4. 修复核心：onConnect 回调（TS 类型完全匹配）
  // Connection 类型：手动连线时的临时信息（source/target，无 id）
  // addEdge 工具函数：自动生成 id，将 Connection 转为完整的 Edge
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // 关键：addEdge 会自动为新连线生成唯一 id，符合 Edge 类型要求
      setEdges((existingEdges) => addEdge(connection, existingEdges));
    },
    [setEdges] // 依赖数组仅包含 setEdges，符合 hooks 规范
  );

  // 替换原 return 部分，其余代码保持不变
    return (
    // 核心修改：使用 fixed 定位 + overflow: hidden 消除滚动条
    <div style={{ 
        position: 'fixed', // 固定定位，占满可视区域
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden', // 隐藏溢出内容，消除滚动条
    }}>
        <ReactFlow
        // 核心属性（TS 类型匹配）
        nodes={nodes}
        edges={edges}
        // 状态变更回调
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        // 基础交互配置
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        fitView={true}
        fitViewOptions={{ padding: 0.2 }}
        // 关键：React Flow 容器占满父容器
        style={{ width: '100%', height: '100%' }}
        >
        <Controls />
        <MiniMap />
        </ReactFlow>
    </div>
    );
}