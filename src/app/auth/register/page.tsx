'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'ATTENDEE' | 'ORGANIZER'>('ATTENDEE');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputStyle = {
    background: 'var(--card)',
    borderColor: 'var(--border)',
    color: 'var(--text-bright)',
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    // step 2 removed - org details on profile
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { ...form, role });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-md rounded-2xl border p-10 text-center" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(92,184,122,0.1)', border: '0.5px solid rgba(92,184,122,0.3)' }}>
            <CheckCircle size={28} style={{ color: '#5cb87a' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>You're all set!</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--accent)' }}>
            Welcome to Eventful. Check your email at <strong style={{ color: 'var(--text-bright)' }}>{form.email}</strong> to verify your account.
          </p>
          <div className="flex flex-col gap-3 mb-6 text-left rounded-xl p-4" style={{ background: 'var(--bg3)' }}>
            {[
              { label: 'Verify your email', desc: 'Check your inbox for a confirmation link' },
              role === 'ORGANIZER' ? { label: 'Create your first event', desc: 'Set up tickets, tiers, and go live' } : { label: 'Browse events', desc: 'Discover events happening near you' },
              { label: role === 'ORGANIZER' ? 'Scan tickets at the door' : 'Get your QR tickets', desc: role === 'ORGANIZER' ? 'Use the scanner on your dashboard' : 'Tickets are sent to your email' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--bg2)', color: 'var(--text-bright)', border: '0.5px solid var(--border)' }}>{i + 1}</div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: 'var(--accent)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/auth/login" className="w-full py-3 rounded-xl font-bold text-sm text-center"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
              Go to sign in
            </Link>
            {role === 'ORGANIZER' && (
              <Link href="/events/create" className="w-full py-3 rounded-xl font-bold text-sm text-center border"
                style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                Create my first event
              </Link>
            )}
          </div>
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
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-bright)' }}>
            {'Create your account'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            {'Join thousands of event organizers and attendees'}
          </p>
        </div>



        <div className="rounded-2xl p-8 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555', border: '0.5px solid rgba(224,85,85,0.2)' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleStep1} className="space-y-4">
              {/* ROLE SELECTOR */}
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>I am joining as</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ATTENDEE', 'ORGANIZER'] as const).map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className="py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border"
                      style={{
                        background: role === r ? 'var(--text-bright)' : 'transparent',
                        color: role === r ? 'var(--bg)' : 'var(--accent)',
                        borderColor: role === r ? 'var(--text-bright)' : 'var(--border)',
                      }}>
                      {r === 'ATTENDEE' ? 'Attendee' : 'Organizer'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>First name</label>
                  <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Angelo" required className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Last name</label>
                  <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Doe" required className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Email address</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" required className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters" required
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none border pr-10" style={inputStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff size={16} style={{ color: 'var(--accent)' }} /> : <Eye size={16} style={{ color: 'var(--accent)' }} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : role === 'ORGANIZER' ? 'Continue →' : 'Create account'}
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
              Sign up with Google
            </a>
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--accent)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" className="font-bold hover:text-white transition-colors" style={{ color: 'var(--text-bright)' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
