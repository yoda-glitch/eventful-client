import type { Metadata } from 'next';
import { Inter, DM_Serif_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import Navbar from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const dmSerif = DM_Serif_Display({ 
  weight: '400',
  subsets: ['latin'], 
  variable: '--font-heading',
  style: ['normal', 'italic']
});

export const metadata: Metadata = {
  title: 'Eventful — Where Every Event Tells a Story',
  description: "Nigeria's premier event ticketing platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmSerif.variable}`} 
        style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'var(--font-inter)' }}>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
