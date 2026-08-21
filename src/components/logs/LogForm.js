// src/components/logs/LogForm.js
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { qsoSchema, validateQSO } from '@/lib/validators/qsoValidator';
import { useQSOs } from '@/hooks/useQSOs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { BANDS, MODES, PROPAGATIONS, SATELLITES } from '@/lib/constants';

// 获取今天的日期 YYYY-MM-DD
const getToday = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

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
  const [isEditMode] = useState(mode === 'edit');

  // 如果是编辑模式，只显示单个 QSO
  if (isEditMode) {
    return <EditLogForm logId={logId} />;
  }

  // 新增模式：支持批量新增
  return <BatchLogForm />;
}

// 编辑模式组件（原有功能）
function EditLogForm({ logId }) {
  const router = useRouter();
  const { updateQSO, qsos: existingQsos } = useQSOs();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(qsoSchema),
    defaultValues: defaultQSO,
  });

  useEffect(() => {
    if (logId) {
      const qso = existingQsos.find((q) => q.id === parseInt(logId));
      if (qso) {
        const formattedQso = {
          ...qso,
          qso_date: qso.qso_date ?
            `${qso.qso_date.slice(0, 4)}-${qso.qso_date.slice(4, 6)}-${qso.qso_date.slice(6, 8)}` : '',
        };
        reset(formattedQso);
      }
    }
  }, [logId, existingQsos, reset]);

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        qso_date: data.qso_date.replace(/-/g, ''),
        frequency: data.frequency ? parseFloat(data.frequency) : null,
        freq_rx: data.freq_rx ? parseFloat(data.freq_rx) : null,
      };
      await updateQSO(logId, formattedData);
      router.push('/logs');
    } catch (error) {
      alert('保存失败: ' + error.message);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">编辑通联记录</h2>
      <FormContent register={register} errors={errors} isSubmitting={isSubmitting} handleSubmit={handleSubmit(onSubmit)} />
    </div>
  );
}

// 批量新增模式组件
function BatchLogForm() {
  const router = useRouter();
  const { createQSO } = useQSOs();
  const [qsos, setQsos] = useState([{ ...defaultQSO }]);
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
    defaultValues: qsos[0],
  });

  // 监听表单变化，同步到 qsos
  const watchAll = watch();
  useEffect(() => {
    setQsos((prev) => {
      const newQsos = [...prev];
      newQsos[currentIndex] = { ...watchAll };
      return newQsos;
    });
  }, [watchAll, currentIndex]);

  // 当 currentIndex 变化时，重置表单为对应 QSO 的数据
  useEffect(() => {
    const current = qsos[currentIndex];
    if (current) {
      reset(current);
    }
  }, [currentIndex, qsos, reset]);

  // 添加新 QSO
  const addQSO = () => {
    setQsos((prev) => [...prev, { ...defaultQSO }]);
    setCurrentIndex(qsos.length); // 跳转到新添加的
  };

  // 删除当前 QSO
  const removeCurrentQSO = () => {
    if (qsos.length <= 1) {
      setError('至少保留一个 QSO');
      return;
    }
    setQsos((prev) => prev.filter((_, i) => i !== currentIndex));
    if (currentIndex >= qsos.length - 1) {
      setCurrentIndex(currentIndex - 1);
    }
    setError(null);
  };

  // 提交所有 QSO
  const onSubmitAll = async () => {
    setIsSubmitting(true);
    setError(null);

    // 校验所有 QSO
    const validQsos = [];
    const invalidIndices = [];
    const errorsList = [];

    qsos.forEach((qso, idx) => {
      // 为每个 QSO 添加 user_id（将在后端添加）
      const withUser = { ...qso };
      const result = validateQSO(withUser);
      if (result.success) {
        validQsos.push(result.data);
      } else {
        invalidIndices.push(idx);
        errorsList.push(`第 ${idx+1} 个 QSO: ${result.error.errors.map(e => e.message).join(', ')}`);
      }
    });

    if (validQsos.length === 0) {
      setError('没有有效的 QSO 记录，请检查必填字段');
      setIsSubmitting(false);
      return;
    }

    if (invalidIndices.length > 0) {
      // 提示用户哪些无效，并跳转到第一个无效
      setError(`以下 QSO 无效: ${errorsList.join('; ')}`);
      setCurrentIndex(invalidIndices[0]);
      setIsSubmitting(false);
      return;
    }

    try {
      // 批量插入
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">新增通联记录</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground-muted">
            第 {currentIndex + 1} / {qsos.length} 个 QSO
          </span>
        </div>
      </div>

      {/* 导航栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-3 py-1 border border-glass rounded-lg text-foreground-muted hover:bg-glass-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt; 上一个
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.min(qsos.length - 1, currentIndex + 1))}
            disabled={currentIndex === qsos.length - 1}
            className="px-3 py-1 border border-glass rounded-lg text-foreground-muted hover:bg-glass-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一个 &gt;
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addQSO}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 添加 QSO
          </button>
          <button
            type="button"
            onClick={removeCurrentQSO}
            className="px-3 py-1 bg-red-600/80 text-white rounded-lg hover:bg-red-600"
            disabled={qsos.length <= 1}
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

      {/* 表单内容 */}
      <FormContent
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
        handleSubmit={handleSubmit(onSubmitAll)}
        submitLabel="保存全部 QSO"
        showNavigation={false} // 导航已在上方提供
      />
    </div>
  );
}

// 表单内容（可复用）
function FormContent({ register, errors, isSubmitting, handleSubmit, submitLabel = '保存' }) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            type="text"
            {...register('qso_date')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="YYYY-MM-DD"
          />
          {errors.qso_date && <p className="mt-1 text-sm text-red-400">{errors.qso_date.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            UTC 时间 (HH:MM) <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            {...register('time_on')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="HH:MM"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div>
          <label className="block text-sm font-medium text-foreground-muted">频率 (MHz)</label>
          <input
            type="text"
            {...register('frequency')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="例如: 14.195"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-muted">接收频率 (MHz)</label>
          <input
            type="text"
            {...register('freq_rx')}
            className="mt-1 block w-full px-4 py-2 border border-glass rounded-xl bg-glass focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="例如: 14.195"
          />
        </div>

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
          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isSubmitting ? '保存中...' : submitLabel}
        </button>
      </div>
    </form>
  );
}