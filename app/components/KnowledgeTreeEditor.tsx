'use client'; // Next.js 客户端组件标识（必须加）
import React, { useState, useCallback, useEffect, useRef } from 'react'; // 仅新增 useRef
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  OnNodeClick,
  OnNodeContextMenu,
  NodeProps,
  ReactFlowInstance, // 仅新增实例类型
  Handle, 
  Position,
} from 'reactflow';
// 移除 useReactFlow 引入（这是报错根源）
import 'reactflow/dist/style.css';

// 定义树形数据接口
interface TreeItem {
  id: string | number;
  name: string;
  children?: TreeItem[];
}

// 定义构建函数返回值接口
interface BuildTreeResult {
  nodes: Node[];
  edges: Edge[];
}

// 右键菜单状态接口
interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

// 递归构建节点和边的函数（完全保留你的代码）
const buildTreeNodes = (
  treeData: unknown,
  parentId: string | null = null,
  x: number = 400,
  y: number = 50,
  level: number = 0
): BuildTreeResult => {
  const validTreeData: TreeItem[] = Array.isArray(treeData)
    ? treeData.filter(item => item && typeof item === 'object' && 'id' in item && 'name' in item)
    : [];

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  validTreeData.forEach((item, index) => {
    const nodeId = `node-${String(item.id)}`;
    
    const node: Node = {
      id: nodeId,
      type: 'default',
      data: { label: item.name },
      position: { 
        x: x + (index - validTreeData.length / 2) * 150,
        y: y + level * 100 
      },
      style: {
        backgroundColor: ['#4285F4', '#34A853', '#FBBC05'][Math.min(level, 2)],
        color: level < 2 ? 'white' : 'black',
        borderRadius: '8px',
        padding: '10px 15px',
        border: 'none'
      },
      draggable: false,
    };
    
    nodes.push(node);
    
    if (parentId) {
      const edge: Edge = {
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: '#666', strokeWidth: 2 }
      };
      edges.push(edge);
    }
    
    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
      const { nodes: childNodes, edges: childEdges } = buildTreeNodes(
        item.children, 
        nodeId, 
        x, 
        y, 
        level + 1
      );
      nodes.push(...childNodes);
      edges.push(...childEdges);
    }
  });
  
  return { nodes, edges };
};

// 自定义可编辑节点组件（完全保留你的代码）
const EditableNode: React.FC<NodeProps> = ({ data, id }) => {
  const [inputValue, setInputValue] = useState(data.label || '新节点');
  const [isEditing, setIsEditing] = useState(true);

  const handleConfirm = () => {
    if (!inputValue.trim()) return;
    setIsEditing(false);
    window.dispatchEvent(
      new CustomEvent('nodeNameUpdated', { detail: { nodeId: id, name: inputValue.trim() } })
    );  
  };

  if (isEditing) {
    return (
      <div 
        style={{
          backgroundColor: '#FBBC05',
          color: 'black',
          borderRadius: '8px',
          padding: '10px 15px',
          border: '2px solid #d97706',
          position: 'relative', // ✅ 新增：锚点需要相对定位
        }}
      >
        {/* ✅ 新增：顶部输入锚点（子节点的输入点，接父节点的边） */}
        <Handle
          type="target" // 输入锚点（边的终点）
          position={Position.Top} // 顶部
          id={`${id}-top`} // 唯一ID
          style={{ background: '#000000', width: 8, height: 8 }} // 红色小方块，显眼
        />
        {/* ✅ 新增：底部输出锚点（子节点的输出点，连孙子节点） */}
        <Handle
          type="source" // 输出锚点（边的起点）
          position={Position.Bottom} // 底部
          id={`${id}-bottom`} // 唯一ID
          style={{ background: '#000000', width: 8, height: 8 }} // 红色小方块，显眼
        />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleConfirm}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          autoFocus
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: 'black',
            fontSize: '14px',
          }}
          placeholder="输入节点名称"
        />
      </div>
    );
  }

  return (
    <div 
      style={{
        backgroundColor: '#FBBC05',
        color: 'black',
        borderRadius: '8px',
        padding: '10px 15px',
        border: 'none',
        position: 'relative', // ✅ 新增：锚点需要相对定位
      }}
    >
      {/* ✅ 新增：顶部输入锚点 */}
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-top`}
        style={{ background: '#000000', width: 8, height: 8 }}
      />
      {/* ✅ 新增：底部输出锚点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-bottom`}
        style={{ background: '#000000', width: 8, height: 8 }}
      />
      {inputValue}
    </div>
  );
};

// 注册自定义节点类型（完全保留你的代码）
const nodeTypes = {
  editable: EditableNode,
};

