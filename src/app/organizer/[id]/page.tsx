'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2, Calendar, MapPin, Mail, X, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

interface Tier {
  price: number;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  venue: string;
  coverImageUrl?: string;
  category: string;
  isFree: boolean;
  tiers: Tier[];
  status: string;
}

interface Organizer {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  city?: string;
  bio?: string;
  avatarUrl?: string;
}

const CATEGORY_IMAGES: Record<string, string> = {
  MUSIC: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  BUSINESS: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  CONFERENCE: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
  FOOD_AND_DRINK: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  CONCERT: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
  NIGHTLIFE: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
  OTHER: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
};

export default function OrganizerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    api.get(`/users/${id}/profile`)
      .then(res => {
        const data = res.data.data;
        setOrganizer(data.organizer);
        const now = new Date();
        const published = (data.events || []).filter((e: Event) => e.status === 'PUBLISHED');
        setUpcomingEvents(published.filter((e: Event) => new Date(e.startDate) >= now));
        setPastEvents(published.filter((e: Event) => new Date(e.startDate) < now));
      })
      .catch(() => router.push('/events'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    setContactError('');
    try {
      await api.post(`/users/${id}/contact`, contactForm);
      setContactSuccess(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setContactError(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setContactSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  );

  if (!organizer) return null;

  const displayed = tab === 'upcoming' ? upcomingEvents : pastEvents;
  const displayName = organizer.companyName || `${organizer.firstName} ${organizer.lastName}`;
  const initials = organizer.companyName
    ? organizer.companyName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : `${organizer.firstName[0]}${organizer.lastName[0]}`;

  const inputStyle = { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 border-b backdrop-blur-md"
        style={{ background: 'rgba(6,20,27,0.95)', borderColor: 'var(--border)' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
          <ChevronLeft size={14} /> Back
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs" style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>E</div>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-bright)' }}>Eventful</span>
        </Link>
        <div style={{ width: 60 }} />
      </nav>

      {/* PROFILE HEADER */}
      <div className="px-5 py-8 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ background: 'var(--bg2)', color: 'var(--text-bright)', border: '1px solid var(--border)' }}>
              {organizer.avatarUrl
                ? <img src={organizer.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div>
              <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-bright)' }}>{displayName}</h1>
              {organizer.companyName && (
                <p className="text-xs mb-1" style={{ color: 'var(--accent)' }}>by {organizer.firstName} {organizer.lastName}</p>
              )}
              {organizer.city && (
                <p className="text-xs mb-1" style={{ color: 'var(--accent)' }}>{organizer.city}</p>
              )}
              {!organizer.companyName && (
                <p className="text-xs" style={{ color: 'var(--accent)' }}>Event Organizer</p>
              )}
              {organizer.bio && (
                <p className="text-xs leading-relaxed mt-2 max-w-md" style={{ color: 'var(--accent)' }}>{organizer.bio}</p>
              )}
            </div>
          </div>
          <button onClick={() => setContactOpen(true)}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border flex-shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--accent)', background: 'transparent' }}>
            <Mail size={13} /> Contact
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b px-5" style={{ borderColor: 'var(--border)' }}>
        {(['upcoming', 'past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="text-xs py-3 mr-6 font-semibold capitalize border-b-2 transition-all"
            style={{
              borderColor: tab === t ? 'var(--bg)' : 'transparent',
              color: tab === t ? 'var(--bg)' : 'var(--accent)',
            }}>
            {t} events {t === 'upcoming' ? `(${upcomingEvents.length})` : `(${pastEvents.length})`}
          </button>
        ))}
      </div>

      {/* EVENTS LIST */}
      <div className="px-5 py-4">
        {displayed.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--accent)' }}>No {tab} events</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayed.map(ev => {
              const image = ev.coverImageUrl || CATEGORY_IMAGES[ev.category] || CATEGORY_IMAGES.OTHER;
              const minPrice = ev.tiers?.length ? Math.min(...ev.tiers.map(t => t.price)) : 0;
              return (
                <Link href={`/events/${ev.id}`} key={ev.id}>
                  <div className="rounded-xl border overflow-hidden transition-all hover:border-opacity-50"
                    style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                    <div className="w-full h-36 overflow-hidden">
                      <img src={image} alt={ev.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold mb-1 line-clamp-2" style={{ color: 'var(--text-bright)' }}>{ev.title}</p>
                      <p className="text-xs flex items-center gap-1 mb-1" style={{ color: 'var(--accent)' }}>
                        <Calendar size={10} />
                        {new Date(ev.startDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs flex items-center gap-1 mb-2" style={{ color: 'var(--accent)' }}>
                        <MapPin size={10} />{ev.venue.split(',')[0]}
                      </p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-bright)' }}>
                        {ev.isFree || minPrice === 0 ? 'Free' : `₦${minPrice.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTACT MODAL */}
      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => e.target === e.currentTarget && setContactOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Contact Organizer</p>
              <button onClick={() => { setContactOpen(false); setContactSuccess(false); setContactError(''); }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(204,208,207,0.08)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-5">
              {contactSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle size={40} className="mx-auto mb-3" style={{ color: '#5cb87a' }} />
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-bright)' }}>Message sent!</p>
                  <p className="text-xs" style={{ color: 'var(--accent)' }}>The organizer will get back to you soon.</p>
                  <button onClick={() => { setContactOpen(false); setContactSuccess(false); }}
                    className="mt-4 text-xs px-4 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-3">
                  <p className="text-xs mb-4" style={{ color: 'var(--accent)' }}>
                    Sending message to <strong style={{ color: 'var(--text-bright)' }}>{displayName}</strong>
                  </p>
                  {contactError && (
                    <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555' }}>{contactError}</p>
                  )}
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--accent)' }}>Your name</label>
                    <input type="text" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. John Doe" required className="w-full px-4 py-2.5 rounded-lg text-sm outline-none border" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--accent)' }}>Your email</label>
                    <input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="you@example.com" required className="w-full px-4 py-2.5 rounded-lg text-sm outline-none border" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--accent)' }}>Subject</label>
                    <input type="text" value={contactForm.subject} onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="e.g. Ticket inquiry" required className="w-full px-4 py-2.5 rounded-lg text-sm outline-none border" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--accent)' }}>Message</label>
                    <textarea value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Write your message here..." rows={4} required
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none border resize-none" style={inputStyle} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setContactOpen(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm border font-bold"
                      style={{ borderColor: 'var(--border)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={contactSending}
                      className="flex-grow py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                      style={{ background: 'var(--text-bright)', color: 'var(--bg)', cursor: 'pointer' }}>
                      {contactSending ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
