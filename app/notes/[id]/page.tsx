// /app/notes/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 定义笔记类型，与保存时的数据结构一致
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null); // 明确指定类型
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('study-notes');
    if (saved) {
      const notes: Note[] = JSON.parse(saved); // 指定数组类型
      const foundNote = notes.find(n => n.id === params.id);
      if (foundNote) {
        setNote(foundNote);
      }
    }
    setLoading(false);
  }, [params.id]);

  if (loading) return <div className="p-8">加载中...</div>;
  if (!note) return <div className="p-8">笔记不存在</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <button 
        onClick={() => router.push('/notes')} 
        className="mb-6 text-blue-500 hover:text-blue-700"
      >
        ← 返回笔记列表
      </button>
      
      <div className="border rounded-lg p-8 bg-white shadow-sm">
        <h1 className="text-3xl font-bold mb-6 border-b pb-4">{note.title}</h1>
        <div 
          className="prose max-w-none min-h-[400px]"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
        
        <div className="mt-8 pt-6 border-t text-sm text-gray-500">
          创建于：{new Date(note.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}