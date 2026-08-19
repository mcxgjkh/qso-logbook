// src/app/(dashboard)/logs/new/page.js
'use client';

import LogForm from '@/components/logs/LogForm';

export default function NewLogPage() {
  return <LogForm mode="create" />;
}