// src/components/logs/LogFilters.js
'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { BANDS, MODES, PROPAGATIONS } from '@/lib/constants';

export default function LogFilters({ onFilterChange }) {
  const [call, setCall] = useState('');
  const [band, setBand] = useState('');
  const [mode, setMode] = useState('');
  const [propagation, setPropagation] = useState('');
  const [uploaded, setUploaded] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const debouncedCall = useDebounce(call, 500);

  useEffect(() => {
    const newFilters = {};
    if (debouncedCall) newFilters.call = debouncedCall;
    if (band) newFilters.band = band;
    if (mode) newFilters.mode = mode;
    if (propagation) newFilters.propagation = propagation;
    if (uploaded) newFilters.uploaded_to_lotw = uploaded;
    if (startDate) newFilters.start_date = startDate;
    if (endDate) newFilters.end_date = endDate;
    onFilterChange(newFilters);
  }, [debouncedCall, band, mode, propagation, uploaded, startDate, endDate, onFilterChange]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <input
        type="text"
        placeholder="搜索呼号..."
        value={call}
        onChange={(e) => setCall(e.target.value)}
        className="px-3 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      />
      <select
        value={band}
        onChange={(e) => setBand(e.target.value)}
        className="select-custom px-3 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground-muted"
      >
        <option value="">全部波段</option>
        {BANDS.map((b) => (
          <option key={b.value} value={b.value}>{b.label}</option>
        ))}
      </select>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="select-custom px-3 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground-muted"
      >
        <option value="">全部模式</option>
        {MODES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={propagation}
        onChange={(e) => setPropagation(e.target.value)}
        className="select-custom px-3 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground-muted"
      >
        <option value="">全部传播方式</option>
        {PROPAGATIONS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <select
        value={uploaded}
        onChange={(e) => setUploaded(e.target.value)}
        className="select-custom px-3 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground-muted"
      >
        <option value="">LoTW 状态</option>
        <option value="true">已上传</option>
        <option value="false">未上传</option>
      </select>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="px-3 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="px-3 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      />
      <button
        onClick={() => {
          setCall('');
          setBand('');
          setMode('');
          setPropagation('');
          setUploaded('');
          setStartDate('');
          setEndDate('');
          onFilterChange({});
        }}
        className="px-3 py-2 border border-glass rounded-xl bg-glass hover:bg-glass-hover transition text-foreground-muted text-sm"
      >
        重置筛选
      </button>
    </div>
  );
}