// src/lib/validators/qsoValidator.js
import { z } from 'zod';
import { BANDS, MODES, PROPAGATIONS, SATELLITES } from '@/lib/constants';

const bandValues = BANDS.map(b => b.value);
const modeValues = MODES;

// 时间格式：允许 HH:MM 或 HH:MM:SS，去除首尾空格
const timeSchema = z.string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, '时间格式必须为 HH:MM 或 HH:MM:SS')
  .transform(val => val.trim());

// 数字预处理器：只允许有效数字，无效则报错（而非静默转null）
const numberOrNull = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return null;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '') return null;
      const num = parseFloat(trimmed);
      if (isNaN(num)) {
        // 抛出错误，让 zod 捕获并显示错误信息
        throw new Error('请输入有效数字');
      }
      return num;
    }
    if (typeof val === 'number' && !isNaN(val)) return val;
    throw new Error('请输入有效数字');
  },
  z.number().nullable().optional()
);

export const qsoSchema = z.object({
  // 呼号：转大写，去除首尾空格
  call_sign: z.string()
    .min(1, '呼号不能为空')
    .max(20, '呼号不能超过20个字符')
    .transform(s => s.trim().toUpperCase()),
  
  qso_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD')
    .transform(s => s.trim()),
  
  time_on: timeSchema,
  time_off: timeSchema.optional().nullable(),
  
  band: z.string()
    .min(1, '请选择波段')
    .refine(val => bandValues.includes(val), '无效的波段'),
  
  band_rx: z.string()
    .optional()
    .nullable()
    .refine(val => !val || bandValues.includes(val), '无效的接收波段'),
  
  frequency: numberOrNull,
  freq_rx: numberOrNull,
  
  mode: z.string()
    .min(1, '请选择模式')
    .refine(val => modeValues.includes(val), '无效的模式'),
  
  propagation: z.string().optional().nullable(),
  satellite: z.string().optional().nullable(),
  
  rst_sent: z.string().max(3).optional().nullable(),
  rst_rcvd: z.string().max(3).optional().nullable(),
  
  qsl_sent: z.enum(['Y', 'N', 'R']).default('N').optional(),
  qsl_rcvd: z.enum(['Y', 'N', 'R']).default('N').optional(),
  qsl_sent_via: z.enum(['B', 'D', 'E']).optional().nullable(),
  qsl_rcvd_via: z.enum(['B', 'D', 'E']).optional().nullable(),
  
  operator: z.string().max(20).optional().nullable(),
  station_callsign: z.string().max(20).optional().nullable(),
  my_country: z.string().max(50).optional().nullable(),
  country: z.string().max(50).optional().nullable(),
  cqz: z.number().int().optional().nullable(),
  itu_z: z.number().int().optional().nullable(),
  iota: z.string().max(20).optional().nullable(),
  sota: z.string().max(20).optional().nullable(),
  wwff: z.string().max(20).optional().nullable(),
  pota: z.string().max(20).optional().nullable(),
  comment: z.string().optional().nullable(),
  contest_id: z.string().max(50).optional().nullable(),
  uploaded_to_lotw: z.boolean().default(false),
});

export function validateQSO(data) {
  return qsoSchema.safeParse(data);
}