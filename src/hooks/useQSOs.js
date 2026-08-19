import { useEffect, useState } from 'react';
import { apiClient } from '@/utils/apiClient';

export function useQSOs(filters = {}) {
  const [qsos, setQsos] = useState([]);
  const [loading, setLoading] = useState(true);
  // 实现 CRUD
  return { qsos, loading, refetch, create, update, remove };
}
