// /app/notes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const router = useRouter();
  useEffect(() => {
    // 从 localStorage 读取所有笔记
    const saved = localStorage.getItem('study-notes');
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button 
        onClick={() => router.push('/')} 
        className="mb-6 text-blue-500 hover:text-blue-700"
      >
        ← 返回编辑器
      </button>
      <h1 className="text-2xl font-bold mb-6">你的学习笔记</h1>
      
      {notes.length === 0 ? (
        <p className="text-gray-500">还没有笔记，去 <Link href="/" className="text-blue-500">创建一篇</Link></p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border p-4 rounded-lg hover:bg-gray-50">
              <Link href={`/notes/${note.id}`} className="block">
                <h2 className="text-xl font-semibold">{note.title}</h2>
                <p className="text-gray-600 mt-2 line-clamp-2">
                  {/* 从HTML中提取纯文本预览 */}
                  {note.content.replace(/<[^>]*>/g, '').slice(0, 100)}...
                </p>
                <div className="text-sm text-gray-400 mt-2">
                  {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}