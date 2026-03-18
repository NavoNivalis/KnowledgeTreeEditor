'use client';

import KnowledgeTreeEditor from '@/app/components/KnowledgeTreeEditor';

export default function TreePage() {
  return (
    <div className="flex" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 你的编辑器自己会从数据库加载对应树，不需要传任何数据！ */}
      <KnowledgeTreeEditor />
    </div>
  );
}