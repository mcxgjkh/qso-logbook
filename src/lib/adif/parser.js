// src/lib/adif/parser.js
export function parseADIF(adifContent) {
  // 处理 BOM
  if (adifContent.charCodeAt(0) === 0xFEFF) {
    adifContent = adifContent.slice(1);
  }

  const qsos = [];
  let data = adifContent;

  // 移除头部
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
      // 移除反斜杠转义
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
        'PROP_MODE': 'propagation',   // 注意不同软件可能用 PROP_MODE
        'PROPAGATION': 'propagation',
        'SAT_NAME': 'satellite',
        'SAT_MODE': 'satellite_mode', // 可选，不强制
      };

      const targetKey = fieldMap[fieldName];
      if (targetKey) {
        // 数值类型转换
        if (['frequency', 'freq_rx', 'cqz', 'itu_z'].includes(targetKey)) {
          qso[targetKey] = parseFloat(value);
          if (isNaN(qso[targetKey])) qso[targetKey] = null;
        } else {
          qso[targetKey] = value;
        }
        // 标记必填字段
        if (targetKey === 'call_sign') hasCall = true;
        if (targetKey === 'qso_date') hasDate = true;
        if (targetKey === 'time_on') hasTime = true;
      } else {
        // 未知字段保存到 metadata
        if (!qso.metadata) qso.metadata = {};
        qso.metadata[fieldName] = value;
      }

      i = valueEnd;
    }

    // 检查是否包含必要字段
    if (hasCall && hasDate && hasTime) {
      // 日期格式转换：YYYYMMDD -> YYYY-MM-DD
      if (qso.qso_date && qso.qso_date.length === 8) {
        qso.qso_date = `${qso.qso_date.slice(0, 4)}-${qso.qso_date.slice(4, 6)}-${qso.qso_date.slice(6, 8)}`;
      }
      // 时间格式转换：HHMM 或 HHMMSS -> HH:MM
      if (qso.time_on && qso.time_on.length === 4) {
        qso.time_on = `${qso.time_on.slice(0, 2)}:${qso.time_on.slice(2, 4)}`;
      } else if (qso.time_on && qso.time_on.length === 6) {
        qso.time_on = `${qso.time_on.slice(0, 2)}:${qso.time_on.slice(2, 4)}`;
      }
      // 处理 time_off
      if (qso.time_off && qso.time_off.length === 4) {
        qso.time_off = `${qso.time_off.slice(0, 2)}:${qso.time_off.slice(2, 4)}`;
      } else if (qso.time_off && qso.time_off.length === 6) {
        qso.time_off = `${qso.time_off.slice(0, 2)}:${qso.time_off.slice(2, 4)}`;
      }

      qsos.push(qso);
    }
  }

  return qsos;
}