// src/lib/logger.js
const isDev = process.env.NODE_ENV === 'development';

/**
 * 信息日志（仅开发环境输出）
 */
export function logInfo(message, data = null) {
    if (isDev) {
        console.log(`[INFO] ${message}`, data || '');
    }
}

/**
 * 警告日志（仅开发环境输出）
 */
export function logWarn(message, data = null) {
    if (isDev) {
        console.warn(`[WARN] ${message}`, data || '');
    }
}

/**
 * 错误日志（始终输出，但生产环境只记录错误摘要）
 */
export function logError(message, error = null) {
    if (isDev) {
        console.error(`[ERROR] ${message}`, error);
    } else {
        // 生产环境只记录错误信息摘要，不记录堆栈
        console.error(`[ERROR] ${message}`);
        if (error) {
            console.error(`[ERROR_DETAIL] ${error.message || error}`);
        }
    }
}