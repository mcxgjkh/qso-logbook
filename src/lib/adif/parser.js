// src/lib/adif/parser.js

/**
 * 解析ADIF字符串为QSO对象数组
 * @param {string} adifContent - ADIF格式的字符串
 * @returns {Array<Object>} QSO对象数组
 */
export function parseADIF(adifContent) {
  // 处理 BOM（UTF-8 BOM: EF BB BF）
  if (adifContent.charCodeAt(0) === 0xFEFF) {
    adifContent = adifContent.slice(1);
  }

  const qsos = [];
  let data = adifContent;

  // 移除 <EOH> 之前的内容（头部）
  const eohIndex = data.indexOf('<EOH>');
  if (eohIndex !== -1) {
    data = data.substring(eohIndex + 5);
  }

  // 按 <eor> 分割记录（不区分大小写）
  const records = data.split(/<eor>/i);

  for (const record of records) {
    const trimmed = record.trim();
    if (!trimmed) continue;

    const qso = {};
    let i = 0;
    let hasCall = false;
    let hasDate = false;
    let hasTime = false;

    while (i < trimmed.length) {
      if (trimmed[i] !== '<') {
        i++;
        continue;
      }

      const closeBracket = trimmed.indexOf('>', i);
      if (closeBracket === -1) break;

      const fieldDef = trimmed.substring(i + 1, closeBracket);
      const colonIndex = fieldDef.indexOf(':');
      if (colonIndex === -1) break;

      const fieldName = fieldDef.substring(0, colonIndex).toUpperCase();
      let lenStr = fieldDef.substring(colonIndex + 1);
      const typeIndex = lenStr.indexOf(':');
      if (typeIndex !== -1) {
        lenStr = lenStr.substring(0, typeIndex);
      }
      const fieldLen = parseInt(lenStr, 10);
      if (isNaN(fieldLen)) break;

      const valueStart = closeBracket + 1;
      const valueEnd = valueStart + fieldLen;
      if (valueEnd > trimmed.length) break;

      let value = trimmed.substring(valueStart, valueEnd);
      // 移除反斜杠转义（ADIF 使用 \ 转义）
      value = value.replace(/\\/g, '').trim();

      // 字段映射
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
        'PROP_MODE': 'propagation',   // 兼容不同软件
        'PROPAGATION': 'propagation',
        'SAT_NAME': 'satellite',
        'SAT_MODE': 'satellite_mode',
      };

      const targetKey = fieldMap[fieldName];
      if (targetKey) {
        if (['frequency', 'freq_rx', 'cqz', 'itu_z'].includes(targetKey)) {
          qso[targetKey] = parseFloat(value);
          if (isNaN(qso[targetKey])) qso[targetKey] = null;
        } else {
          qso[targetKey] = value;
        }
        // 标记必填字段
        if (targetKey === 'call_sign') hasCall = true;
        if (targetKey === 'qso_date') hasDate = true;
        if (targetKey === 'time_on') {
          hasTime = true;
          // 存储原始格式，供后续判断是否包含秒
          qso._time_on_raw = value;
        }
      } else {
        if (!qso.metadata) qso.metadata = {};
        qso.metadata[fieldName] = value;
      }

      i = valueEnd;
    }

    // 如果有 CALL 且 QSO_DATE 存在，则视为有效
    if (hasCall && hasDate) {
      // 日期格式转换：YYYYMMDD -> YYYY-MM-DD
      if (qso.qso_date && qso.qso_date.length === 8) {
        qso.qso_date = `${qso.qso_date.slice(0, 4)}-${qso.qso_date.slice(4, 6)}-${qso.qso_date.slice(6, 8)}`;
      }
      // 处理时间
      if (qso.time_on) {
        // 如果原始时间包含秒（如 "10:47:06"），保留为 "HH:MM:SS"
        // 如果原始时间为 "104706"，也转为 "10:47:06"
        // 如果原始时间为 "1047"，转为 "10:47"
        let timeStr = qso.time_on;
        if (timeStr.length === 4 && !timeStr.includes(':')) {
          // HHMM -> HH:MM
          timeStr = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;
        } else if (timeStr.length === 6 && !timeStr.includes(':')) {
          // HHMMSS -> HH:MM:SS
          timeStr = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}`;
        }
        qso.time_on = timeStr;
        // 存储原始格式用于导出判断（秒是否包含）
        if (!qso._time_on_raw) qso._time_on_raw = timeStr;
      } else {
        // 如果没有时间，默认 00:00
        qso.time_on = '00:00';
        qso._time_on_raw = '00:00';
      }

      // 处理 time_off
      if (qso.time_off) {
        let timeStr = qso.time_off;
        if (timeStr.length === 4 && !timeStr.includes(':')) {
          timeStr = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;
        } else if (timeStr.length === 6 && !timeStr.includes(':')) {
          timeStr = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}`;
        }
        qso.time_off = timeStr;
      }

      qsos.push(qso);
    }
  }

  return qsos;
}