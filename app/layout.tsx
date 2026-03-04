// app/layout.tsx（Server Component，无 'use client'）
import './globals.css'; // 这里导入全局 CSS 是 Next.js 允许的唯一方式
import Sidebar from './components/Sidebar'; // 导入客户端组件

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full overflow-hidden">
      <body className="h-full m-0 p-0 overflow-hidden">
        <div className="flex h-full">
          {/* 引入拆分后的客户端侧边栏组件 */}
          <Sidebar />
          {/* 右侧主内容 */}
          <div className="flex-1 overflow-auto h-full bg-white">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}