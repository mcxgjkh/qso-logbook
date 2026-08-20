// src/middleware/rate-limit.js
const store = new Map();

export function rateLimit(request, maxRequests = 10, windowMs = 60000) {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();
    const record = store.get(key);
    
    if (!record || now > record.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return null;
    }
    
    record.count += 1;
    if (record.count > maxRequests) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Too many requests, please try again later',
            code: 'RATE_LIMITED'
        }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }
    return null;
}