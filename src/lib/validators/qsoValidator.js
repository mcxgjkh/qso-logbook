// src/lib/validators/qsoValidator.js
import { z } from 'zod';

// 允许 HH:MM 或 HH:MM:SS
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

export const qsoSchema = z.object({
  call_sign: z.string().min(1).max(20, '呼号不能超过20个字符'),
  qso_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD'),
  time_on: z.string().regex(timeRegex, '时间格式必须为 HH:MM 或 HH:MM:SS'),
  // 以下字段可选，不强制
  time_off: z.string().regex(timeRegex).optional().nullable(),
  band: z.string().max(20).optional().nullable(),
  band_rx: z.string().max(20).optional().nullable(),
  frequency: z.number().optional().nullable(),
  freq_rx: z.number().optional().nullable(),
  mode: z.string().max(20).optional().nullable(),
  sub_mode: z.string().max(20).optional().nullable(),
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
  propagation: z.string().max(30).optional().nullable(),
  satellite: z.string().max(50).optional().nullable(),
  uploaded_to_lotw: z.boolean().default(false),
});

export function validateQSO(data) {
  return qsoSchema.safeParse(data);
}