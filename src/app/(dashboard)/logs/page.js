// src/app/(dashboard)/logs/page.js
'use client';

import { useQSOs } from '@/hooks/useQSOs';
import LogTable from '@/components/logs/LogTable';
import LogStats from '@/components/logs/LogStats';
import LogFilters from '@/components/logs/LogFilters';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function LogsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({});
  const { qsos, total, isLoading, deleteQSO, deleteBatch, page, setPage, limit, mutate } =
    useQSOs(filters);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const handleExport = () => {
    // 构建查询参数
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value);
      }
    });
    // 下载文件
    const url = `/api/qso/export/adif?${params.toString()}`;
    window.location.href = url;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <LogStats />
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            导出 ADIF
          </button>
        </div>
      </div>
      
      <div className="glass-card rounded-2xl p-4">
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