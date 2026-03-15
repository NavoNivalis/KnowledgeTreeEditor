'use client';
import { useState, useEffect } from 'react';
import { getNoteByNodeId, saveNote } from '../hooks/database';

interface NoteEditorProps {
  nodeId: string | null;
}

export default function NoteEditor({ nodeId }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!nodeId) {
      setContent('');
      setTitle('');
     ;
      return;
    }
    const load = async () => {
      const note = await getNoteByNodeId(nodeId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
      }
    };
    load();
  }, [nodeId]);

  // 🔥 修复好的保存逻辑，永远不会卡住
  const handleSave = async () => {
    if (!nodeId) return;
    setSaving(true);

    try {
      await saveNote(nodeId, title || '无标题', content);
      alert('保存成功');
    } catch (err) {
      console.error('保存失败', err);
      alert('保存失败：数据库或网络错误');
    }

    setSaving(false);
  };

  if (!nodeId) {
    return <div className="text-gray-400">请点击左侧节点</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <h2 className="text-xl font-bold mb-3">节点笔记</h2>
      <input
        className="border p-2 rounded mb-3 w-full"
        placeholder="标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="border p-2 rounded flex-1 w-full resize-none"
        placeholder="写下你的笔记..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        {saving ? '保存中...' : '保存笔记'}
      </button>
    </div>
  );
}