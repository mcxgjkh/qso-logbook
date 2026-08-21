// src/components/common/AuthGuard.js
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/login');
      else if (!['admin', 'dev'].includes(role)) router.push('/403');
    }
  }, [user, role, isLoading, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-foreground-muted">加载中...</div>;
  }
  if (!user || !['admin', 'dev'].includes(role)) return null;
  return children;
}