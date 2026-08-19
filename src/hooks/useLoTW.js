import { useState } from 'react';
import { apiClient } from '@/utils/apiClient';

export function useLoTW() {
  const [history, setHistory] = useState([]);
  const upload = async (ids) => { /* POST */ };
  return { upload, history, loading: false };
}
