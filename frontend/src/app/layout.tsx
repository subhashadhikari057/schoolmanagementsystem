import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AnalyticsOverviewProvider } from '@/context/AnalyticsOverviewContext';
import AuthProvider from '@/context/AuthProvider';
import CsrfProvider from '@/context/CsrfProvider';
import { BackupProvider } from '@/context/BackupContext';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'School Management System',
  description:
    'Comprehensive school management system for administrators, teachers, and students',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <AuthProvider>
          <CsrfProvider>
            <BackupProvider>
              <AnalyticsOverviewProvider>{children}</AnalyticsOverviewProvider>
            </BackupProvider>
          </CsrfProvider>
        </AuthProvider>
        <Toaster
          position='top-right'
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e5e7eb',
              color: '#374151',
            },
          }}
        />
      </body>
    </html>
  );
}
