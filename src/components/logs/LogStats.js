// src/components/logs/LogStats.js
'use client';

import useSWR from 'swr';
import { apiClient } from '@/utils/apiClient';
import { SignalIcon, CalendarIcon, ArrowPathIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const fetcher = (url) => apiClient(url);

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="glass-card rounded-2xl p-6 glass-card-hover">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground-muted">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      </div>
      <Icon className="w-8 h-8 text-blue-400 opacity-80" />
    </div>
  </div>
);

export default function LogStats() {
  const { data, isLoading } = useSWR('/api/qso/stats', fetcher);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const stats = data || { total: 0, monthly: 0, pendingLotw: 0, uniqueCalls: 0 };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard title="总通联" value={stats.total} icon={SignalIcon} />
      <StatCard title="本月通联" value={stats.monthly} icon={CalendarIcon} />
      <StatCard title="待上传 LoTW" value={stats.pendingLotw} icon={ArrowPathIcon} />
      <StatCard title="唯一呼号" value={stats.uniqueCalls} icon={UserGroupIcon} />
    </div>
  );
}