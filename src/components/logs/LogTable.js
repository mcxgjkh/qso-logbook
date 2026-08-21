// src/components/logs/LogTable.js
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LogTable({
  qsos,
  loading,
  onDelete,
  onBatchDelete,
  total,
  page,
  limit,
  onPageChange,
  onExport, // 新增：导出回调
}) {
  const safeQsos = Array.isArray(qsos) ? qsos : [];
  const [selected, setSelected] = useState([]);
  const totalPages = Math.ceil(total / limit);

  // 自定义对话框状态
  const [dialog, setDialog] = useState({
    open: false,
    type: 'confirm', // 'confirm' | 'error' | 'info'
    title: '',
    message: '',
    onConfirm: null,
  });

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === safeQsos.length) {
      setSelected([]);
    } else {
      setSelected(safeQsos.map((q) => q.id));
    }
  };

  const closeDialog = () => {
    setDialog({ ...dialog, open: false });
  };

  const showConfirm = (title, message, onConfirm) => {
    setDialog({
      open: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        closeDialog();
        onConfirm();
      },
    });
  };

  const showError = (title, message) => {
    setDialog({
      open: true,
      type: 'error',
      title,
      message,
      onConfirm: null,
    });
  };

  const handleDelete = (qso) => {
    if (qso.uploaded_to_lotw) {
      showError('操作被拒绝', '该记录已上传至 LoTW，禁止删除');
      return;
    }
    showConfirm('确认删除', `确定要删除与 ${qso.call_sign} 的通联记录吗？`, () => {
      onDelete(qso.id);
    });
  };

  const handleBatchDelete = () => {
    if (selected.length === 0) return;

    const hasUploaded = safeQsos
      .filter((q) => selected.includes(q.id))
      .some((q) => q.uploaded_to_lotw);

    if (hasUploaded) {
      showError('操作被拒绝', '选中的记录中包含已上传至 LoTW 的记录，禁止批量删除');
      return;
    }

    showConfirm('确认批量删除', `确定要删除选中的 ${selected.length} 条记录吗？`, () => {
      onBatchDelete(selected);
      setSelected([]);
    });
  };

  const handleExport = () => {
    if (onExport) {
      onExport(selected);
    }
  };

  if (loading) return <div className="text-center py-10 text-foreground-muted">加载日志中...</div>;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
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
                    onClick={closeDialog}
                    className="px-4 py-2 border border-glass rounded-xl text-sm text-foreground-muted hover:bg-glass-hover transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={dialog.onConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition"
                  >
                    确认
                  </button>
                </>
              ) : (
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition"
                >
                  知道了
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 工具栏：批量删除和导出 */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-500/10 border-b border-glass">
          <span className="text-sm text-blue-400">已选 {selected.length} 条</span>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-green-600/80 text-white text-sm rounded-lg hover:bg-green-600 transition"
            >
              导出选中
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1 bg-red-600/80 text-white text-sm rounded-lg hover:bg-red-600 transition"
            >
              批量删除
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-glass">
          <thead className="bg-glass">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selected.length === safeQsos.length && safeQsos.length > 0}
                  onChange={toggleSelectAll}
                  className="checkbox-custom"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">呼号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">日期</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">波段</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">模式</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">LoTW</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass bg-transparent">
            {safeQsos.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-foreground-muted">暂无通联记录</td>
              </tr>
            ) : (
              safeQsos.map((qso) => (
                <tr key={qso.id} className="hover:bg-glass-hover transition bg-transparent">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(qso.id)}
                      onChange={() => toggleSelect(qso.id)}
                      className="checkbox-custom"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{qso.call_sign}</td>
                  <td className="px-4 py-3 text-foreground-muted">{qso.qso_date}</td>
                  <td className="px-4 py-3 text-foreground-muted">{qso.time_on}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-glass rounded-md text-xs text-foreground-muted">{qso.band || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-glass rounded-md text-xs text-foreground-muted">{qso.mode || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {qso.uploaded_to_lotw ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        已传
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-glass text-foreground-muted">
                        未传
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <Link
                      href={`/logs/${qso.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(qso)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-glass border-t border-glass">
          <div className="text-sm text-foreground-muted">
            共 <span className="font-medium text-foreground">{total}</span> 条，
            第 <span className="font-medium text-foreground">{page}</span> / {totalPages} 页
          </div>
          <div className="space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-4 py-2 border border-glass rounded-xl text-sm font-medium text-foreground-muted bg-glass hover:bg-glass-hover disabled:opacity-50 transition"
            >
              上一页
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-4 py-2 border border-glass rounded-xl text-sm font-medium text-foreground-muted bg-glass hover:bg-glass-hover disabled:opacity-50 transition"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}