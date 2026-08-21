// src/app/api/user/lotw-stations/route.js
import { authenticate, successResponse, errorResponse } from '@/lib/api-helpers';
import { randomUUID } from 'crypto';
import { logInfo, logError } from '@/lib/logger';

export async function GET(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const { data, error } = await supabase
      .from('user_lotw_configs')
      .select('station_locations')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return successResponse([], '无配置');
      }
      return errorResponse(error.message, 'DB_ERROR', 500);
    }
    return successResponse(data?.station_locations || []);
  } catch (err) {
    if (err instanceof Response) return err;
    logError('GET /api/user/lotw-stations', err);
    return errorResponse('内部错误', 'SERVER_ERROR', 500);
  }
}

export async function POST(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const body = await request.json();
    const { name, dxcc, grid, itu, cqz, iota, default: isDefault, id } = body;

    // 必填字段校验（CQ和ITU已改为可选）
    if (!name || !dxcc || !grid) {
      return errorResponse('名称、DXCC、网格定位为必填', 'MISSING_FIELDS', 400);
    }

    // 获取现有配置
    const { data: config, error: fetchError } = await supabase
      .from('user_lotw_configs')
      .select('station_locations')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return errorResponse('请先上传 .p12 证书', 'NO_CONFIG', 400);
      }
      return errorResponse(fetchError.message, 'DB_ERROR', 500);
    }

    let locations = config?.station_locations || [];
    const newStation = {
      id: id || randomUUID(),
      name,
      dxcc: parseInt(dxcc),
      grid: grid.toUpperCase().trim(),
      itu: itu ? parseInt(itu) : null,
      cqz: cqz ? parseInt(cqz) : null,
      iota: iota || '',
      default: isDefault || false,
    };

    if (id) {
      // 更新现有台站
      locations = locations.map((s) =>
        s.id === id ? { ...s, ...newStation } : s
      );
    } else {
      // 添加新台站
      locations.push(newStation);
    }

    // 如果设为默认，清除其他默认
    if (isDefault) {
      locations = locations.map((s) => ({
        ...s,
        default: s.id === newStation.id,
      }));
    }

    // 更新数据库
    const { error: updateError } = await supabase
      .from('user_lotw_configs')
      .update({ station_locations: locations, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (updateError) {
      return errorResponse(updateError.message, 'DB_ERROR', 500);
    }

    logInfo('台站已保存', { userId: user.id, station: newStation.name });
    return successResponse(locations, '台站已保存');
  } catch (err) {
    if (err instanceof Response) return err;
    logError('POST /api/user/lotw-stations', err);
    return errorResponse('内部错误', 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request) {
  try {
    const { user, supabase } = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('缺少台站ID', 'MISSING_ID', 400);

    const { data: config, error: fetchError } = await supabase
      .from('user_lotw_configs')
      .select('station_locations')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) return errorResponse(fetchError.message, 'DB_ERROR', 500);

    let locations = (config?.station_locations || []).filter((s) => s.id !== id);
    const { error: updateError } = await supabase
      .from('user_lotw_configs')
      .update({ station_locations: locations, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (updateError) return errorResponse(updateError.message, 'DB_ERROR', 500);
    return successResponse(locations, '已删除');
  } catch (err) {
    if (err instanceof Response) return err;
    logError('DELETE /api/user/lotw-stations', err);
    return errorResponse('内部错误', 'SERVER_ERROR', 500);
  }
}