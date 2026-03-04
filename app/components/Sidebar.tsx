// app/components/Sidebar.tsx
'use client'; // 只在这个组件加 client 标识

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Plus, Folder, Brain, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [trees, setTrees] = useState([
    { id: '1', name: 'JavaScript', count: 12, color: 'bg-blue-500' },
    { id: '2', name: 'React', count: 8, color: 'bg-purple-500' },
    { id: '3', name: '创业', count: 5, color: 'bg-green-500' },
  ]);

  const pathname = usePathname();
  const iconContainerClass = "w-6 h-6 flex items-center justify-center flex-shrink-0";
  const itemBaseClass = "w-full flex items-center gap-2 p-2 rounded text-sm hover:bg-gray-800";

  return (
    <div 
      className={`relative h-full bg-gray-900 text-gray-300 transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* 折叠按钮 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-2 top-5 z-10 p-1.5 bg-gray-900 border border-gray-700 rounded-full shadow-lg hover:bg-gray-800"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Logo 区域 */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Brain className={`${iconContainerClass} text-gray-400`} />
          {!isCollapsed && (
            <span className="font-semibold text-white">知识森林</span>
          )}
        </div>
      </div>

      {/* 树列表 */}
      <div className="p-3 overflow-y-auto max-h-[calc(100vh-220px)]">
        <div className="space-y-1">
          {!isCollapsed ? (
            <div>
              {trees.map(tree => (
                <Link
                  key={tree.id}
                  href={`/tree/${tree.id}`}
                  className={`${itemBaseClass} ${
                    pathname === `/tree/${tree.id}` ? 'bg-gray-800 text-white' : ''
                  }`}
                >
                  <div className={`${iconContainerClass} ${tree.color} rounded`}>
                    <Folder className="w-4 h-4 text-white" />
                  </div>
                  <span className="flex-1 truncate">{tree.name}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">{tree.count}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div>
              {trees.map(tree => (
                <Link
                  key={tree.id}
                  href={`/tree/${tree.id}`}
                  className={`${itemBaseClass} justify-center`}
                  title={tree.name}
                >
                  <div className={`${iconContainerClass} ${tree.color} rounded`}>
                    <Folder className="w-4 h-4 text-white" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* 新建按钮 */}
          <Link href="/new">
            <button 
              className={`${itemBaseClass} hover:bg-gray-700 text-white ${
                isCollapsed ? 'justify-center' : 'justify-start'
              }`}
            >
              <div className={iconContainerClass}>
                <Plus className="w-4 h-4" />
              </div>
              {!isCollapsed && <span>新建</span>}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}