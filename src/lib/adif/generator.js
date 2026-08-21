// src/lib/adif/generator.js

/**
 * 生成ADIF头部
 * @returns {string} ADIF头部
 */
function generateHeader() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return [
    'ADIF Export from QSO Logbook',
    `<ADIF_VER:5>3.1.4`,
    `<PROGRAMID:11>QSO Logbook`,
    `<PROGRAMVERSION:5>0.1.0`,
    `<CREATED_TIMESTAMP:${timestamp.length}>${timestamp}`,
    '<EOH>',
  ].join('\n');
}

/**
 * 将单个QSO对象转为ADIF记录字符串
 * @param {Object} qso - QSO对象
 * @param {number} index - 序号（用于调试）
 * @returns {string} ADIF记录
 */
function qsoToADIF(qso, index) {
  const fields = [];
  
  // 字段映射：ADIF字段名 -> (qso字段名, 类型转换函数)
  const fieldMap = {
    'CALL': 'call_sign',
    'QSO_DATE': 'qso_date',
    'TIME_ON': 'time_on',
    'TIME_OFF': 'time_off',
    'BAND': 'band',
    'BAND_RX': 'band_rx',
    'FREQ': 'frequency',
    'FREQ_RX': 'freq_rx',
    'MODE': 'mode',
    'SUBMODE': 'sub_mode',
    'RST_SENT': 'rst_sent',
    'RST_RCVD': 'rst_rcvd',
    'QSL_SENT': 'qsl_sent',
    'QSL_RCVD': 'qsl_rcvd',
    'QSL_SENT_VIA': 'qsl_sent_via',
    'QSL_RCVD_VIA': 'qsl_rcvd_via',
    'OPERATOR': 'operator',
    'STATION_CALLSIGN': 'station_callsign',
    'MY_COUNTRY': 'my_country',
    'COUNTRY': 'country',
    'CQZ': 'cqz',
    'ITUZ': 'itu_z',
    'IOTA': 'iota',
    'SOTA': 'sota',
    'WWFF': 'wwff',
    'POTA': 'pota',
    'COMMENT': 'comment',
    'CONTEST_ID': 'contest_id',
    'PROPAGATION': 'propagation',
    'SATELLITE': 'satellite',
  };
  
  for (const [adifField, qsoField] of Object.entries(fieldMap)) {
    let value = qso[qsoField];
    if (value === undefined || value === null || value === '') continue;
    
    // 特殊处理日期格式：YYYY-MM-DD -> YYYYMMDD
    if (qsoField === 'qso_date') {
      value = value.replace(/-/g, '');
      if (value.length !== 8) continue;
    }
    // 时间格式：HH:MM -> HHMM
    if (qsoField === 'time_on' || qsoField === 'time_off') {
      value = value.replace(/:/g, '');
      if (value.length !== 4) continue;
    }
    // 数值转换
    if (['frequency', 'freq_rx', 'cqz', 'itu_z'].includes(qsoField)) {
      if (typeof value === 'number') {
        value = value.toString();
      } else if (typeof value === 'string') {
        const num = parseFloat(value);
        if (isNaN(num)) continue;
        value = num.toString();
      } else {
        continue;
      }
    }
    // 字符串
    if (typeof value !== 'string') {
      value = String(value);
    }
    // 转义反斜杠（ADIF使用\作为转义）
    value = value.replace(/\\/g, '');
    // 字段长度
    const len = value.length;
    fields.push(`<${adifField}:${len}>${value}`);
  }
  
  // 添加额外的metadata字段
  if (qso.metadata) {
    for (const [key, val] of Object.entries(qso.metadata)) {
      if (val !== undefined && val !== null && val !== '') {
        const strVal = String(val);
        fields.push(`<${key.toUpperCase()}:${strVal.length}>${strVal}`);
      }
    }
  }
  
  // 添加结束符
  fields.push('<EOR>');
  return fields.join('');
}

/**
 * 将QSO对象数组转换为ADIF字符串
 * @param {Array<Object>} qsos - QSO对象数组
 * @returns {string} ADIF格式字符串
 */
export function generateADIF(qsos) {
  if (!qsos || qsos.length === 0) {
    return generateHeader() + '\n<EOR>';
  }
  
  const parts = [generateHeader()];
  qsos.forEach((qso, idx) => {
    parts.push(qsoToADIF(qso, idx));
  });
  return parts.join('\n');
}