// app/layout.tsx（Server Component，无 'use client'）
// app/layout.tsx
import './globals.css';
import Sidebar from './components/Sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full overflow-hidden" suppressHydrationWarning>
      <body className="h-full m-0 p-0 overflow-hidden">
        <div className="flex h-full">
          <Sidebar />
          <div className="flex-1 overflow-hidden h-full bg-white">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}