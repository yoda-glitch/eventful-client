'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' };

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
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>Check your email</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--accent)' }}>
            We sent a password reset link to <strong style={{ color: 'var(--text-bright)' }}>{email}</strong>. Click the link to reset your password.
          </p>
          <Link href="/auth/login" className="inline-block font-bold text-sm px-8 py-3 rounded-xl"
            style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
            Back to sign in
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
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-bright)' }}>Forgot your password?</h1>
          <p className="text-sm" style={{ color: 'var(--accent)' }}>Enter your email and we'll send you a reset link</p>
        </div>
        <div className="rounded-2xl p-8 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555', border: '0.5px solid rgba(224,85,85,0.2)' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send reset link'}
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
