// src/components/logs/LogForm.js
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { qsoSchema, validateQSO } from '@/lib/validators/qsoValidator';
import { useQSOs } from '@/hooks/useQSOs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { BANDS, MODES, PROPAGATIONS, SATELLITES } from '@/lib/constants';

const getToday = () => new Date().toISOString().slice(0, 10);

const defaultQSO = {
  call_sign: '',
  qso_date: getToday(),
  time_on: '',
  time_off: '',
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
  const { createQSO, updateQSO, qsos: existingQsos } = useQSOs();
  const isEdit = mode === 'edit';

  // 编辑模式直接使用单条
  if (isEdit) {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
      resolver: zodResolver(qsoSchema),
      defaultValues: defaultQSO,
    });

    useEffect(() => {
      if (logId) {
        const qso = existingQsos.find((q) => q.id === parseInt(logId));
        if (qso) {
          const formatted = {
            ...qso,
            qso_date: qso.qso_date ? `${qso.qso_date.slice(0,4)}-${qso.qso_date.slice(4,6)}-${qso.qso_date.slice(6,8)}` : '',
          };
          reset(formatted);
        }
      }
    }, [logId, existingQsos, reset]);

    const onSubmit = async (data) => {
      try {
        const formatted = {
          ...data,
          qso_date: data.qso_date.replace(/-/g, ''),
          frequency: data.frequency ? parseFloat(data.frequency) : null,
          freq_rx: data.freq_rx ? parseFloat(data.freq_rx) : null,
        };
        await updateQSO(logId, formatted);
        router.push('/logs');
      } catch (err) {
        alert('保存失败: ' + err.message);
      }
    };

    return (
      <div className="glass-card rounded-2xl p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">编辑通联记录</h2>
        <FormContent register={register} errors={errors} isSubmitting={isSubmitting} handleSubmit={handleSubmit(onSubmit)} />
      </div>
    );
  }

  // ---- 新增模式（支持批量） ----
  const [qsoList, setQsoList] = useState([{ ...defaultQSO }]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(qsoSchema),
    defaultValues: qsoList[0],
  });

  const watchAll = watch();
  useEffect(() => {
    setQsoList((prev) => {
      const newList = [...prev];
      newList[currentIndex] = { ...watchAll };
      return newList;
    });
  }, [watchAll, currentIndex]);

  useEffect(() => {
    if (qsoList[currentIndex]) {
      reset(qsoList[currentIndex]);
    }
  }, [currentIndex, qsoList, reset]);

  const addQSO = () => {
    setQsoList((prev) => [...prev, { ...defaultQSO }]);
    setCurrentIndex(qsoList.length);
  };

  const removeCurrentQSO = () => {
    if (qsoList.length <= 1) {
      setError('至少保留一个 QSO');
      return;
    }
    const newList = qsoList.filter((_, i) => i !== currentIndex);
    setQsoList(newList);
    if (currentIndex >= newList.length) {
      setCurrentIndex(newList.length - 1);
    }
    setError(null);
  };

  const prevQSO = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const nextQSO = () => {
    if (currentIndex < qsoList.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const onSubmitAll = async () => {
    setIsSubmitting(true);
    setError(null);

    const validQsos = [];
    const errorsList = [];

    qsoList.forEach((qso, idx) => {
      const result = validateQSO(qso);
      if (result.success) {
        validQsos.push(result.data);
      } else {
        errorsList.push(`第 ${idx+1} 个: ${result.error.errors.map(e => e.message).join(', ')}`);
      }
    });

    if (validQsos.length === 0) {
      setError('没有有效的 QSO 记录');
      setIsSubmitting(false);
      return;
    }

    if (errorsList.length > 0) {
      setError(`以下 QSO 无效: ${errorsList.join('; ')}`);
      // 跳转到第一个无效
      const firstInvalid = qsoList.findIndex((_, i) => {
        const result = validateQSO(qsoList[i]);
        return !result.success;
      });
      if (firstInvalid !== -1) setCurrentIndex(firstInvalid);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/qso/logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qsos: validQsos }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '批量导入失败');
      }
      router.push('/logs');
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-foreground">新增通联记录</h2>
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <span>第 {currentIndex + 1} / {qsoList.length} 个</span>
        </div>
      </div>

      {/* 导航栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prevQSO}
            disabled={currentIndex === 0}
            className="p-2 border border-glass rounded-lg text-foreground-muted hover:bg-glass-hover disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="上一个"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextQSO}
            disabled={currentIndex === qsoList.length - 1}
            className="p-2 border border-glass rounded-lg text-foreground-muted hover:bg-glass-hover disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="下一个"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addQSO}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + 添加 QSO
          </button>
          <button
            type="button"
            onClick={removeCurrentQSO}
            className="px-3 py-1 bg-red-600/80 text-white rounded-lg hover:bg-red-600 text-sm"
            disabled={qsoList.length <= 1}
          >
            删除当前
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <FormContent
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
        handleSubmit={handleSubmit(onSubmitAll)}
        submitLabel="保存全部 QSO"
      />
    </div>
  );
}

// 表单内容（可复用）
function FormContent({ register, errors, isSubmitting, handleSubmit, submitLabel = '保存' }) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            呼号 <span className="text-red-400">*</span>
          </label>
          <input
            {...register('call_sign')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
            placeholder="例如: BA1AA"
          />
          {errors.call_sign && <p className="mt-1 text-xs text-red-400">{errors.call_sign.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            UTC 日期 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            {...register('qso_date')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
            placeholder="YYYY-MM-DD"
          />
          {errors.qso_date && <p className="mt-1 text-xs text-red-400">{errors.qso_date.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            UTC 时间 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            {...register('time_on')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
            placeholder="HH:MM"
          />
          {errors.time_on && <p className="mt-1 text-xs text-red-400">{errors.time_on.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            模式 <span className="text-red-400">*</span>
          </label>
          <select
            {...register('mode')}
            className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base text-foreground"
          >
            <option value="">请选择模式</option>
            {MODES.map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
          {errors.mode && <p className="mt-1 text-xs text-red-400">{errors.mode.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            波段 <span className="text-red-400">*</span>
          </label>
          <select
            {...register('band')}
            className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base text-foreground"
          >
            <option value="">请选择波段</option>
            {BANDS.map((band) => (
              <option key={band.value} value={band.value}>{band.label}</option>
            ))}
          </select>
          {errors.band && <p className="mt-1 text-xs text-red-400">{errors.band.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground-muted">接收波段</label>
          <select
            {...register('band_rx')}
            className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base text-foreground"
          >
            <option value="">无</option>
            {BANDS.map((band) => (
              <option key={band.value} value={band.value}>{band.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">频率 (MHz)</label>
          <input
            type="text"
            {...register('frequency')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
            placeholder="例如: 14.195"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">接收频率 (MHz)</label>
          <input
            type="text"
            {...register('freq_rx')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
            placeholder="例如: 14.195"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">传播方式</label>
          <select
            {...register('propagation')}
            className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base text-foreground"
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
            className="select-custom mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base text-foreground"
          >
            {SATELLITES.map((sat) => (
              <option key={sat.value} value={sat.value}>{sat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">RST 发送</label>
          <input
            {...register('rst_sent')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
            placeholder="59"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">RST 接收</label>
          <input
            {...register('rst_rcvd')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
            placeholder="59"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground-muted">备注</label>
        <textarea
          {...register('comment')}
          rows="3"
          className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm sm:text-base"
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
          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isSubmitting ? '保存中...' : submitLabel}
        </button>
      </div>
    </form>
  );
}