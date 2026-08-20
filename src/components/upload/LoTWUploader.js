// src/components/upload/LoTWUploader.js
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

const fetcher = (url) => apiClient(url);

export default function LoTWUploader() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedStation, setSelectedStation] = useState('');

  // 获取待上传QSO数量
  const { data: stats, mutate: refreshStats } = useSWR('/api/qso/stats', fetcher, {
    refreshInterval: 30000,
  });

  // 获取上传历史
  const { data: historyData, isLoading: historyLoading } = useSWR(
    '/api/qso/upload/lotw/history?limit=10',
    fetcher
  );

  // 获取台站列表
  const { data: stationsData, isLoading: stationsLoading } = useSWR(
    '/api/user/lotw-stations',
    fetcher
  );

  // 当台站列表加载完成时，自动选中默认台站
  useEffect(() => {
    if (stationsData?.data && stationsData.data.length > 0) {
      const defaultStation = stationsData.data.find(s => s.default);
      if (defaultStation) {
        setSelectedStation(defaultStation.name);
      } else {
        setSelectedStation(stationsData.data[0].name);
      }
    }
  }, [stationsData]);

  const pendingCount = stats?.pendingLotw || 0;
  const stations = stationsData?.data || [];

  const handleUpload = async () => {
    if (pendingCount === 0) {
      setError('没有待上传的QSO');
      return;
    }
    if (!selectedStation) {
      setError('请选择一个台站位置');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient('/api/qso/upload/lotw', {
        method: 'POST',
        body: JSON.stringify({ station_name: selectedStation }),
      });

      setResult(response.data);
      await refreshStats();
    } catch (err) {
      setError(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">成功</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">失败</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">待处理</span>;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">LoTW 上传</h2>

      {/* 状态卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-glass rounded-xl p-4">
          <p className="text-sm text-foreground-muted">待上传QSO</p>
          <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
        </div>
        <div className="bg-glass rounded-xl p-4">
          <p className="text-sm text-foreground-muted">上次上传</p>
          <p className="text-sm text-foreground-muted">
            {historyData?.data?.[0]
              ? new Date(historyData.data[0].uploaded_at).toLocaleString()
              : '暂无记录'}
          </p>
        </div>
        <div className="bg-glass rounded-xl p-4">
          <p className="text-sm text-foreground-muted">历史记录</p>
          <p className="text-2xl font-bold text-foreground">{historyData?.pagination?.total || 0}</p>
        </div>
      </div>

      {/* 台站选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground-muted">台站位置</label>
        {stationsLoading ? (
          <div className="mt-1 text-foreground-muted text-sm">加载台站列表中...</div>
        ) : stations.length === 0 ? (
          <div className="mt-1 text-yellow-400 text-sm">
            暂无台站配置，请前往 <button 
              onClick={() => router.push('/settings')} 
              className="text-blue-400 hover:underline"
            >
              设置页面
            </button> 添加。
          </div>
        ) : (
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground"
          >
            {stations.map((station) => (
              <option key={station.id} value={station.name}>
                {station.name} {station.default ? '(默认)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 上传按钮 */}
      <button
        onClick={handleUpload}
        disabled={uploading || pendingCount === 0 || stations.length === 0 || !selectedStation}
        className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            上传中...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            上传到 LoTW ({pendingCount} 条待上传)
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className={`mt-4 p-3 rounded-xl text-sm ${
          result.success
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
        }`}>
          <p>{result.message}</p>
          {result.uploaded !== undefined && (
            <p className="text-xs mt-1">成功上传 {result.uploaded} 条记录</p>
          )}
          {result.output && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-foreground-muted">查看详细输出</summary>
              <pre className="mt-1 text-xs bg-black/30 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                {result.output}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* 上传历史 */}
      <div className="mt-6 pt-6 border-t border-glass">
        <h3 className="text-sm font-medium text-foreground-muted mb-3">最近上传记录</h3>
        {historyLoading ? (
          <div className="text-center py-4 text-foreground-muted text-sm">加载中...</div>
        ) : !historyData?.data || historyData.data.length === 0 ? (
          <div className="text-center py-4 text-foreground-muted text-sm">暂无上传记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-glass">
              <thead className="bg-glass">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-foreground-muted">时间</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-foreground-muted">QSO数</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-foreground-muted">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass">
                {historyData.data.map((item) => (
                  <tr key={item.id} className="hover:bg-glass-hover transition">
                    <td className="px-3 py-2 text-sm text-foreground-muted">
                      {new Date(item.uploaded_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-sm text-foreground-muted">{item.record_count}</td>
                    <td className="px-3 py-2">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}