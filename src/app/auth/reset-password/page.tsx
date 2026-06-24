'use client';
import { Suspense } from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputStyle = { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--accent)' }}>Invalid reset link.</p>
          <Link href="/auth/forgot-password" className="font-bold text-sm px-6 py-3 rounded-xl"
            style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80) center/cover no-repeat' }} />
        <div className="relative w-full max-w-md rounded-2xl border p-10 text-center" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(92,184,122,0.1)', border: '0.5px solid rgba(92,184,122,0.3)' }}>
            <CheckCircle size={28} style={{ color: '#5cb87a' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>Password reset!</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--accent)' }}>
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link href="/auth/login" className="inline-block font-bold text-sm px-8 py-3 rounded-xl"
            style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 opacity-20"
        style={{ background: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80) center/cover no-repeat' }} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>E</div>
            <span className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-bright)' }}>Eventful</span>
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-bright)' }}>Reset your password</h1>
          <p className="text-sm" style={{ color: 'var(--accent)' }}>Enter your new password below</p>
        </div>
        <div className="rounded-2xl p-8 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555', border: '0.5px solid rgba(224,85,85,0.2)' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>New password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none border pr-10" style={inputStyle} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff size={16} style={{ color: 'var(--accent)' }} /> : <Eye size={16} style={{ color: 'var(--accent)' }} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your new password" required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : 'Reset password'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
