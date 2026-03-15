// app/notes/page.tsx
import NotebookEditor from '@/app/components/NotebookEditor';

// 这是 Next.js App Router 中的页面组件
// 'use client' 指令已经在 NotebookEditor 组件内部声明，这里不需要重复声明
export default function NotesPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* 页面头部 */}
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">笔记编辑器</h1>
      </header>

      {/* 主要内容区域 - 编辑器组件 */}
      <section className="py-8">
        <NotebookEditor />
      </section>

      {/* 可选的页脚 */}
      <footer className="border-t px-6 py-4 text-center text-gray-500 text-sm">
        <p>学习笔记编辑器 | 数据保存在本地浏览器中</p>
      </footer>
    </main>
  );
}