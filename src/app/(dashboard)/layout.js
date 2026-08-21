// src/app/(dashboard)/layout.js
'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Link from 'next/link';
import LogoutButton from '@/components/common/LogoutButton';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Footer from '@/components/common/Footer';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email || '用户';
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href) => {
    if (href === '/logs') return pathname === '/logs';
    return pathname.startsWith(href);
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <AuthGuard>
      <div className="min-h-screen relative flex flex-col">
        <nav className="sticky top-0 z-10 glass border-b border-glass backdrop-blur-md bg-glass/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-8">
                <Link href="/logs" className="text-xl font-bold text-foreground flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l-3 3-3-3" />
                  </svg>
                  QSO Logbook
                </Link>
                {/* 桌面导航 */}
                <div className="hidden md:flex space-x-4">
                  <NavLink href="/logs" isActive={isActive('/logs')}>日志</NavLink>
                  <NavLink href="/logs/new" isActive={isActive('/logs/new')}>新增</NavLink>
                  <NavLink href="/logs/import" isActive={isActive('/logs/import')}>导入</NavLink>
                  <NavLink href="/upload" isActive={isActive('/upload')}>LoTW</NavLink>
                  <NavLink href="/logs/stats" isActive={isActive('/logs/stats')}>统计</NavLink>
                  <NavLink href="/settings" isActive={isActive('/settings')}>设置</NavLink>
                  {role === 'admin' && (
                    <NavLink href="/admin/backups" isActive={isActive('/admin/backups')}>备份</NavLink>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-foreground-muted hidden sm:inline">{displayName}</span>
                <LogoutButton />
                {/* 移动端汉堡菜单按钮 */}
                <button
                  onClick={toggleMenu}
                  className="md:hidden text-foreground focus:outline-none"
                >
                  {menuOpen ? (
                    <XMarkIcon className="w-6 h-6" />
                  ) : (
                    <Bars3Icon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* 移动端下拉菜单 */}
          {menuOpen && (
            <div className="md:hidden border-t border-glass bg-glass/95 backdrop-blur-md">
              <div className="px-4 py-2 space-y-1">
                <MobileNavLink href="/logs" isActive={isActive('/logs')} onClick={closeMenu}>日志</MobileNavLink>
                <MobileNavLink href="/logs/new" isActive={isActive('/logs/new')} onClick={closeMenu}>新增</MobileNavLink>
                <MobileNavLink href="/logs/import" isActive={isActive('/logs/import')} onClick={closeMenu}>导入</MobileNavLink>
                <MobileNavLink href="/upload" isActive={isActive('/upload')} onClick={closeMenu}>LoTW</MobileNavLink>
                <MobileNavLink href="/logs/stats" isActive={isActive('/logs/stats')} onClick={closeMenu}>统计</MobileNavLink>
                <MobileNavLink href="/settings" isActive={isActive('/settings')} onClick={closeMenu}>设置</MobileNavLink>
                {role === 'admin' && (
                  <MobileNavLink href="/admin/backups" isActive={isActive('/admin/backups')} onClick={closeMenu}>备份</MobileNavLink>
                )}
                <div className="pt-2 border-t border-glass mt-2">
                  <span className="text-sm text-foreground-muted block py-2">{displayName}</span>
                </div>
              </div>
            </div>
          )}
        </nav>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
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

function MobileNavLink({ href, children, isActive, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block py-2 px-3 rounded-lg text-base font-medium transition ${
        isActive
          ? 'bg-blue-500/10 text-blue-400'
          : 'text-foreground-muted hover:bg-glass-hover hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  );
}