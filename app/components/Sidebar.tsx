'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Plus, Folder, Brain, ChevronLeft, ChevronRight } from 'lucide-react';

import { getUserTrees } from '../hooks/database'; // 导入

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [trees, setTrees] = useState<any[]>([]); // 从数据库加载
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const iconContainerClass = "w-6 h-6 flex items-center justify-center flex-shrink-0";
  const itemBaseClass = "w-full flex items-center gap-2 p-2 rounded text-sm hover:bg-gray-800";

  // ✅ 从数据库加载用户的所有树
  useEffect(() => {
    const loadTrees = async () => {
      const data = await getUserTrees();
      setTrees(data);
      setLoading(false);
    };
    loadTrees();
  }, []);

  return (
    <div className={`relative h-full bg-gray-900 text-gray-300 transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute right-2 top-5 z-10 p-1.5 bg-gray-900 border border-gray-700 rounded-full shadow-lg hover:bg-gray-800">
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
        <div className="space-y-1">
          {loading ? (
            <div className="text-gray-500 text-sm p-2">加载中...</div>
          ) : (
            <>
              {trees.length === 0 && !isCollapsed && (
                <div className="text-gray-500 text-sm p-2">暂无认知树</div>
              )}

              {trees.map(tree => (
                <Link
                  key={tree.id}
                  href={`/tree/${tree.id}`}
                  className={`${itemBaseClass} ${pathname === `/tree/${tree.id}` ? 'bg-gray-800 text-white' : ''}`}
                >
                  <div className={`${iconContainerClass} bg-blue-500 rounded`}>
                    <Folder className="w-4 h-4 text-white" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate">{tree.title}</span>
                    </>
                  )}
                </Link>
              ))}

              {/* 新建认知树 */}
              <Link href="/new">
                <button className={`${itemBaseClass} hover:bg-gray-700 text-white ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                  <div className={iconContainerClass}><Plus className="w-4 h-4" /></div>
                  {!isCollapsed && <span>新建认知树</span>}
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}