'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { CheckCircle } from 'lucide-react';

export default function CreateEventGatePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) { router.push('/auth/login'); return; }
      if (user?.role === 'ORGANIZER' || user?.role === 'ADMIN') {
        router.push('/events/create');
      }
    }
  }, [loading, isAuthenticated, user]);

  if (loading) return null;
  if (user?.role === 'ORGANIZER' || user?.role === 'ADMIN') return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 opacity-20"
        style={{ background: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80) center/cover no-repeat' }} />
      <div className="relative w-full max-w-md rounded-2xl border p-10 text-center" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 border"
          style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
          <span className="text-2xl">🎤</span>
        </div>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>Organizer access required</p>
        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--text-bright)' }}>Want to host an event?</h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--accent)' }}>
          Your account is set up as an attendee. To create and manage events, you need an organizer account.
        </p>
        <div className="rounded-xl p-4 mb-6 text-left" style={{ background: 'var(--bg3)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-bright)' }}>As an organizer you can:</p>
          <div className="flex flex-col gap-2">
            {[
              'Create and publish events',
              'Sell tickets via Paystack',
              'Scan QR tickets at the entrance',
              'View live sales and analytics',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent)' }}>
                <CheckCircle size={13} style={{ color: '#5cb87a', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/auth/register" className="w-full py-3 rounded-xl font-bold text-sm text-center"
            style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
            Create account
          </Link>
          <Link href="/events" className="w-full py-3 rounded-xl font-bold text-sm text-center border"
            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
            Browse events instead
          </Link>
        </div>
      </div>
    </div>
  );
}
