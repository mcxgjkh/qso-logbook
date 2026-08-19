export function getCurrentUTC() {
  return new Date().toISOString().slice(0, 10);
}
export function formatADIFDate(date) {
  return date.replace(/-/g, '');
}
