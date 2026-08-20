// src/components/logs/LogForm.js
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { qsoSchema } from '@/lib/validators/qsoValidator';
import { useQSOs } from '@/hooks/useQSOs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BANDS, MODES, PROPAGATIONS, SATELLITES } from '@/lib/constants';

// 获取今天的日期 YYYY-MM-DD
const getToday = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

const defaultValues = {
  call_sign: '',
  qso_date: getToday(),
  time_on: '',
  band: '',
  band_rx: '',
  frequency: '',
  freq_rx: '',
  mode: '',
  propagation: '',
  satellite: '',
  rst_sent: '59',
  rst_rcvd: '59',
  qsl_sent: 'N',
  qsl_rcvd: 'N',
  comment: '',
};

export default function LogForm({ mode, logId = null }) {
  const router = useRouter();
  const { createQSO, updateQSO, qsos } = useQSOs();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(qsoSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'edit' && logId) {
      const qso = qsos.find((q) => q.id === parseInt(logId));
      if (qso) {
        const formattedQso = {
          ...qso,
          qso_date: qso.qso_date ?
            `${qso.qso_date.slice(0, 4)}-${qso.qso_date.slice(4, 6)}-${qso.qso_date.slice(6, 8)}` : '',
        };
        reset(formattedQso);
      }
    }
  }, [mode, logId, qsos, reset]);

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        qso_date: data.qso_date.replace(/-/g, ''),
        frequency: data.frequency ? parseFloat(data.frequency) : null,
        freq_rx: data.freq_rx ? parseFloat(data.freq_rx) : null,
      };
      if (mode === 'create') {
        await createQSO(formattedData);
      } else {
        await updateQSO(logId, formattedData);
      }
      router.push('/logs');
    } catch (error) {
        if (error.message?.includes('重复') || error.code === 'DUPLICATE_QSO') {
            alert('该QSO已存在，无法重复添加');
        } else {
            alert('保存失败: ' + error.message);
        }
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {mode === 'create' ? '新增通联记录' : '编辑通联记录'}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 2列布局，每行两个字段 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 行1：呼号 | UTC日期 */}
          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              呼号 <span className="text-red-400">*</span>
            </label>
            <input
              {...register('call_sign')}
              className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="例如: BA1AA"
            />
            {errors.call_sign && <p className="mt-1 text-sm text-red-400">{errors.call_sign.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              UTC 日期 <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              {...register('qso_date')}
              className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            {errors.qso_date && <p className="mt-1 text-sm text-red-400">{errors.qso_date.message}</p>}
          </div>

          {/* 行2：UTC时间 | 模式 */}
          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              UTC 时间 (HH:MM) <span className="text-red-400">*</span>
            </label>
            <input
              type="time"
              step="60"
              {...register('time_on')}
              className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            {errors.time_on && <p className="mt-1 text-sm text-red-400">{errors.time_on.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              模式 <span className="text-red-400">*</span>
            </label>
            <select
              {...register('mode')}
              className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground"
            >
              <option value="">请选择模式</option>
              {MODES.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
            {errors.mode && <p className="mt-1 text-sm text-red-400">{errors.mode.message}</p>}
          </div>

          {/* 行3：波段 | 接收波段 */}
          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              波段 <span className="text-red-400">*</span>
            </label>
            <select
              {...register('band')}
              className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground"
            >
              <option value="">请选择波段</option>
              {BANDS.map((band) => (
                <option key={band.value} value={band.value}>{band.label}</option>
              ))}
            </select>
            {errors.band && <p className="mt-1 text-sm text-red-400">{errors.band.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">接收波段</label>
            <select
              {...register('band_rx')}
              className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground"
            >
              <option value="">无</option>
              {BANDS.map((band) => (
                <option key={band.value} value={band.value}>{band.label}</option>
              ))}
            </select>
          </div>

          {/* 行4：频率 | 接收频率 */}
          <div>
            <label className="block text-sm font-medium text-foreground-muted">频率 (MHz)</label>
            <input
              type="number"
              step="0.0001"
              {...register('frequency')}
              className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="例如: 14.195"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">接收频率 (MHz)</label>
            <input
              type="number"
              step="0.0001"
              {...register('freq_rx')}
              className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="例如: 14.195"
            />
          </div>

          {/* 行5：传播方式 | 卫星 */}
          <div>
            <label className="block text-sm font-medium text-foreground-muted">传播方式</label>
            <select
              {...register('propagation')}
              className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground"
            >
              {PROPAGATIONS.map((prop) => (
                <option key={prop.value} value={prop.value}>{prop.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">卫星</label>
            <select
              {...register('satellite')}
              className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-foreground"
            >
              {SATELLITES.map((sat) => (
                <option key={sat.value} value={sat.value}>{sat.label}</option>
              ))}
            </select>
          </div>

          {/* 行6：RST发送 | RST接收 */}
          <div>
            <label className="block text-sm font-medium text-foreground-muted">RST 发送</label>
            <input
              {...register('rst_sent')}
              className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="59"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-muted">RST 接收</label>
            <input
              {...register('rst_rcvd')}
              className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="59"
            />
          </div>
        </div>

        {/* 备注 - 全宽 */}
        <div>
          <label className="block text-sm font-medium text-foreground-muted">备注</label>
          <textarea
            {...register('comment')}
            rows="3"
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-glass">
          <button
            type="button"
            onClick={() => router.push('/logs')}
            className="px-6 py-2 border border-glass rounded-xl text-sm font-medium text-foreground-muted bg-glass hover:bg-glass-hover transition"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}