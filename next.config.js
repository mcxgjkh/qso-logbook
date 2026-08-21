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

const buildNumber = process.env.VERCEL_BUILD_NUMBER || null;
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || null;
// 取前7位作为简短标识
const commitShort = commitSha ? commitSha.slice(0, 7) : null;

const fullVersion = buildNumber ? `${baseVersion}-build${buildNumber}` 
                  : commitShort ? `${baseVersion}-${commitShort}`
                  : baseVersion;

const nextConfig = {
  reactStrictMode: true,
  images: { domains: [] },
  turbopack: {},
  allowedDevOrigins: ['192.168.0.134'],
  env: {
    NEXT_PUBLIC_APP_VERSION: baseVersion,
    NEXT_PUBLIC_APP_VERSION_FULL: fullVersion,
  },
};

module.exports = withPWA(nextConfig);