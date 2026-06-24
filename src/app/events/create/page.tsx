'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Plus, Trash2, Loader2, Calendar, MapPin, Tag, Image } from 'lucide-react';
import api from '@/lib/api';

interface Tier {
  name: string;
  price: number;
  totalQuantity: number;
  features: string[];
}

const CATEGORIES = ['MUSIC', 'BUSINESS', 'CONFERENCE', 'FOOD_AND_DRINK', 'CONCERT', 'NIGHTLIFE', 'PERFORMING_ARTS', 'COMMUNITY', 'HOBBIES', 'SEASONAL', 'OTHER'];
const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: 'Music',
  BUSINESS: 'Business',
  CONFERENCE: 'Technology',
  FOOD_AND_DRINK: 'Food & Drink',
  CONCERT: 'Concert',
  NIGHTLIFE: 'Nightlife',
  PERFORMING_ARTS: 'Performing Arts',
  COMMUNITY: 'Community',
  HOBBIES: 'Hobbies',
  SEASONAL: 'Seasonal',
  OTHER: 'Other',
};

export default function CreateEventPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    category: 'MUSIC',
    isFree: false,
    coverImageUrl: '',
    galleryImage1: '',
    galleryImage2: '',
    timezone: 'Africa/Lagos',
  });

  const [tiers, setTiers] = useState<Tier[]>([
    { name: 'Regular', price: 0, totalQuantity: 100, features: [] },
  ]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated]);

  const addTier = () => {
    setTiers([...tiers, { name: '', price: 0, totalQuantity: 50, features: [] }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof Tier, value: any) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.upload('/users/me/avatar', formData);
      setForm(f => ({ ...f, coverImageUrl: res.data.data.avatarUrl }));
    } catch { } finally { setUploadingCover(false); }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGallery(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.upload('/users/me/avatar', formData);
      const url = res.data.data.avatarUrl;
      if (!form.galleryImage1) setForm(f => ({ ...f, galleryImage1: url }));
      else if (!form.galleryImage2) setForm(f => ({ ...f, galleryImage2: url }));
    } catch { } finally { setUploadingGallery(false); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Validate tiers
      if (!form.isFree && tiers.some(t => !t.name || t.price <= 0 || t.totalQuantity <= 0)) {
        setError('Please fill in all tier details correctly.');
        setStep(2);
        setLoading(false);
        return;
      }

      const payload: any = {
        title: form.title,
        description: form.description,
        venue: form.venue,
        category: form.category,
        isFree: form.isFree,
        timezone: form.timezone,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        tiers: form.isFree ? [{ name: 'Free Entry', price: 0, totalQuantity: tiers[0].totalQuantity }] : tiers,
      };
      if (form.coverImageUrl && form.coverImageUrl.startsWith('http')) {
        payload.coverImageUrl = form.coverImageUrl;
      }
      const gallery = [form.galleryImage1, form.galleryImage2].filter(u => u && u.startsWith('http'));
      if (gallery.length > 0) payload.galleryImages = gallery;
      console.log("Tiers:", JSON.stringify(tiers)); const { data } = await api.post('/events', payload);
      const eventId = data.data.id;

      const tiersToAdd = form.isFree
        ? [{ name: 'Free Entry', price: 0, totalQuantity: tiers[0].totalQuantity }]
        : tiers;

      for (const tier of tiersToAdd) {
        await api.post('/events/' + eventId + '/tiers', tier);
      }

      await api.patch('/events/' + eventId + '/publish');
      router.push('/events/' + eventId);
    } catch (err: any) {
      console.log('Error:', JSON.stringify(err)); setError(err.response?.data?.error || err.response?.data?.details || 'Failed to create event. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* HEADER */}
      <div className="border-b py-8" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--accent)' }}>Host an event</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>Create New Event</h1>

          {/* STEP INDICATOR */}
          <div className="flex items-center gap-2 mt-4">
            {['Event Details', 'Tickets', 'Review'].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all"
                    style={{
                      background: step > i + 1 ? 'var(--text-bright)' : step === i + 1 ? 'var(--bg3)' : 'transparent',
                      borderColor: step >= i + 1 ? 'var(--text-bright)' : 'var(--border)',
                      color: step > i + 1 ? 'var(--bg)' : 'var(--text-bright)',
                    }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span className="text-xs" style={{ color: step === i + 1 ? 'var(--text-bright)' : 'var(--accent)' }}>{s}</span>
                </div>
                {i < 2 && <div className="w-8 h-px" style={{ background: 'var(--border)' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555', border: '0.5px solid rgba(224,85,85,0.2)' }}>
            {error}
          </div>
        )}

        {/* STEP 1 — EVENT DETAILS */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="rounded-xl p-6 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--text-bright)' }}>
                <Tag size={16} /> Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Event Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Lagos Tech Summit 2026"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Tell attendees what your event is about..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none border resize-none"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Category *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }}>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Event Type</label>
                    <div className="flex gap-2">
                      <button onClick={() => setForm({ ...form, isFree: false })}
                        className="flex-1 py-3 rounded-lg text-sm font-semibold border transition-all"
                        style={{
                          background: !form.isFree ? 'var(--text-bright)' : 'var(--card)',
                          color: !form.isFree ? 'var(--bg)' : 'var(--accent)',
                          borderColor: 'var(--border)',
                        }}>Paid</button>
                      <button onClick={() => setForm({ ...form, isFree: true })}
                        className="flex-1 py-3 rounded-lg text-sm font-semibold border transition-all"
                        style={{
                          background: form.isFree ? '#5cb87a' : 'var(--card)',
                          color: form.isFree ? '#fff' : 'var(--accent)',
                          borderColor: 'var(--border)',
                        }}>Free</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--text-bright)' }}>
                <Calendar size={16} /> Date & Location
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Start Date & Time *</label>
                    <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>End Date & Time *</label>
                    <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Venue *</label>
                  <input type="text" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g. Eko Hotel & Suites, Lagos"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Cover Image</label>
                  {form.coverImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden mb-2" style={{ height: '200px' }}>
                      <img src={form.coverImageUrl} alt="cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                        <label className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.3)' }}>
                          {uploadingCover ? 'Uploading...' : 'Change image'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer mb-2"
                      style={{ borderColor: 'var(--border)', height: '120px', background: 'var(--card)' }}>
                      <span className="text-2xl mb-1">🖼</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>{uploadingCover ? 'Uploading...' : 'Upload cover image'}</span>
                      <span className="text-xs" style={{ color: 'var(--accent)' }}>Click to upload JPG or PNG</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                    </label>
                  )}
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
                    <span className="text-xs" style={{ color: 'var(--accent)' }}>or paste a URL</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
                  </div>
                  <input type="url" value={form.coverImageUrl} onChange={e => setForm({ ...form, coverImageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Gallery Images (optional)</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[form.galleryImage1, form.galleryImage2].map((img, i) => img ? (
                      <div key={i} className="relative rounded-lg overflow-hidden" style={{ height: '80px' }}>
                        <img src={img} alt={`gallery ${i+1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => i === 0 ? setForm(f => ({ ...f, galleryImage1: '' })) : setForm(f => ({ ...f, galleryImage2: '' }))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={{ background: 'rgba(224,85,85,0.8)', color: '#fff', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : null)}
                    {(!form.galleryImage1 || !form.galleryImage2) && (
                      <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer"
                        style={{ borderColor: 'var(--border)', height: '80px', background: 'var(--card)' }}>
                        <span className="text-lg">+</span>
                        <span className="text-xs" style={{ color: 'var(--accent)' }}>{uploadingGallery ? 'Uploading...' : 'Add image'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={uploadingGallery} />
                      </label>
                    )}
                  </div>
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
                    <span className="text-xs" style={{ color: 'var(--accent)' }}>or paste URLs</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
                  </div>
                  <input type="url" value={form.galleryImage1} onChange={e => setForm({ ...form, galleryImage1: e.target.value })}
                    placeholder="Gallery image 1 URL"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none border mb-2"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                  <input type="url" value={form.galleryImage2} onChange={e => setForm({ ...form, galleryImage2: e.target.value })}
                    placeholder="Gallery image 2 URL"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.title || !form.venue || !form.startDate || !form.endDate) {
                  setError('Please fill in all required fields.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="w-full py-3 rounded-lg font-bold text-sm tracking-wider uppercase"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
              Next: Set Up Tickets →
            </button>
          </div>
        )}

        {/* STEP 2 — TICKETS */}
        {step === 2 && (
          <div className="space-y-4">
            {form.isFree ? (
              <div className="rounded-xl p-6 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-bold tracking-wider uppercase mb-4" style={{ color: 'var(--text-bright)' }}>Free Event Capacity</h2>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Total Capacity *</label>
                  <input type="number" value={tiers[0].totalQuantity || ""} min="1"
                    onChange={e => updateTier(0, 'totalQuantity', Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                </div>
              </div>
            ) : (
              <>
                {tiers.map((tier, i) => (
                  <div key={i} className="rounded-xl p-6 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--text-bright)' }}>
                        Ticket Tier {i + 1}
                      </h3>
                      {tiers.length > 1 && (
                        <button onClick={() => removeTier(i)}>
                          <Trash2 size={16} style={{ color: '#e05555' }} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Tier Name *</label>
                        <input type="text" value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)}
                          placeholder="e.g. VIP"
                          className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Price (₦) *</label>
                        <input type="number" value={tier.price || ""} onChange={e => updateTier(i, 'price', e.target.value === "" ? 0 : Number(e.target.value))} min="0"
                          className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Quantity *</label>
                        <input type="number" value={tier.totalQuantity || ""} onChange={e => updateTier(i, 'totalQuantity', e.target.value === "" ? 0 : Number(e.target.value))} min="1"
                          className="w-full px-4 py-3 rounded-lg text-sm outline-none border"
                          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addTier}
                  className="w-full py-3 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-colors hover:text-white"
                  style={{ borderColor: 'var(--border)', color: 'var(--accent)', borderStyle: 'dashed' }}>
                  <Plus size={16} /> Add Another Tier
                </button>
              </>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-lg font-bold text-sm border"
                style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                ← Back
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-lg font-bold text-sm"
                style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                Next: Review →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — REVIEW */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl p-6 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-bold tracking-wider uppercase mb-4" style={{ color: 'var(--text-bright)' }}>Review Your Event</h2>
              <div className="space-y-3">
                {[
                  { label: 'Title', value: form.title },
                  { label: 'Category', value: form.category },
                  { label: 'Venue', value: form.venue },
                  { label: 'Start', value: new Date(form.startDate).toLocaleString('en-NG') },
                  { label: 'End', value: new Date(form.endDate).toLocaleString('en-NG') },
                  { label: 'Type', value: form.isFree ? 'Free' : 'Paid' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--accent)' }}>{item.label}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {!form.isFree && (
                <div className="mt-4">
                  <p className="text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Ticket Tiers</p>
                  {tiers.map((t, i) => (
                    <div key={i} className="flex justify-between py-1">
                      <span className="text-sm" style={{ color: 'var(--text-bright)' }}>{t.name}</span>
                      <span className="text-sm" style={{ color: 'var(--accent)' }}>₦{t.price.toLocaleString()} · {t.totalQuantity} tickets</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-lg font-bold text-sm border"
                style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Event'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
