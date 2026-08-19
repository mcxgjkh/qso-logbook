import { NextResponse } from 'next/server';
import { getAuthenticatedUser, successResponse, errorResponse } from '@/lib/api-helpers';

// 简单缓存（内存，生产可用 Redis）
const cache = new Map();

export async function GET(request) {
  try {
    const { user } = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const call = searchParams.get('call');

    if (!call || call.length < 2) {
      return errorResponse('call parameter is required (min 2 chars)', 400);
    }

    // 检查缓存（5分钟）
    const cacheKey = call.toUpperCase();
    if (cache.has(cacheKey) && (Date.now() - cache.get(cacheKey).timestamp < 300000)) {
      return successResponse(cache.get(cacheKey).data, 'From cache');
    }

    // 这里调用 QRZ.com API 或 HamQTH
    // 示例：使用 QRZ.com XML 接口（需 API key）
    // 为了演示，我们返回模拟数据
    // 实际实现时请使用 axios/fetch 调用外部 API

    const mockData = {
      call: call.toUpperCase(),
      name: 'John Doe',
      country: 'United States',
      grid: 'FM18',
      qth: 'New York',
      state: 'NY',
      cqz: 5,
      itu: 8,
    };

    // 存入缓存
    cache.set(cacheKey, { data: mockData, timestamp: Date.now() });

    return successResponse(mockData, 'QRZ lookup successful');
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error('GET /qrz error:', err);
    return errorResponse('QRZ lookup failed', 500);
  }
}