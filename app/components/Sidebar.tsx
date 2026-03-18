'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Folder, Brain, ChevronLeft, ChevronRight, Trash2, Edit3 } from 'lucide-react';
import { createClientSupabase } from '@/app/lib/supabase-client'

import { 
  getUserTrees, 
  createTree, 
  deleteTree, 
  updateTreeTitle,
} from '../hooks/database';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 弹窗状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTreeTitle, setNewTreeTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    treeId: string;
    treeTitle: string;
  }>({ show: false, x: 0, y: 0, treeId: '', treeTitle: '' });

  // 重命名弹窗
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTreeId, setRenameTreeId] = useState('');
  const [renameTitle, setRenameTitle] = useState('');
  const [renaming, setRenaming] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const iconContainerClass = "w-6 h-6 flex items-center justify-center flex-shrink-0";
  const itemBaseClass = "w-full flex items-center gap-2 p-2 rounded text-sm hover:bg-gray-800 cursor-pointer transition-colors";
  
  //登出功能
    const handleLogout = async () => {
    await createClientSupabase().auth.signOut()
    router.push('/login')
    router.refresh()
  }
  // ========== 加载树列表 ==========
  const loadTrees = async () => {
    console.log("=== loadTrees 执行 ===");
    setLoading(true);
    try {
      const data = await getUserTrees();
      console.log("加载到的树列表 =", data);
      setTrees(data);
    } catch (e) {
      console.error("加载树列表失败", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrees();
  }, []);

  // ========== 点击外部关闭右键菜单 ==========
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ ...contextMenu, show: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  // ========== 新建认知树 ==========
const handleCreateTree = async () => {
  if (!newTreeTitle.trim()) return;
  
  console.log("=== handleCreateTree 执行 ===");
  console.log("树名称 =", newTreeTitle);
  
  setCreating(true);
  try {
    // 1. 等待树创建完成，拿到完整对象
    const newTree = await createTree(newTreeTitle.trim());
    console.log("✅ 树创建成功，树对象 =", newTree);
    console.log("✅ 树ID =", newTree.id);

    // 2. 刷新列表
    await loadTrees();
    
    setShowCreateModal(false);
    setNewTreeTitle('');
    
    // 3. 🔥 关键：确保 treeId 存在，再跳转
    if (newTree && newTree.id) {
      console.log("✅ 开始跳转到新树：", `/tree/${newTree.id}`);
      router.push(`/tree/${newTree.id}`);
    } else {
      throw new Error("创建树成功，但没有拿到树ID");
    }
  } catch (e) {
    console.error("创建认知树失败", e);
    alert("创建失败，请重试");
  } finally {
    setCreating(false);
  }
};

  // ========== 删除认知树 ==========
  const handleDeleteTree = async () => {
    if (!contextMenu.treeId) return;
    
    console.log("=== handleDeleteTree 执行 ===");
    console.log("要删除的 treeId =", contextMenu.treeId);

    if (!confirm(`确定要删除认知树「${contextMenu.treeTitle}」吗？此操作不可恢复！`)) {
      setContextMenu({ ...contextMenu, show: false });
      return;
    }

    try {
      await deleteTree(contextMenu.treeId);
      console.log("✅ 删除完成，刷新列表");
      await loadTrees();
      
      // 如果当前在删除的树页面，跳转到首页
      if (pathname === `/tree/${contextMenu.treeId}`) {
        router.push('/');
      }
      
      setContextMenu({ ...contextMenu, show: false });
    } catch (e) {
      console.error("删除认知树失败", e);
      alert("删除失败，请重试");
    }
  };

  // ========== 重命名认知树 ==========
  const handleRenameTree = async () => {
    if (!renameTreeId || !renameTitle.trim()) return;
    
    console.log("=== handleRenameTree 执行 ===");
    console.log("treeId =", renameTreeId);
    console.log("新名称 =", renameTitle);
    
    setRenaming(true);
    try {
      await updateTreeTitle(renameTreeId, renameTitle.trim());
      console.log("✅ 重命名完成，刷新列表");
      await loadTrees();
      
      setShowRenameModal(false);
      setRenameTreeId('');
      setRenameTitle('');
    } catch (e) {
      console.error("重命名失败", e);
      alert("重命名失败，请重试");
    } finally {
      setRenaming(false);
    }
  };

  // ========== 右键菜单触发 ==========
  const handleTreeContextMenu = (e: React.MouseEvent, tree: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("=== 右键点击树 ===");
    console.log("树信息 =", tree);
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      treeId: tree.id,
      treeTitle: tree.title,
    });
  };

  // ========== 打开重命名弹窗 ==========
  const openRenameModal = () => {
    setRenameTreeId(contextMenu.treeId);
    setRenameTitle(contextMenu.treeTitle);
    setContextMenu({ ...contextMenu, show: false });
    setShowRenameModal(true);
  };

  return (
    <div className={`relative h-full bg-gray-900 text-gray-300 transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="absolute right-2 top-5 z-10 p-1.5 bg-gray-900 border border-gray-700 rounded-full shadow-lg hover:bg-gray-800"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />}
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Brain className={`${iconContainerClass} text-gray-400`} />
          {!isCollapsed && <span className="font-semibold text-white">知识森林</span>}
        </div>
      </div>

      {/* 树列表 */}
      <div className="p-3 overflow-y-auto max-h-[calc(100vh-220px)]">
        <button onClick={handleLogout} className="mt-auto text-sm text-gray-500">
        退出登录
      </button>
        <div className="space-y-1">
          {loading ? (
            <div className="text-gray-500 text-sm p-2">加载中...</div>
          ) : (
            <>
              {trees.length === 0 && !isCollapsed && (
                <div className="text-gray-500 text-sm p-2">暂无认知树</div>
              )}

              {trees.map(tree => (
                <div
                  key={tree.id}
                  onContextMenu={(e) => handleTreeContextMenu(e, tree)}
                >
                  <Link
                    href={`/tree/${tree.id}`}
                    className={`${itemBaseClass} ${pathname === `/tree/${tree.id}` ? 'bg-gray-800 text-white' : ''}`}
                  >
                    <div className={`${iconContainerClass} bg-blue-500 rounded`}>
                      <Folder className="w-4 h-4 text-white" />
                    </div>
                    {!isCollapsed && (
                      <span className="flex-1 truncate">{tree.title}</span>
                    )}
                  </Link>
                </div>
              ))}

              {/* 新建认知树按钮 */}
              <button
                onClick={() => setShowCreateModal(true)}
                className={`${itemBaseClass} hover:bg-gray-700 text-white ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <div className={iconContainerClass}><Plus className="w-4 h-4" /></div>
                {!isCollapsed && <span>新建认知树</span>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu.show && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px] py-1"
        >
          <button
            onClick={openRenameModal}
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            重命名
          </button>
          <button
            onClick={handleDeleteTree}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      )}

      {/* 新建认知树弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">新建认知树</h3>
            <input
              type="text"
              value={newTreeTitle}
              onChange={(e) => setNewTreeTitle(e.target.value)}
              placeholder="请输入认知树名称"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTree()}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={creating}
              >
                取消
              </button>
              <button
                onClick={handleCreateTree}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={creating || !newTreeTitle.trim()}
              >
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名弹窗 */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">重命名认知树</h3>
            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              placeholder="请输入新名称"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRenameTree()}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={renaming}
              >
                取消
              </button>
              <button
                onClick={handleRenameTree}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={renaming || !renameTitle.trim()}
              >
                {renaming ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}