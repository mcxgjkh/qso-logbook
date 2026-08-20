// src/lib/adif/parser.js

/**
 * 解析ADIF字符串为QSO对象数组
 * @param {string} adifContent - ADIF格式的字符串
 * @returns {Array<Object>} QSO对象数组
 */
export function parseADIF(adifContent) {
  const qsos = [];
  
  // 移除ADIF头部（<EOH>之前的内容）
  let data = adifContent;
  const eohIndex = data.indexOf('<EOH>');
  if (eohIndex !== -1) {
    data = data.substring(eohIndex + 5);
  }
  
  // 按<eor>分割记录（忽略大小写）
  const records = data.split(/<eor>/i);
  
  for (const record of records) {
    const trimmed = record.trim();
    if (!trimmed) continue;
    
    const qso = {};
    let i = 0;
    while (i < trimmed.length) {
      // 查找字段开始 '<'
      if (trimmed[i] !== '<') {
        i++;
        continue;
      }
      
      // 提取字段名和长度：<FIELD_NAME:LEN>
      const closeBracket = trimmed.indexOf('>', i);
      if (closeBracket === -1) break;
      
      const fieldDef = trimmed.substring(i + 1, closeBracket);
      const colonIndex = fieldDef.indexOf(':');
      if (colonIndex === -1) break;
      
      const fieldName = fieldDef.substring(0, colonIndex).toUpperCase();
      let lenStr = fieldDef.substring(colonIndex + 1);
      // 可能包含数据类型指示符（如:N）
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
      
      // 处理转义（ADIF使用反斜杠转义）
      value = value.replace(/\\/g, '');
      
      // 根据字段名映射
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
      
      const targetKey = fieldMap[fieldName];
      if (targetKey) {
        // 数值类型转换
        if (['frequency', 'freq_rx', 'cqz', 'itu_z'].includes(targetKey)) {
          qso[targetKey] = parseFloat(value);
          if (isNaN(qso[targetKey])) qso[targetKey] = null;
        } else {
          qso[targetKey] = value;
        }
      } else {
        // 未知字段放入metadata
        if (!qso.metadata) qso.metadata = {};
        qso.metadata[fieldName] = value;
      }
      
      i = valueEnd;
    }
    
    // 只保留有call_sign的记录
    if (qso.call_sign) {
      // 日期格式转换：YYYYMMDD -> YYYY-MM-DD
      if (qso.qso_date && qso.qso_date.length === 8) {
        qso.qso_date = `${qso.qso_date.slice(0, 4)}-${qso.qso_date.slice(4, 6)}-${qso.qso_date.slice(6, 8)}`;
      }
      // 时间补全秒
      if (qso.time_on && qso.time_on.length === 4) {
        qso.time_on = `${qso.time_on.slice(0, 2)}:${qso.time_on.slice(2, 4)}`;
      }
      if (qso.time_off && qso.time_off.length === 4) {
        qso.time_off = `${qso.time_off.slice(0, 2)}:${qso.time_off.slice(2, 4)}`;
      }
      qsos.push(qso);
    }
  }
  
  return qsos;
}