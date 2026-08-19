import AuthGuard from '@/components/common/AuthGuard';

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <h1 className="text-xl font-bold">📻 呼号日志管理</h1>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
