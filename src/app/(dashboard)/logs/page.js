// src/app/(dashboard)/logs/page.js
'use client';

import { useQSOs } from '@/hooks/useQSOs';
import LogTable from '@/components/logs/LogTable';
import LogStats from '@/components/logs/LogStats';
import LogFilters from '@/components/logs/LogFilters';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/utils/apiClient';

export default function LogsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const { qsos, total, isLoading, deleteQSO, deleteBatch, page, setPage, limit, mutate } =
    useQSOs(filters);

  // 对话框状态
  const [dialog, setDialog] = useState({
    open: false,
    type: 'confirm', // 'confirm' | 'info'
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  // 导出
  const handleExport = () => {
    const selectedIds = qsos.filter(q => q.selected).map(q => q.id); // 需在表格中维护选中状态
    // 由于选中状态在 LogTable 内部管理，我们需要通过 ref 或回调获取选中的 ID
    // 这里我们通过 LogTable 暴露 selected 状态，或者我们直接在 LogTable 中处理导出按钮
  };

  // 由于导出逻辑与表格选中状态紧密相关，我们改为在 LogTable 内部添加导出按钮，或通过回调传递 selected
  // 简化：我们直接在 LogTable 中处理，导出逻辑移到 LogTable 内部，由父组件提供导出函数

  // 但按需求，我们修改 LogTable，增加导出按钮
  // 同时，删除后刷新：在 onDelete 和 onBatchDelete 回调中调用 mutate()
  // 但 LogTable 已有 onDelete 和 onBatchDelete 回调，我们在回调中调用 mutate

  // 我们修改 LogsPage 的 delete 回调
  const handleDelete = async (id) => {
    await deleteQSO(id);
    mutate(); // 刷新列表
  };

  const handleBatchDelete = async (ids) => {
    await deleteBatch(ids);
    mutate(); // 刷新列表
  };

  // 显示对话框（用于导出提示）
  const showDialog = (title, message, type = 'confirm', onConfirm, onCancel) => {
    setDialog({
      open: true,
      type,
      title,
      message,
      onConfirm: () => {
        setDialog({ ...dialog, open: false });
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setDialog({ ...dialog, open: false });
        if (onCancel) onCancel();
      },
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <LogStats />
        <div className="flex gap-2">
          {/* 导出按钮由 LogTable 内部管理，或者我们放在这里 */}
          {/* 我们直接在 LogTable 内部添加导出按钮，因为它需要知道选中哪些记录 */}
          {/* 因此移除外部的导出按钮 */}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <LogFilters onFilterChange={handleFilterChange} />
        <LogTable
          qsos={qsos}
          loading={isLoading}
          onDelete={handleDelete}
          onBatchDelete={handleBatchDelete}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onExport={(selectedIds) => {
            // 导出逻辑
            if (selectedIds.length === 0) {
              showDialog(
                '导出确认',
                '您没有勾选任何记录，是否导出全部记录？',
                'confirm',
                async () => {
                  // 导出全部
                  const params = new URLSearchParams();
                  Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== '') {
                      params.append(key, value);
                    }
                  });
                  window.location.href = `/api/qso/export/adif?${params.toString()}`;
                },
                () => {
                  // 去勾选，不做任何事
                }
              );
              return;
            }
            // 导出勾选的
            const params = new URLSearchParams();
            selectedIds.forEach(id => params.append('ids', id));
            window.location.href = `/api/qso/export/adif?${params.toString()}`;
          }}
        />
      </div>

      {/* 自定义对话框 */}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground mb-2">{dialog.title}</h3>
            <p className="text-foreground-muted mb-6">{dialog.message}</p>
            <div className="flex justify-end space-x-3">
              {dialog.type === 'confirm' ? (
                <>
                  <button
                    onClick={dialog.onCancel}
                    className="px-4 py-2 border border-glass rounded-xl text-sm text-foreground-muted hover:bg-glass-hover transition"
                  >
                    去勾选
                  </button>
                  <button
                    onClick={dialog.onConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition"
                  >
                    确定导出
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setDialog({ ...dialog, open: false })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition"
                >
                  知道了
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}