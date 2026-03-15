'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  OnNodeContextMenu,
  NodeProps,
  ReactFlowInstance,
  Handle,
  Position,
  useUpdateNodeInternals,
} from 'reactflow';

import 'reactflow/dist/style.css';

import { 
  TreeNode,
  getOrCreateDefaultTree,
  saveTreeNodes,
  loadTreeNodes,
  updateNodeLabel,

  createNote,
  deleteNoteByNodeId,
} from '../hooks/database'; // 路径匹配你的文件结构

import { TreeDeciduousIcon } from 'lucide-react';
import { init } from 'next/dist/compiled/webpack/webpack';

import NotebookEditor from './NotebookEditor';

import { useRouter } from 'next/navigation';





const CONFIG = {
  rootX: 500,
  rootY: 700,         // 仅根节点需要基准Y
  nodeWidth: 100,
  nodeHeight: 50,
  levelGap: 50,       // 有子节点时的偏移量（父子间距）
  siblingGap: 50,     // 叶子节点的偏移量（兄弟间距）
  branchGap: 150,
};



// ========== 核心：单递归函数（实时累加游标 + 仅根节点基准Y） ========== 简单暴力正确好用
interface GlobalCursor {
  left: number;   // 左分支全局累计游标（仅基于根节点基准Y）
  right: number;  // 右分支全局累计游标
}

function layoutTreeRecursive(
  node: TreeNode,
  treeData: TreeNode[],
  globalCursor: GlobalCursor,
  rootBaseY: number // 仅传递根节点基准Y，所有节点都基于这个值计算
): void {
  // 1. 分离当前节点的左右分支子节点（按order降序）
  const leftChildren = treeData
    .filter(n => n.parentId === node.id && n.branch === 'left')
    .sort((a, b) => b.order - a.order);

  const rightChildren = treeData
    .filter(n => n.parentId === node.id && n.branch === 'right')
    .sort((a, b) => b.order - a.order);

  // 2. 处理左分支（核心：实时累加游标）
  leftChildren.forEach((child) => {
    // ① 计算当前子节点的y值（仅根节点基准Y + 左游标）
    child.y = rootBaseY + globalCursor.left;
    child.x = node.x - CONFIG.branchGap;

    // ② 判断当前子节点是否有子节点
    const hasChild = treeData.some(
      n => n.parentId === child.id && n.branch === child.branch
    );

    // ③ 递归深入：先处理子节点的子节点（游标先累加）
    if (hasChild) {
      // 有子节点 → 游标先减levelGap（父子间距）
      globalCursor.left -= CONFIG.levelGap;
      layoutTreeRecursive(child, treeData, globalCursor, rootBaseY);
    } else {
      // 叶子节点 → 游标减siblingGap（兄弟间距）
      globalCursor.left -= CONFIG.siblingGap;
    }
  });

  // 3. 处理右分支（逻辑和左分支完全一致）
  rightChildren.forEach((child) => {
    // ① 计算当前子节点的y值（仅根节点基准Y + 右游标）
    child.y = rootBaseY + globalCursor.right;
    child.x = node.x + CONFIG.branchGap;

    // ② 判断当前子节点是否有子节点
    const hasChild = treeData.some(
      n => n.parentId === child.id && n.branch === child.branch
    );

    // ③ 递归深入：实时累加游标
    if (hasChild) {
      globalCursor.right -= CONFIG.levelGap;
      layoutTreeRecursive(child, treeData, globalCursor, rootBaseY);
    } else {
      globalCursor.right -= CONFIG.siblingGap;
    }
  });
}

// ========== 主布局函数（初始化根节点+游标） ==========
function layoutTree(treeData: TreeNode[]): TreeNode[] {
  const result = [...treeData];
  const rootNode = result.find(n => n.level === 0);

  if (rootNode) {
    // 仅初始化根节点的坐标
    rootNode.x = CONFIG.rootX;
    rootNode.y = CONFIG.rootY;

    // 初始化全局游标（仅基于根节点基准Y，初始偏移=-levelGap）
    const globalCursor: GlobalCursor = {
      left: -CONFIG.levelGap,
      right: -CONFIG.levelGap,
    };

    // 递归布局：仅传递根节点基准Y（所有节点都基于这个值计算）
    layoutTreeRecursive(rootNode, result, globalCursor, CONFIG.rootY);
  }

  return result;
}

