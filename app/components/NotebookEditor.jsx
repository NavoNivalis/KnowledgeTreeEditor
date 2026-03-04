// /app/components/NotebookEditor.jsx
'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link'; // 重命名为 LinkExtension
import Placeholder from '@tiptap/extension-placeholder';
import Link from 'next/link'; // Next.js 的 Link 组件

// 工具栏组件 - 保持简洁
function Toolbar({ editor }) {
  if (!editor) return null;

  return (
    <div className="flex items-center space-x-2">
      {/* 格式按钮 */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-3 py-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-3 py-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
      >
        I
      </button>
      
      {/* 链接按钮 */}
      <button
        onClick={() => {
          const url = window.prompt('输入链接地址:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        className="px-3 py-1 rounded"
      >
        链接
      </button>
    </div>
  );
}

export default function NotebookEditor() {
  // ==================== 标题逻辑开始 ====================
  // 独立的标题状态，与编辑器完全分离
  const [title, setTitle] = useState('未命名笔记');
  // 这个状态变量专门存储标题，永远不会因为编辑器操作而消失
  // ==================== 标题逻辑结束 ====================

  // 编辑器实例
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ 
        placeholder: '开始记录你的学习内容...' 
      }),
    ],
    content: '<p>今天学到了什么？详细记录下来...</p>',
    immediatelyRender: false,
  });

  // ==================== 保存逻辑开始 ====================
  const handleSave = () => {
    if (!editor) return;
    
    // 构建完整的笔记数据对象
    const noteData = {
      id: Date.now().toString(), // 唯一标识
      title: title.trim() || '未命名笔记', // 使用独立的标题状态
      content: editor.getHTML(), // 编辑器内容
      createdAt: new Date().toISOString(), // 创建时间
    };
    
    // 保存到 localStorage
    const existingNotes = JSON.parse(
      localStorage.getItem('study-notes') || '[]'
    );
    existingNotes.push(noteData);
    localStorage.setItem('study-notes', JSON.stringify(existingNotes));
    
    // 用户反馈
    alert(`笔记已保存: "${noteData.title}"`);
    
    // 可选：保存后清空编辑器，准备下一篇笔记
    setTitle('未命名笔记');
    editor.commands.setContent('<p>开始写下一篇笔记...</p>');
  };
  // ==================== 保存逻辑结束 ====================

  if (!editor) {
    return <div className="min-h-[200px] border rounded-lg p-4">加载编辑器...</div>;
  }

  return (
    
    <div className="max-w-4xl mx-auto p-4">
      <Link href="/notes" className="text-blue-500 mb-4 inline-block">
      查看所有笔记 →
      </Link>
      {/* 独立的标题输入区域 */}
      <div className="mb-2 bg-gray-50">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入笔记标题"
          className="w-full text-3xl font-bold border-none outline-none focus:ring-0"
        />
      </div>

      {/* 工具栏 */}
      <div className="bg-gray-100">
        <Toolbar editor={editor} />
      </div>

      {/* 内容编辑器 */}
      <div className="bg-gray-50">
        <EditorContent editor={editor} className="min-h-[400px] p-6" />
      </div>

      {/* 保存按钮 - 触发保存逻辑 */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          保存笔记
        </button>
      </div>
    </div>
  );
}
