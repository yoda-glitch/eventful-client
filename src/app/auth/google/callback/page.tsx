'use client';
import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithTokens } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (!token || !refresh) {
      router.push('/auth/login?error=google_failed');
      return;
    }

    loginWithTokens(token, refresh).then(() => {
      router.push('/dashboard');
    }).catch(() => {
      router.push('/auth/login?error=google_failed');
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--accent)', fontSize: 14 }}>Signing you in with Google...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <GoogleCallbackInner />
    </Suspense>
  );
}