// ========== 转换函数 ==========
function treeToNodes(tree: TreeNode[]): Node[] {
  return tree.map(node => ({
    id: node.id,
    type: 'treeNode',
    data: { 
      label: node.label, 
      level: node.level, 
      branch: node.branch,
      parentId: node.parentId,
      order: node.order
    },
    position: { x: node.x, y: node.y },
    draggable: false,
    style: {
      width: CONFIG.nodeWidth,
      height: CONFIG.nodeHeight,
    },
  }));
}

function treeToEdges(tree: TreeNode[]): Edge[] {
  const edges: Edge[] = [];

  tree.forEach(node => {
    if (!node.parentId) return;
    const parent = tree.find(n => n.id === node.parentId);
    if (!parent) return;

    const targetHandle = node.branch === 'left' ? 'right-target' : 'left-target';

    edges.push({
      id: `edge-${parent.id}-${node.id}`,
      source: parent.id,
      sourceHandle: 'top-source',
      target: node.id,
      targetHandle: targetHandle,
      type: 'bezier', // 核心：改为贝塞尔曲线（真正的曲线）
      style: {
        stroke: node.branch === 'left' ? '#4285F4' : '#34A853',
        strokeWidth: 2,
        strokeLinecap: 'round', // 线条端点圆润
      },
      // 可选：自定义贝塞尔曲线曲率
      //bezierOptions: {
       // curvature: 0.8, // 曲率（0-1，越大曲线越明显）
       // offset: 50, // 偏移量
      //},
    });
  });

  return edges;
}

