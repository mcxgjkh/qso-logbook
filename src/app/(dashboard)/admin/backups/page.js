// src/app/(dashboard)/admin/backups/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/utils/apiClient';

export default function BackupsPage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (!isLoading && role !== 'admin') {
      router.push('/logs');
    }
  }, [isLoading, role, router]);

  useEffect(() => {
    if (role === 'admin') {
      loadBackups();
    }
  }, [role]);

  const loadBackups = async () => {
    try {
      const data = await apiClient('/api/admin/backups');
      setBackups(data.data);
    } catch (error) {
      console.error('Load backups error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (pathname) => {
    setDownloading(pathname);
    try {
      const data = await apiClient(`/api/admin/backups/download?path=${encodeURIComponent(pathname)}`);
      if (data.success && data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      alert('下载失败: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading || loading) {
    return <div className="text-center py-10 text-foreground-muted">加载中...</div>;
  }

  if (role !== 'admin') {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">数据库备份管理</h2>
      
      <div className="mb-4 flex justify-between items-center">
        <span className="text-sm text-foreground-muted">共 {backups.length} 个备份文件</span>
        <button 
          onClick={loadBackups}
          className="px-3 py-1 bg-glass rounded-lg text-sm hover:bg-glass-hover transition"
        >
          刷新
        </button>
      </div>

      {backups.length === 0 ? (
        <p className="text-foreground-muted text-center py-8">暂无备份文件</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-glass">
            <thead className="bg-glass">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">文件名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">大小</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">上传时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass">
              {backups.map((backup) => (
                <tr key={backup.pathname} className="hover:bg-glass-hover transition">
                  <td className="px-4 py-3 text-sm text-foreground">{backup.pathname.replace('backups/', '')}</td>
                  <td className="px-4 py-3 text-sm text-foreground-muted">{formatSize(backup.size)}</td>
                  <td className="px-4 py-3 text-sm text-foreground-muted">
                    {new Date(backup.uploadedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownload(backup.pathname)}
                      disabled={downloading === backup.pathname}
                      className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50"
                    >
                      {downloading === backup.pathname ? '生成中...' : '下载'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}