// 主组件（仅改关键行，其余完全保留）
const KnowledgeTreeEditor = () => {
  // 1. 初始树形数据
  // 移除：const reactFlowInstance = useReactFlow(); （这行是报错核心）
  // 新增：用ref保存实例（仅加这1行）
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const treeData: TreeItem[] = [
    {
      id: 1,
      name: '根节点',
      children: [
        {
          id: 2,
          name: '子节点1',
          children: [
            { id: 5, name: '子节点1-1' },
            { id: 6, name: '子节点1-2' }
          ]
        },
        { id: 3, name: '子节点2' },
        { id: 4, name: '子节点3' }
      ]
    }
  ];

  // 2. 生成初始节点和边（完全保留）
  const { nodes: initialNodes, edges: initialEdges } = buildTreeNodes(treeData);

  // 3. 管理节点/边状态（完全保留）
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 4. 右键菜单状态（完全保留）
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    nodeId: null,
  });

  // 新增：获取实例的回调（仅加这1个函数）
  const handleInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstanceRef.current = instance;
  }, []);

  // 5. 左键点击节点（完全保留）
  const handleNodeClick: OnNodeClick = useCallback((event:any, node:any) => {
    console.log('跳转到富文本编辑器，节点ID：', node.id, '节点名称：', node.data.label);
  }, []);

  // 6. 右键点击节点（完全保留）
  const handleNodeContextMenu: OnNodeContextMenu = useCallback((event:any, node:any) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  // 7. 点击空白处关闭右键菜单（完全保留）
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (contextMenu.show) {
      setContextMenu({ ...contextMenu, show: false });
    }
  }, [contextMenu.show]);

  // 8. 新建子节点（仅改fitView相关行，其余保留）
const handleAddChildNode = useCallback(() => {
  if (!contextMenu.nodeId) return;

  setContextMenu({ ...contextMenu, show: false });

  const newNodeId = `node-${Date.now()}`;
  const parentNode = nodes.find((n) => n.id === contextMenu.nodeId);
  if (!parentNode) return;

  const childX = parentNode.position.x;
  const childY = parentNode.position.y + 100;

  const newNode: Node = {
    id: newNodeId,
    type: 'editable',
    data: { label: '新节点' },
    position: { x: childX, y: childY },
    draggable: false,
  };

  const newEdge: Edge = {
    id: `edge-${contextMenu.nodeId}-${newNodeId}`,
    source: contextMenu.nodeId,
    target: newNodeId,
    type: 'smoothstep',
    style: { stroke: '#000000', strokeWidth: 3 },
  };

  // ✅ 新增：打印要添加的边（看source/target是否正确）
  console.log('要添加的新边：', newEdge);
  
  setNodes((prev) => [...prev, newNode]);
  setEdges((prev) => {
    // ✅ 新增：打印更新后的edges数组（看是否包含新边）
    const newEdges = [...prev, newEdge];
    console.log('更新后的所有边：', newEdges);
    return newEdges;
  });

  if (reactFlowInstanceRef.current) {
    setTimeout(() => {
      reactFlowInstanceRef.current!.fitView({ padding: 0.2 });
    }, 50);
  }

  const handleNodeNameUpdate = (e: any) => {
    if (e.detail.nodeId === newNodeId) {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === newNodeId ? { ...node, data: { label: e.detail.name } } : node
        )
      );
      window.removeEventListener('nodeNameUpdated', handleNodeNameUpdate);
    }
  };
  window.addEventListener('nodeNameUpdated', handleNodeNameUpdate);

}, [contextMenu, nodes, setNodes, setEdges]);

  // 9. 删除节点（完全保留）
  const handleDeleteNode = useCallback(() => {
    if (!contextMenu.nodeId) return;

    setContextMenu({ ...contextMenu, show: false });
    setNodes((prev) => prev.filter((node) => node.id !== contextMenu.nodeId));
    setEdges((prev) =>
      prev.filter(
        (edge) => edge.source !== contextMenu.nodeId && edge.target !== contextMenu.nodeId
      )
    );
  }, [contextMenu.nodeId, setNodes, setEdges]);

  // 挂载关闭菜单监听（完全保留）
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '800px', border: '1px solid #eee', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeContextMenu={handleNodeContextMenu}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodeTypes={nodeTypes}
          draggable={false}
          onInit={handleInit} // 仅新增这1行（获取实例）
        >
          <Background color="#f0f0f0" gap={20} />
          <Controls />
        </ReactFlow>

        {/* 右键菜单（完全保留） */}
        {contextMenu.show && (
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              padding: '8px 0',
              width: '120px',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'white'}
              onClick={handleAddChildNode}
            >
              新建子节点
            </div>
            <div
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#ff0000',
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'white'}
              onClick={handleDeleteNode}
            >
              删除该节点
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
};

export default KnowledgeTreeEditor;