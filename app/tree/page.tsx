'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

// 自定义唯一ID生成函数（零依赖，开发阶段够用）
const generateLocalId = () => {
  const timestamp = Date.now().toString(36); // 时间戳转36进制（缩短长度）
  const randomNum = Math.random().toString(36).slice(2, 8); // 6位随机数
  const randomChar = Math.random().toString(36).slice(2, 6); // 4位随机字母
  return `${timestamp}-${randomNum}-${randomChar}`;
};

// 相对路径导入组件（根据你的实际路径调整）
import KnowledgeTreeEditor from '../components/KnowledgeTreeEditor';

// 模拟本地存储层（开发阶段）
const TreeStorage = {
  // 保存认知树数据
  save: (treeId: string, data: { nodes: any[]; edges: any[] }) => {
    localStorage.setItem(`tree_${treeId}`, JSON.stringify(data));
  },
  // 获取认知树数据
  get: (treeId: string) => {
    const raw = localStorage.getItem(`tree_${treeId}`);
    return raw ? JSON.parse(raw) : null;
  },
  // 获取所有已保存的认知树ID
  list: () => {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('tree_'))
      .map(key => key.replace('tree_', ''));
  }
};

export default function TreeEditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // 从路由获取treeId（有则打开已有，无则新建空编辑器）
  const treeId = searchParams.get('id');
  // 加载初始数据
  const initialData = treeId ? TreeStorage.get(treeId) : null;

  // 保存认知树核心逻辑（保留，但和笔记跳转解耦）
  const handleSaveTree = useCallback((data: { nodes: any[]; edges: any[] }) => {
    if (saving) return;
    setSaving(true);
    
    try {
      // 新建认知树：生成自定义ID；已有则复用ID
      const finalTreeId = treeId || generateLocalId();
      TreeStorage.save(finalTreeId, data);
      // 保存后跳转带ID的路由
      router.push(`/editor/tree?id=${finalTreeId}`);
      alert('认知树保存成功！');
    } catch (err) {
      alert('保存失败：' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [treeId, router, saving]);

  // 核心修改1：点击节点直接跳转到笔记页面，无需先保存认知树
  // 笔记独立存在，仅携带nodeId（或直接跳转到新建/打开笔记页面）
  const handleNodeAddNote = useCallback((nodeId: string) => {
    // 直接跳转到笔记页面，无需校验treeId
    // 如果你想打开已有笔记：router.push(`/notes?id=${nodeId}`)
    // 如果你想新建笔记：router.push(`/notes/new`)
    router.push(`/notes?id=${nodeId}`); // 推荐：用nodeId关联笔记，认知树仅作为入口
  }, [router]);

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
    }}>
      {/* 认知树编辑器核心区域 */}
      <div style={{ height: '100%' }}> {/* 去掉60px的高度扣除，让编辑器占满全屏 */}
        <KnowledgeTreeEditor
          initialNodes={initialData?.nodes}
          initialEdges={initialData?.edges}
          onSave={handleSaveTree}
          onNodeAddNote={handleNodeAddNote}
        />
      </div>
    </div>
  );
}