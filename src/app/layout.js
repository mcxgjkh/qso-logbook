// src/app/layout.js
import '@/styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'QSO Logbook',
  description: '业余无线电 QSO 日志管理系统',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={inter.className}>
      <body>
        {/* 背景光晕层 - 所有页面共享 */}
        <div className="bg-glow-container">
          <div className="bg-glow-orb bg-glow-orb-blue"></div>
          <div className="bg-glow-orb bg-glow-orb-purple"></div>
          <div className="bg-glow-orb bg-glow-orb-warm"></div>
          <div className="bg-grid-overlay"></div>
        </div>

        {/* 内容层 - 置于光晕之上 */}
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}