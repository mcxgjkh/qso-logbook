// src/components/logs/LogStats.js
'use client';

import useSWR from 'swr';
import { apiClient } from '@/utils/apiClient';
import { SignalIcon, CalendarIcon, ArrowPathIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

const fetcher = (url) => apiClient(url);

const LOADING_PHRASES = ['检验服务器连接…', '拉取数据中…', '校验数据中…'];

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="glass-card rounded-2xl p-4 min-h-[100px] flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm font-medium text-foreground-muted">{title}</p>
        <p className="text-xl sm:text-3xl font-bold text-foreground mt-1">{value}</p>
      </div>
      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 opacity-80" />
    </div>
  </div>
);

const SkeletonCard = ({ phase }) => (
  <div className="glass-card rounded-2xl p-4 min-h-[100px] flex items-center justify-center">
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-foreground-muted text-xs sm:text-sm">{phase}</span>
    </div>
  </div>
);

export default function LogStats() {
  const { data, isLoading } = useSWR('/api/qso/stats', fetcher, {
    fallbackData: null,
    revalidateOnFocus: false,
  });

  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setPhaseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setPhaseIndex(0);
    }
  }, [isLoading]);

  if (isLoading || !data) {
    const currentPhase = LOADING_PHRASES[phaseIndex];
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} phase={currentPhase} />
        ))}
      </div>
    );
  }

  const stats = data || { total: 0, monthly: 0, pendingLotw: 0, uniqueCalls: 0 };

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-8">
      <StatCard title="总通联" value={stats.total} icon={SignalIcon} />
      <StatCard title="本月通联" value={stats.monthly} icon={CalendarIcon} />
      <StatCard title="待上传 LoTW" value={stats.pendingLotw} icon={ArrowPathIcon} />
      <StatCard title="唯一呼号" value={stats.uniqueCalls} icon={UserGroupIcon} />
    </div>
  );
}