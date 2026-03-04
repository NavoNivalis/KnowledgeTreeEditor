// app/page.tsx
import Link from 'next/link';
import { TreePine, Brain, ChevronRight } from 'lucide-react';

export default function Home() {
  const exampleTrees = [
    { id: 'javascript', name: 'JavaScript核心概念', description: '前端开发基础', nodes: 7 },
    { id: 'react', name: 'React学习路径', description: '从入门到精通', nodes: 12 },
    { id: 'nextjs', name: 'Next.js框架', description: '现代Web开发', nodes: 9 },
  ];

  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        {/* 欢迎标题 */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">知识森林</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl">
            将碎片知识组织成生长的树，让学习变得可视化
          </p>
        </div>

        {/* 示例知识树 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">示例知识树</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exampleTrees.map((tree) => (
              <Link
                key={tree.id}
                href={`/tree/${tree.id}`}
                className="group"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center">
                      <TreePine className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
                      {tree.nodes} 节点
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {tree.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {tree.description}
                  </p>
                  
                  <div className="flex items-center text-blue-600 font-medium mt-4">
                    查看知识树
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:ml-2 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}