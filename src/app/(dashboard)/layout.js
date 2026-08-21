// src/app/(dashboard)/layout.js
'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Link from 'next/link';
import LogoutButton from '@/components/common/LogoutButton';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Footer from '@/components/common/Footer';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { user, role } = useAuth(); // 获取角色
  const displayName = user?.user_metadata?.full_name || user?.email || '用户';

  const isActive = (href) => {
    if (href === '/logs') return pathname === '/logs';
    return pathname.startsWith(href);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen relative flex flex-col">
        <nav className="sticky top-0 z-10 glass border-b border-glass backdrop-blur-md bg-glass/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-8">
                <Link href="/logs" className="text-xl font-bold text-foreground flex items-center gap-2">
                  QSO Logbook
                </Link>
                <div className="hidden md:flex space-x-4">
                  <NavLink href="/logs" isActive={isActive('/logs')}>日志</NavLink>
                  <NavLink href="/logs/new" isActive={isActive('/logs/new')}>新增</NavLink>
                  <NavLink href="/logs/import" isActive={isActive('/logs/import')}>导入</NavLink>
                  <NavLink href="/upload" isActive={isActive('/upload')}>LoTW</NavLink>
                  <NavLink href="/logs/stats" isActive={isActive('/logs/stats')}>统计</NavLink>
                  <NavLink href="/settings" isActive={isActive('/settings')}>设置</NavLink>
                  {role === 'admin' && (
                    <NavLink href="/admin/backups" isActive={isActive('/admin/backups')}>
                      备份管理
                    </NavLink>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-foreground-muted">{displayName}</span>
                <LogoutButton />
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}

function NavLink({ href, children, isActive }) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition ${
        isActive
          ? 'text-blue-400 border-b-2 border-blue-400 pb-1'
          : 'text-foreground-muted hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  );
}