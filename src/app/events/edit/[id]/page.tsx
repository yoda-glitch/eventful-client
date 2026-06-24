'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loader2, Save, Trash2, Tag } from 'lucide-react';
import api from '@/lib/api';

const CATEGORIES = ['MUSIC', 'BUSINESS', 'CONFERENCE', 'FOOD_AND_DRINK', 'CONCERT', 'NIGHTLIFE', 'PERFORMING_ARTS', 'COMMUNITY', 'HOBBIES', 'SEASONAL', 'OTHER'];
const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: 'Music', BUSINESS: 'Business', CONFERENCE: 'Technology',
  FOOD_AND_DRINK: 'Food & Drink', CONCERT: 'Concert', NIGHTLIFE: 'Nightlife',
  PERFORMING_ARTS: 'Performing Arts', COMMUNITY: 'Community',
  HOBBIES: 'Hobbies', SEASONAL: 'Seasonal', OTHER: 'Other',
};

export default function EditEventPage() {
  const { id } = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [promoForm, setPromoForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', usageLimit: '' });
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    category: 'MUSIC',
    coverImageUrl: '',
    galleryImage1: '',
    galleryImage2: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.get('/events/' + id),
        api.get('/events/' + id + '/promo-codes'),
      ]).then(([eventRes, promoRes]) => {
        const event = eventRes.data.data;
        setPromoCodes(promoRes.data.data || []);

          setForm({
            title: event.title || '',
            description: event.description || '',
            venue: event.venue || '',
            startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
            endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
            category: event.category || 'MUSIC',
            coverImageUrl: event.coverImageUrl || '',
            galleryImage1: event.galleryImages?.[0] || '',
            galleryImage2: event.galleryImages?.[1] || '',
          });
        })
        .catch(() => router.push('/dashboard'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleCreatePromo = async () => {
    if (!promoForm.code || !promoForm.discountValue) { setPromoError('Code and discount value are required.'); return; }
    setCreatingPromo(true);
    setPromoError('');
    try {
      const res = await api.post(`/events/${id}/promo-codes`, {
        code: promoForm.code.toUpperCase(),
        discountType: promoForm.discountType,
        discountValue: Number(promoForm.discountValue),
        usageLimit: promoForm.usageLimit ? Number(promoForm.usageLimit) : undefined,
      });
      setPromoCodes(prev => [res.data.data, ...prev]);
      setPromoForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', usageLimit: '' });
    } catch (err: any) {
      setPromoError(err.response?.data?.error || 'Failed to create promo code.');
    } finally { setCreatingPromo(false); }
  };

  const handleDeletePromo = async (promoId: string) => {
    await api.delete(`/promo-codes/${promoId}`);
    setPromoCodes(prev => prev.filter(p => p.id !== promoId));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        venue: form.venue,
        category: form.category,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };
      if (form.coverImageUrl && form.coverImageUrl.startsWith('http')) {
        payload.coverImageUrl = form.coverImageUrl;
      }
      const gallery = [form.galleryImage1, form.galleryImage2].filter(u => u && u.startsWith('http'));
      if (gallery.length > 0) payload.galleryImages = gallery;
      await api.patch('/events/' + id, payload);
      setSuccess(true);
      setTimeout(() => router.push('/events/' + id), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update event.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="border-b py-8" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--accent)' }}>Edit Event</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Update Event Details</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(92,184,122,0.1)', color: '#5cb87a' }}>
            Event updated successfully! Redirecting...
          </div>
        )}

        <div className="rounded-xl p-6 border space-y-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--text-bright)' }}>Basic Information</h2>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Event Title</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4} className="w-full px-4 py-3 rounded-lg text-sm outline-none border resize-none"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Cover Image URL</label>
              <input type="url" value={form.coverImageUrl} onChange={e => setForm({ ...form, coverImageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Gallery Image 1 (optional)</label>
              <input type="url" value={form.galleryImage1} onChange={e => setForm({ ...form, galleryImage1: e.target.value })}
                placeholder="https://example.com/gallery1.jpg"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Gallery Image 2 (optional)</label>
              <input type="url" value={form.galleryImage2} onChange={e => setForm({ ...form, galleryImage2: e.target.value })}
                placeholder="https://example.com/gallery2.jpg"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6 border space-y-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--text-bright)' }}>Date & Location</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Start Date & Time</label>
              <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>End Date & Time</label>
              <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Venue</label>
            <input type="text" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
          </div>
        </div>

        {/* PROMO CODES */}
        <div className="rounded-xl p-6 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--text-bright)' }}>
            <Tag size={16} /> Promo Codes
          </h2>

          {promoCodes.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {promoCodes.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-lg border"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono px-2 py-1 rounded" style={{ background: 'var(--bg3)', color: 'var(--text-bright)' }}>{p.code}</span>
                    <span className="text-xs" style={{ color: 'var(--accent)' }}>
                      {p.discountType === 'PERCENTAGE' ? `${p.discountValue}% off` : `₦${p.discountValue} off`}
                    </span>
                    {p.usageLimit && (
                      <span className="text-xs" style={{ color: 'var(--accent)' }}>{p.usageCount} / {p.usageLimit} used</span>
                    )}
                  </div>
                  <button onClick={() => handleDeletePromo(p.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {promoError && (
            <p className="text-xs px-3 py-2 rounded-lg mb-3" style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555' }}>{promoError}</p>
          )}

          <div className="rounded-lg p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: 'var(--accent)' }}>Create new code</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--accent)' }}>Code</label>
                <input type="text" value={promoForm.code} onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. EARLYBIRD20"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border font-mono"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--accent)' }}>Discount type</label>
                <select value={promoForm.discountType} onChange={e => setPromoForm({ ...promoForm, discountType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text-bright)' }}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed amount (₦)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--accent)' }}>
                  {promoForm.discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₦)'}
                </label>
                <input type="number" value={promoForm.discountValue} onChange={e => setPromoForm({ ...promoForm, discountValue: e.target.value })}
                  placeholder={promoForm.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 500'}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--accent)' }}>Usage limit (optional)</label>
                <input type="number" value={promoForm.usageLimit} onChange={e => setPromoForm({ ...promoForm, usageLimit: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
              </div>
            </div>
            <button onClick={handleCreatePromo} disabled={creatingPromo}
              className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)', cursor: 'pointer' }}>
              {creatingPromo ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : '+ Create Promo Code'}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.back()}
            className="flex-1 py-3 rounded-lg font-bold text-sm border"
            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
