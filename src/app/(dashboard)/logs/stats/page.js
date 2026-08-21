// src/app/(dashboard)/logs/stats/page.js
'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { apiClient } from '@/utils/apiClient';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const fetcher = (url) => apiClient(url);

const COLORS = ['#4f8cff', '#a78bfa', '#f59e0b', '#34d399', '#f472b6', '#60a5fa', '#f87171', '#34d399'];

// 加载阶段文本（与首页统计卡片一致）
const LOADING_PHRASES = ['检验服务器连接…', '拉取数据中…', '解密数据中…', '校验数据中…', '渲染图表中…', '加载完成…'];

// 骨架卡片组件
const SkeletonCard = ({ phase }) => (
  <div className="glass-card rounded-2xl p-6 min-h-[100px] flex items-center justify-center">
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-foreground-muted text-sm">{phase}</span>
    </div>
  </div>
);

export default function StatsPage() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const { data, isLoading } = useSWR('/api/qso/stats?days=90', fetcher, {
    revalidateOnFocus: false,
  });

  // 加载时循环切换阶段文本
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

  // 加载状态显示骨架卡片（与首页统计卡片样式一致）
  if (isLoading || !data) {
    const currentPhase = LOADING_PHRASES[phaseIndex];
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">统计看板</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} phase={currentPhase} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 h-80 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-foreground-muted text-sm">{currentPhase}</span>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 h-80 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-foreground-muted text-sm">{currentPhase}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = data;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr.slice(0, 4), parseInt(dateStr.slice(4, 6)) - 1, parseInt(dateStr.slice(6, 8)));
    return `${d.getMonth()+1}/${d.getDate()}`;
  };

  const renderPieLabel = ({ name, percent }) => {
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">统计看板</h2>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-foreground-muted">总通联</p>
          <p className="text-3xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-foreground-muted">本月通联</p>
          <p className="text-3xl font-bold text-foreground">{stats.monthly}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-foreground-muted">待上传 LoTW</p>
          <p className="text-3xl font-bold text-foreground">{stats.pendingLotw}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-foreground-muted">唯一呼号</p>
          <p className="text-3xl font-bold text-foreground">{stats.uniqueCalls}</p>
        </div>
      </div>

      {/* 图表布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">波段分布</h3>
          {stats.bandDistribution.length === 0 ? (
            <p className="text-foreground-muted text-sm">暂无数据</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.bandDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#a3a2a0" fontSize={12} />
                  <YAxis stroke="#a3a2a0" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1b1a',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      color: '#faf9f7',
                    }}
                  />
                  <Bar dataKey="value" fill="#4f8cff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">模式分布</h3>
          {stats.modeDistribution.length === 0 ? (
            <p className="text-foreground-muted text-sm">暂无数据</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.modeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderPieLabel}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {stats.modeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1b1a',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      color: '#faf9f7',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* 通联趋势 */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">通联趋势（最近 {stats.days} 天）</h3>
        {stats.trend.length === 0 || stats.trend.every(d => d.count === 0) ? (
          <p className="text-foreground-muted text-sm">暂无数据</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="#a3a2a0"
                  fontSize={12}
                  tickFormatter={formatDate}
                  interval={Math.floor(stats.trend.length / 20)}
                />
                <YAxis stroke="#a3a2a0" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1b1a',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    color: '#faf9f7',
                  }}
                  labelFormatter={(label) => `日期: ${label.slice(0,4)}-${label.slice(4,6)}-${label.slice(6,8)}`}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#a78bfa' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 底部：顶部呼号 + 年度统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top 10 通联呼号</h3>
          {stats.topCalls.length === 0 ? (
            <p className="text-foreground-muted text-sm">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {stats.topCalls.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-foreground-muted w-5">{index + 1}</span>
                    <span className="text-foreground font-medium">{item.name}</span>
                  </div>
                  <span className="text-foreground-muted text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">年度统计</h3>
          {stats.yearStats.length === 0 ? (
            <p className="text-foreground-muted text-sm">暂无数据</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.yearStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#a3a2a0" fontSize={12} />
                  <YAxis stroke="#a3a2a0" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1b1a',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      color: '#faf9f7',
                    }}
                  />
                  <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}