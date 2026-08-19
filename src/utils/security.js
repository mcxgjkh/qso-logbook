export function generateCSRFToken() {
  return crypto.randomUUID();
}
export function validateCSRFToken(token) {
  // 实现校验
}
