// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

// 读取 package.json 版本号
const packageJson = require('./package.json');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: { domains: [] },
  turbopack: {},
  allowedDevOrigins: ['221.232.242.16','192.168.0.134', 'localhost', '127.0.0.1'],
  // 注入版本号到环境变量（客户端可访问）
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};

module.exports = withPWA(nextConfig);