'use client';

import { useAuth } from '@/hooks/useAuth';

export default function LogoutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={signOut}
      className="text-sm text-foreground-muted hover:text-foreground transition"
    >
      登出
    </button>
  );
}