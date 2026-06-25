'use client';
import { Suspense } from 'react';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Ticket } from 'lucide-react';
import api from '@/lib/api';

function VerifyEmailPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const statusParam = searchParams.get('status');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (statusParam === 'success') {
      setStatus('success');
      let count = 3;
      const timer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count === 0) { clearInterval(timer); window.location.href = '/auth/login'; }
      }, 1000);
      return () => clearInterval(timer);
    } else if (token) {
      api.get('/auth/verify-email/' + token)
        .then(() => {
          setStatus('success');
          let count = 3;
          const timer = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count === 0) { clearInterval(timer); window.location.href = '/auth/login'; }
          }, 1000);
        })
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [statusParam]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 opacity-20"
        style={{ background: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80) center/cover no-repeat' }} />

      <div className="relative text-center max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Ticket size={24} style={{ color: 'var(--text-bright)' }} />
          <span className="text-lg font-bold tracking-widest uppercase" style={{ color: 'var(--text-bright)' }}>Eventful</span>
        </Link>

        {status === 'loading' && (
          <div>
            <Loader2 size={64} className="mx-auto mb-4 animate-spin" style={{ color: 'var(--accent)' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>Verifying your email...</h2>
            <p className="text-sm" style={{ color: 'var(--accent)' }}>Please wait a moment</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle size={64} className="mx-auto mb-4" style={{ color: '#5cb87a' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>Email Verified!</h2>
            <p className="text-sm mb-8" style={{ color: 'var(--accent)' }}>
              Your account has been verified successfully. You can now sign in and start exploring events.
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--accent)' }}>Redirecting to sign in in {countdown}s...</p>
            <Link href="/auth/login"
              className="inline-block font-bold text-sm px-8 py-3 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
              Sign In Now
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircle size={64} className="mx-auto mb-4" style={{ color: '#e05555' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>Verification Failed</h2>
            <p className="text-sm mb-8" style={{ color: 'var(--accent)' }}>
              The verification link is invalid or has expired. Please request a new verification email.
            </p>
            <Link href="/auth/login"
              className="inline-block font-bold text-sm px-8 py-3 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailPageInner />
    </Suspense>
  );
}
