// src/app/(dashboard)/logs/page.js
'use client';

import { useQSOs } from '@/hooks/useQSOs';
import LogTable from '@/components/logs/LogTable';
import LogStats from '@/components/logs/LogStats';
import LogFilters from '@/components/logs/LogFilters';
import { useState, useCallback } from 'react';

export default function LogsPage() {
  const [filters, setFilters] = useState({});
  const { qsos, total, isLoading, deleteQSO, deleteBatch, page, setPage, limit, mutate } =
    useQSOs(filters);

  // 使用 useCallback 避免每次渲染生成新函数
  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []); // 空依赖，因为只依赖 setFilters 和 setPage（它们是稳定的）

  return (
    <div>
      <LogStats />
      <div className="mt-6 glass-card rounded-2xl p-4">
        <LogFilters onFilterChange={handleFilterChange} />
        <LogTable
          qsos={qsos}
          loading={isLoading}
          onDelete={deleteQSO}
          onBatchDelete={deleteBatch}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}