// app/notes/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { use } from 'react'; // 👈 必须加
import NotebookEditor from '@/app/components/NotebookEditor';
import { getNoteByNoteId } from '@/app/hooks/database';

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // 👈 核心修复
  const noteId = id;

  const [loading, setLoading] = useState(true);
  const [noteData, setNoteData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      console.log("✅ 真实笔记ID:", noteId);
      const data = await getNoteByNoteId(noteId);
      setNoteData(data);
      setLoading(false);
    };
    load();
  }, [noteId]);

  if (loading) return <div>加载中...</div>;
  if (!noteData) return <div>笔记不存在：{noteId}</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <NotebookEditor
        noteId={noteId}
        nodeId={noteData.node_id}
        nodeLabel={noteData.title}
      />
    </div>
  );
}