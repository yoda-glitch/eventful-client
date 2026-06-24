'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Search, QrCode, CheckCircle, Clock, Users, TrendingUp, ChevronLeft, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Attendee {
  ticketId: string;
  name: string;
  email: string;
  ticketType: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
}

interface CheckinData {
  total: number;
  checkedIn: number;
  remaining: number;
  rate: number;
  attendees: Attendee[];
}

export default function CheckinPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'checked' | 'pending'>('all');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [eventTitle, setEventTitle] = useState('');

  const fetchAttendees = useCallback(async () => {
    try {
      const res = await api.get(`/events/${id}/attendees`);
      setData(res.data.data);
    } catch {
      // silent on poll
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    // fetch event title
    api.get(`/events/${id}`).then(r => setEventTitle(r.data.data.title)).catch(() => {});
    fetchAttendees();
    const interval = setInterval(fetchAttendees, 15000);
    return () => clearInterval(interval);
  }, [user, id, fetchAttendees, router]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCheckin = async (ticketId: string) => {
    setCheckingIn(ticketId);
    try {
      await api.post(`/events/${id}/attendees/${ticketId}/checkin`);
      showToast('Attendee checked in successfully', 'success');
      await fetchAttendees();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Check-in failed', 'error');
    } finally {
      setCheckingIn(null);
    }
  };

  const filtered = data?.attendees.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.ticketId.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ? true : filter === 'checked' ? a.isUsed : !a.isUsed;
    return matchSearch && matchFilter;
  }) ?? [];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg1)', padding: '24px 20px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 50, padding: '12px 20px', borderRadius: 10, background: toast.type === 'success' ? '#1a3a2a' : '#3a1a1a', color: toast.type === 'success' ? '#4ade80' : '#f87171', fontSize: 14, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => { const from = searchParams.get('from'); if (from === 'dashboard') router.push('/dashboard?tab=events'); else router.back(); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer', marginBottom: 12, padding: 0 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-bright)', margin: '0 0 4px', fontFamily: 'var(--font-heading)' }}>Attendee Check-in</h1>
        <p style={{ fontSize: 14, color: 'var(--accent)', margin: 0 }}>{eventTitle}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total tickets', value: data?.total ?? 0, icon: <Users size={18} />, color: 'var(--text-bright)' },
          { label: 'Checked in', value: data?.checkedIn ?? 0, icon: <CheckCircle size={18} />, color: '#4ade80' },
          { label: 'Remaining', value: data?.remaining ?? 0, icon: <Clock size={18} />, color: '#facc15' },
          { label: 'Check-in rate', value: `${data?.rate ?? 0}%`, icon: <TrendingUp size={18} />, color: 'var(--text-bright)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{s.icon}</div>
            <p style={{ fontSize: 12, color: 'var(--accent)', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--accent)', marginBottom: 8 }}>
          <span>Capacity progress</span>
          <span>{data?.checkedIn} / {data?.total} checked in</span>
        </div>
        <div style={{ background: 'var(--bg1)', borderRadius: 4, height: 8 }}>
          <div style={{ background: '#4ade80', height: 8, borderRadius: 4, width: `${data?.rate ?? 0}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 14px', height: 40 }}>
          <Search size={16} style={{ color: 'var(--accent)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or ticket ID..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-bright)', fontSize: 14 }} />
        </div>
        {(['all', 'checked', 'pending'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '0 16px', height: 40, borderRadius: 10, border: '1px solid var(--border)', background: filter === f ? 'var(--accent)' : 'var(--bg2)', color: filter === f ? 'var(--bg1)' : 'var(--accent)', fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', fontWeight: filter === f ? 600 : 400 }}>
            {f}
          </button>
        ))}
        <button onClick={fetchAttendees} style={{ padding: '0 14px', height: 40, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg2)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg1)' }}>
          {['Attendee', 'Ticket type', 'Ticket ID', 'Status', ''].map(h => (
            <span key={h} style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--accent)', fontSize: 14 }}>No attendees found</div>
        ) : filtered.map(a => (
          <div key={a.ticketId} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr', padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-bright)', margin: '0 0 2px' }}>{a.name}</p>
              <p style={{ fontSize: 12, color: 'var(--accent)', margin: 0 }}>{a.email}</p>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-bright)' }}>{a.ticketType}</span>
            <span style={{ fontSize: 12, color: 'var(--accent)' }}>#{a.ticketId.slice(0, 8).toUpperCase()}</span>
            <span style={{ display: 'inline-block', fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600, background: a.isUsed ? 'rgba(74,222,128,0.15)' : 'rgba(250,204,21,0.15)', color: a.isUsed ? '#4ade80' : '#facc15' }}>
              {a.isUsed ? 'Checked in' : 'Not checked in'}
            </span>
            <div>
              {!a.isUsed ? (
                <button onClick={() => handleCheckin(a.ticketId)} disabled={checkingIn === a.ticketId} style={{ padding: '6px 14px', borderRadius: 8, background: '#1a3a5c', border: 'none', color: '#e8f0f8', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: checkingIn === a.ticketId ? 0.6 : 1 }}>
                  {checkingIn === a.ticketId ? '...' : 'Check in'}
                </button>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--accent)' }}>
                  {a.usedAt ? new Date(a.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
