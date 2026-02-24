import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlockFund | Premium Poultry Investment',
  description:
    'Democratizing high-yield poultry farming through collective investment. Own a piece of the flock and earn from every bird.',
  keywords: ['poultry', 'investment', 'agritech', 'broiler', 'farming', 'fintech'],
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#19382d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
