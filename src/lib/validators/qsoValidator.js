// src/lib/validators/qsoValidator.js
import { z } from 'zod';
import { BANDS, MODES, PROPAGATIONS, SATELLITES } from '@/lib/constants';

const bandValues = BANDS.map(b => b.value);
const modeValues = MODES;
const propValues = PROPAGATIONS.map(p => p.value);
const satValues = SATELLITES.map(s => s.value);

export const qsoSchema = z.object({
  call_sign: z.string().min(1).max(20, '呼号不能超过20个字符'),
  qso_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD'),
  time_on: z.string().regex(/^\d{2}:\d{2}$/, '时间格式必须为 HH:MM'),
  band: z.string().min(1, '请选择波段').refine(val => bandValues.includes(val), '无效的波段'),
  band_rx: z.string().optional().nullable().refine(val => !val || bandValues.includes(val), '无效的接收波段'),
  frequency: z.number().optional().nullable(),
  freq_rx: z.number().optional().nullable(),
  mode: z.string().min(1, '请选择模式').refine(val => modeValues.includes(val), '无效的模式'),
  propagation: z.string().optional().nullable().refine(val => !val || propValues.includes(val), '无效的传播方式'),
  satellite: z.string().optional().nullable().refine(val => !val || satValues.includes(val), '无效的卫星'),
  rst_sent: z.string().max(3).optional().nullable(),
  rst_rcvd: z.string().max(3).optional().nullable(),
  qsl_sent: z.enum(['Y', 'N', 'R']).default('N'),
  qsl_rcvd: z.enum(['Y', 'N', 'R']).default('N'),
  comment: z.string().optional().nullable(),
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
  contest_id: z.string().max(50).optional().nullable(),
  uploaded_to_lotw: z.boolean().default(false),
});

export function validateQSO(data) {
  return qsoSchema.safeParse(data);
}