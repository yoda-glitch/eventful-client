'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Ticket, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}>

      <div className="absolute inset-0 opacity-20"
        style={{ background: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80) center/cover no-repeat' }} />

      <div className="relative w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Ticket size={24} style={{ color: 'var(--text-bright)' }} />
            <span className="text-lg font-bold tracking-widest uppercase" style={{ color: 'var(--text-bright)' }}>Eventful</span>
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-bright)' }}>Welcome back</h1>
          <p className="text-sm" style={{ color: 'var(--accent)' }}>Sign in to your account to continue</p>
        </div>

        <div className="rounded-2xl p-8 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(224,85,85,0.1)', color: 'var(--red)', border: '0.5px solid rgba(224,85,85,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border transition-colors"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none border transition-colors pr-10"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff size={16} style={{ color: 'var(--accent)' }} /> : <Eye size={16} style={{ color: 'var(--accent)' }} />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link href="/auth/forgot-password" className="text-xs hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm tracking-wider uppercase transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--accent)' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/api/v1/auth/google`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text-bright)', fontSize: 14, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.6 39.7 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C41 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
            Sign in with Google
          </a>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--accent)' }}>
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-bold hover:text-white transition-colors" style={{ color: 'var(--text-bright)' }}>
                Sign up free
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
