// src/hooks/useQSOs.js
'use client';

import useSWR, { mutate } from 'swr';
import { apiClient } from '@/utils/apiClient';
import { useState } from 'react';

const fetcher = (url) => apiClient(url);

export function useQSOs(filters = {}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // 过滤掉 undefined 和空字符串
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
  );

  const queryParams = new URLSearchParams({
    page,
    limit,
    ...cleanFilters,
  }).toString();

  const { data, error, isLoading } = useSWR(
    `/api/qso/logs?${queryParams}`,
    fetcher,
    { keepPreviousData: true }
  );

  const createQSO = async (qsoData) => {
    const result = await apiClient('/api/qso/logs', {
      method: 'POST',
      body: JSON.stringify(qsoData),
    });
    mutate(`/api/qso/logs?${queryParams}`);
    return result;
  };

  const updateQSO = async (id, qsoData) => {
    const result = await apiClient(`/api/qso/logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(qsoData),
    });
    mutate(`/api/qso/logs?${queryParams}`);
    return result;
  };

  const deleteQSO = async (id) => {
    await apiClient(`/api/qso/logs/${id}`, { method: 'DELETE' });
    mutate(`/api/qso/logs?${queryParams}`);
  };

  const deleteBatch = async (ids) => {
    await apiClient('/api/qso/logs/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
    mutate(`/api/qso/logs?${queryParams}`);
  };

  return {
    qsos: data?.data || [],
    total: data?.total || 0,
    page,
    limit,
    setPage,
    setLimit,
    isLoading,
    error,
    createQSO,
    updateQSO,
    deleteQSO,
    deleteBatch,
    mutate: () => mutate(`/api/qso/logs?${queryParams}`),
  };
}