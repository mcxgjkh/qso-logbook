// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

// 读取 package.json 版本
const packageJson = require('./package.json');
const baseVersion = packageJson.version;

// 获取 Vercel 构建号（仅在 Vercel 环境中存在）
const buildNumber = process.env.VERCEL_BUILD_NUMBER || null;

// 构建完整版本号：v1.0.0-build123
const fullVersion = buildNumber ? `${baseVersion}-build${buildNumber}` : baseVersion;

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: { domains: [] },
  turbopack: {},
  allowedDevOrigins: ['192.168.0.134'],
  env: {
    NEXT_PUBLIC_APP_VERSION: baseVersion,
    NEXT_PUBLIC_APP_VERSION_FULL: fullVersion,
  },
};

module.exports = withPWA(nextConfig);