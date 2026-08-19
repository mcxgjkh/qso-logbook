// src/utils/apiClient.js
export async function apiClient(endpoint, options = {}) {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || '请求失败');
  }
  return res.json();
}