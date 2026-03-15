'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function NotebookEditor(props) {
  const { noteId, nodeId, nodeLabel } = props;
  const [title, setTitle] = useState('');

  // 纯文本编辑器（最简配置）
  const editor = useEditor({
    extensions: [StarterKit], // 只保留基础文本
    content: '',
    immediatelyRender: false,
  });

  // 同步标题
  useEffect(() => {
    setTitle(nodeLabel || '');
  }, [nodeLabel]);

  // 你自己写保存逻辑
  const handleSave = async () => {
    if (!editor || !noteId || !nodeId) return;

    const finalTitle = title.trim();
    const finalContent = editor.getHTML();

    // 你自己在这里写保存逻辑
    console.log('准备保存：', { noteId, nodeId, title: finalTitle, content: finalContent });
  };

  // 编辑器未加载完成
  if (!editor) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 标题 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="笔记标题"
        className="w-full text-2xl font-bold border-b pb-2 mb-4 outline-none"
      />

      {/* 纯编辑器 */}
      <div className="border rounded p-6 min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      {/* 保存按钮 */}
      <div className="mt-4 text-right">
        <button onClick={handleSave} className="px-5 py-2 bg-gray-800 text-white rounded">
          保存
        </button>
      </div>
    </div>
  );
}