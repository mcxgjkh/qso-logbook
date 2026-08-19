// src/components/common/Footer.js
'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';

  return (
    <footer className="mt-8 pt-4 border-t border-glass text-center text-sm text-foreground-muted">
      <p className="text-xs mt-1">Version {version}&nbsp;&nbsp;&nbsp;&nbsp;© {currentYear} QSO Logbook. All rights reserved.</p>
      <p className="text-xs mt-1">Powered by MCXGJKH</p>
      <p className="text-xs mt-1">&nbsp;</p>
    </footer>
  );
}