// ========== 自定义节点组件 ==========
const TreeNodeComponent: React.FC<NodeProps> = ({ data, id }) => {
  const [label, setLabel] = useState(data.label);
  const [editing, setEditing] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();

  // 同步外部更新
  useEffect(() => {
    setLabel(data.label);
  }, [data.label]);

  const handleConfirm = () => {
    if (label.trim()) {
      window.dispatchEvent(
        new CustomEvent('nodeLabelUpdated', {
          detail: { nodeId: id, label: label.trim() },
        })
      );
    }
    setEditing(false);
    updateNodeInternals(id);
  };

  return (
    <div
      style={{
        width: CONFIG.nodeWidth,
        height: CONFIG.nodeHeight,
        backgroundColor: data.branch === 'left' ? '#4285F4' : '#34A853',
        color: 'white',
        borderRadius: 8,
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
        border: data.order === 0 ? '2px solid #fff' : '1px solid #eee',
      }}
    >
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{
          background: '#666',
          width: 8,
          height: 8,
          top: -4,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        isConnectable={true}
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{
          background: '#FF6B6B',
          width: 8,
          height: 8,
          left: -4,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        isConnectable={true}
      />

      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{
          background: '#4ECDC4',
          width: 8,
          height: 8,
          right: -4,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        isConnectable={true}
      />

      {editing ? (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleConfirm}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          autoFocus
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: 'white',
            textAlign: 'center',
            outline: 'none',
            fontSize: 14,
          }}
        />
      ) : (
        <div
          style={{
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
            padding: '0 4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          onDoubleClick={() => setEditing(true)} // 👈 双击进入编辑
          title={label}
        >
          {label} <br />
          <small>order:{data.order}</small>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10,
          color: '#666',
        }}
      >
        L{data.level}-{data.branch[0]}
      </div>
    </div>
  );
};


function addChildNode(
  parentNode: TreeNode, 
  tree: TreeNode[], 
  treeId: string
): TreeNode[] {
  const siblings = tree.filter(n => 
    n.parentId === parentNode.id && 
    n.level === parentNode.level + 1 &&
    n.branch === parentNode.branch
  );

  const maxOrder = siblings.length > 0 ? siblings.length : -1;
  const newOrder = maxOrder + 1;
  const newNodeId = `node-${Date.now()}`;
  const defaultLabel = "新节点";

  const newNode: TreeNode = {
    id: newNodeId,
    label: defaultLabel,
    level: parentNode.level + 1,
    order: newOrder,
    parentId: parentNode.id,
    branch: parentNode.branch,
    x: 0,
    y: 0,
    tree_id: treeId
  };

  return [...tree, newNode];
}

// ========== 辅助函数：删除节点 ==========
async function deleteNode(nodeId: string, tree: TreeNode[]): Promise<TreeNode[]> {
  // 1. 收集要删除的节点（自身 + 所有子孙）
  const toDelete = new Set<string>([nodeId]);
  let found;

  do {
    found = false;
    tree.forEach(node => {
      if (node.parentId && toDelete.has(node.parentId) && !toDelete.has(node.id)) {
        toDelete.add(node.id);
        found = true;
      }
    });
  } while (found);

  // 2. ✅ 修复：遍历要删除的节点，根据 nodeId 删除笔记
  const nodesToDelete = tree.filter(n => toDelete.has(n.id));
  for (const node of nodesToDelete) {
    // 现在是：根据 node.id 删除笔记（正确）
    await deleteNoteByNodeId(node.id);
  }

  // 3. 找到被删除节点，更新 兄弟节点的order
  const deletedNode = tree.find(n => n.id === nodeId);
  if (!deletedNode) return tree.filter(n => !toDelete.has(n.id));

  const { parentId, order: deletedOrder } = deletedNode;
  let newTree = tree.filter(node => !toDelete.has(node.id));

  // 4. 兄弟节点 order -1
  newTree = newTree.map(node => {
    if (node.parentId === parentId && node.order > deletedOrder) {
      return { ...node, order: node.order - 1 };
    }
    return node;
  });

  return newTree;
}


// ========== 主组件 ==========
const KnowledgeTreeEditor: React.FC = () => {
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const [treeData, setTreeData] = useState<TreeNode[]>([]); 
  // 原有状态不变，新增：
  const [treeId, setTreeId] = useState<string>(''); // 认知树ID

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false); // 加载/保存状态

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    nodeId: string | null;
  }>({ show: false, x: 0, y: 0, nodeId: null });

    const router = useRouter();

    // 删掉 useCallback，直接用普通函数
    const onNodeClick = (_: any, node: any) => {
      setSelectedNodeId(node.id);
    };

    const updateTree = useCallback(async (newTree: TreeNode[]) => {
      const laidOut = layoutTree(newTree);
      setTreeData(laidOut);
      setNodes(treeToNodes(laidOut));
      setEdges(treeToEdges(laidOut));

      // ########## 日志 ##########
      console.log("=== updateTree 执行 ===");
      console.log("传入的节点数据:", newTree);
      const realTreeId = newTree[0]?.tree_id;
      console.log("获取到 realTreeId =", realTreeId);

      if (realTreeId) {
        console.log("✅ 开始执行 saveTreeNodes！！！");
        await saveTreeNodes(realTreeId, laidOut);
        console.log("✅ saveTreeNodes 执行完成！");
      } else {
        console.log("❌ 没有 tree_id，不保存");
      }

      setTimeout(() => {
        reactFlowInstanceRef.current?.fitView({ padding: 0.3, duration: 500 });
      }, 100);
    }, [setNodes, setEdges]);
  
      // ========== 新增：从数据库加载/初始化认知树 ==========
    // 1. 第一步：只获取 treeId
    useEffect(() => {
      const initId = async () => {
        const tid = await getOrCreateDefaultTree();
        setTreeId(tid);
      };
      initId();
    }, []);

    // 2. 第二步：等 treeId 有值了，再执行初始化 ✅
    useEffect(() => {
      if (!treeId) return; // 等待 treeId 就绪

      const initTree = async () => {
        setLoading(true);
        try {
          const loadedNodes = await loadTreeNodes(treeId);

          if (loadedNodes.length > 0) {
            await updateTree(loadedNodes);
          } else {
            const rootId = `node_${Date.now()}`;
            const initialTreeData : TreeNode[] = [
              {
                id: rootId,
                label: "根节点",
                level: 0,
                order: 0,
                parentId: null,
                branch: "left" as const,
                x: 0,
                y: 0,
                tree_id: treeId,
              },
            ];

            // ✅ 现在 treeId 一定存在
            await updateTree(initialTreeData);

            // ✅ 节点已保存 → 笔记创建成功
            await createNote("根节点", rootId);
          }
        } catch (e) {
          console.error("初始化失败", e);
        } finally {
          setLoading(false);
        }
      };

      initTree();
    }, [treeId, updateTree]); // 👈 依赖 treeId



  const handleAddChildNode = useCallback(async () => {
    if (!contextMenu.nodeId) return;

    const parentNode = treeData.find(n => n.id === contextMenu.nodeId);
    if (!parentNode) return;

    try {
      // 1. 生成新节点结构
      const newTree = await addChildNode(parentNode, treeData, treeId);

      // 2. ✅ 先保存节点到数据库（必须第一步）
      await updateTree(newTree);

      // 3. ✅ 找到刚生成的新节点
      const newNode = newTree.find(n => n.parentId === parentNode.id);
      if (!newNode) return;

      // 4. ✅ 节点已存在 → 创建笔记
      await createNote(newNode.label, newNode.id);

      setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
    } catch (e) {
      console.error("添加子节点失败：", e);
    }
  }, [contextMenu, treeData, treeId, updateTree]);
  
  const handleDeleteNode = useCallback( async () => {
    if (!contextMenu.nodeId) return;
    
    const newTree = await deleteNode(contextMenu.nodeId, treeData);
    await updateTree(newTree);
    setContextMenu({ show: false, x: 0, y: 0, nodeId: null });
  }, [contextMenu, treeData, updateTree]);

  // 在handleDeleteNode之后，handleNodeContextMenu之前添加：
  const handleSaveTree = async () => {
    if (!treeId || loading) return;

    console.log("👉 点击保存，当前 treeData 长度 =", treeData.length);

    setLoading(true);
    try {
      await saveTreeNodes(treeId, treeData);
      alert('认知树保存成功！');
    } catch (e) {
      console.error("保存失败", e);
      alert('保存失败：' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNodeContextMenu = useCallback((e:any, node:any) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      nodeId: node.id,
    });
  }, []);
  
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        setContextMenu({ ...contextMenu, show: false });
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);
  
  const handleInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstanceRef.current = instance;
    instance.fitView({ padding: 0.3 });
  }, []);

  //监听双击节点修改label
  useEffect(() => {
      const handleLabelUpdate = async (e: CustomEvent) => {
        const { nodeId, label } = e.detail;

        // 1. 更新本地树
        const newTree = treeData.map(node => 
          node.id === nodeId ? { ...node, label } : node
        );
        updateTree(newTree);

        // 2. ✅ 保存到数据库
        await updateNodeLabel(nodeId, label);
      };
      // 解决类型错误
      const listener = (e: Event) => {
        handleLabelUpdate(e as unknown as CustomEvent);
      };
        window.addEventListener('nodeLabelUpdated', listener);
        return () => window.removeEventListener('nodeLabelUpdated', listener);
      }, [treeData, updateTree]);
 
  //注册reactflow自定义节点
  const nodeTypes = useMemo(() => ({ treeNode: TreeNodeComponent }), []);
  
    return (
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        gap: '8px',
        padding: '8px',
        boxSizing: 'border-box'
      }}>

        {/* ------------- 左侧树：固定宽度，不占全屏 ------------- */}
        <div style={{
          width: '800px',
          height: '100%',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeContextMenu={handleNodeContextMenu}
            nodeTypes={nodeTypes}
            fitView
            onInit={handleInit}
            style={{ 
              width: '100%', 
              height: '100%', 
              backgroundColor: '#f9fafb' 
            }}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>

          {contextMenu.show && (
            <div style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: 6,
              zIndex: 9999,
              minWidth: 130
            }}>
              <div style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={handleAddChildNode}>
                新增子节点
              </div>
              <div style={{ padding: '8px 12px', cursor: 'pointer', color: 'red', borderTop: '1px solid #eee' }} onClick={handleDeleteNode}>
                删除节点
              </div>
            </div>
          )}
        </div>

        {/* ------------- 右侧笔记：自动占满剩余空间 ------------- */}
        <div style={{
          flex: 1,
          height: '100%',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'auto',
          padding: '16px'
        }}>
          <NotebookEditor nodeId={selectedNodeId} />
        </div>
      </div>
    );
}
// 最后：只导出组件，不要包任何 Provider！
export default KnowledgeTreeEditor;
