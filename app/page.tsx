// app/page.tsx
import Link from 'next/link';
import { TreePine, Brain, ChevronRight } from 'lucide-react';

export default function Home() {

  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">知识森林</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl">
            将碎片知识组织成生长的树，让学习变得可视化
          </p>
        </div>

      </div>
    </div>
  );
}