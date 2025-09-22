import './globals.css';
import { ReactNode } from 'react';
import { Flare } from '@flareapp/js';

if (process.env.NEXT_PUBLIC_NODE_ENV !== 'development') {
  Flare.init({
    key: process.env.NEXT_PUBLIC_FLARE_KEY!,
    environment: process.env.NEXT_PUBLIC_NODE_ENV,
  });
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
