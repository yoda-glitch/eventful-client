'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Share2, X, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Tier {
  id: string;
  name: string;
  price: number;
  totalQuantity: number;
  soldQuantity: number;
  features?: string[];
}

interface Event {
  id: string;
  title: string;
  description?: string;
  venue: string;
  startDate: string;
  endDate: string;
  category: string;
  isFree: boolean;
  coverImageUrl?: string;
  galleryImages?: string[];
  status: string;
  tiers: Tier[];
  organizer?: { id: string; firstName: string; lastName: string; email: string; avatarUrl?: string; companyName?: string };
}

const CATEGORY_IMAGES: Record<string, string> = {
  MUSIC: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
  BUSINESS: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
  CONFERENCE: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80',
  FOOD_AND_DRINK: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80',
  CONCERT: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
  NIGHTLIFE: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
  OTHER: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
};

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: 'Music', BUSINESS: 'Business', CONFERENCE: 'Technology',
  FOOD_AND_DRINK: 'Food & Drink', CONCERT: 'Concert', NIGHTLIFE: 'Nightlife',
  PERFORMING_ARTS: 'Performing Arts', COMMUNITY: 'Community', OTHER: 'Other',
};

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [similarEvents, setSimilarEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountType: string; discountValue: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const heroBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/events/${id}`)
      .then(res => {
        const ev = res.data.data;
        setEvent(ev);
        if (heroBgRef.current) { heroBgRef.current.style.filter = 'blur(0px) brightness(1)'; heroBgRef.current.style.opacity = '1'; }
        // Load similar events
        api.get(`/events?category=${ev.category}&limit=4&status=PUBLISHED`)
          .then(r => setSimilarEvents((r.data.data.events || []).filter((e: Event) => e.id !== ev.id).slice(0, 3)))
          .catch(() => {});
      })
      .catch(() => router.push('/events'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!event) return;
    const target = new Date(event.startDate).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) return;
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [event]);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroBgRef.current) return;
      const scrollY = window.scrollY;
      const blur = Math.min(scrollY / 20, 20);
      const bright = Math.max(1 - scrollY / 800, 0.45);
      heroBgRef.current.style.filter = `blur(${blur}px) brightness(${bright})`;
      heroBgRef.current.style.transform = `scale(${1 + scrollY * 0.0001})`;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openModal = (tier: Tier) => {
    setSelectedTier(tier);
    setQuantity(1);
    setError('');
    setModalOpen(true);
  };

  const validatePromo = async () => {
    if (!promoCode) return;
    setValidatingPromo(true);
    setPromoError('');
    try {
      const res = await api.post('/promo-codes/validate', { code: promoCode, eventId: event?.id });
      setPromoApplied(res.data.data);
      setPromoCode('');
    } catch (err: any) {
      setPromoError(err.response?.data?.error || 'Invalid promo code');
      setPromoApplied(null);
    } finally { setValidatingPromo(false); }
  };

  const handleBuy = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (!selectedTier) return;
    setBuying(true);
    setError('');
    try {
      const res = await api.post('/payments/orders', { tierId: selectedTier.id, quantity, promoCode: promoApplied?.code });
      if (res.data.data.isFree) {
        setSuccess(true);
        setModalOpen(false);
      } else {
        window.location.href = res.data.data.authorizationUrl;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process order.');
    } finally {
      setBuying(false);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${event?.title} on Eventful!`;
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
    else if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  );

  if (!event) return null;

  const image = event.coverImageUrl || CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES.OTHER;
  const available = selectedTier ? selectedTier.totalQuantity - selectedTier.soldQuantity : 0;
  const baseTotal = selectedTier ? selectedTier.price * quantity : 0;
  const discount = promoApplied
    ? promoApplied.discountType === 'PERCENTAGE'
      ? Math.round(baseTotal * promoApplied.discountValue / 100)
      : promoApplied.discountValue * quantity
    : 0;
  const total = Math.max(0, baseTotal - discount);
  const isOrganizer = user && event.organizer && user.email === event.organizer.email;
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&output=embed`;

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="text-center max-w-md">
        <CheckCircle size={64} className="mx-auto mb-4" style={{ color: '#5cb87a' }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>You're in!</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--accent)' }}>
          Your ticket for <strong style={{ color: 'var(--text-bright)' }}>{event.title}</strong> has been confirmed.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="font-bold text-sm px-6 py-3 rounded-lg" style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>View My Tickets</Link>
          <Link href="/events" className="font-bold text-sm px-6 py-3 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>Browse More</Link>
        </div>
      </div>
    </div>
  );

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
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#fff' }}>Eventful</span>
        </Link>
        <button onClick={() => handleShare('copy')} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border"
          style={{ borderColor: 'var(--border)', color: 'var(--accent)', background: 'rgba(204,208,207,0.04)' }}>
          <Share2 size={12} /> {copied ? 'Copied!' : 'Share'}
        </button>
      </nav>

      {/* HERO */}
      <div className="relative overflow-hidden" style={{ height: '520px' }}>
        <div ref={heroBgRef} className="absolute"
          style={{ inset: '-20px', backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(6,20,27,0.1) 0%, rgba(6,20,27,0.55) 55%, rgba(6,20,27,1) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="inline-block text-xs px-2 py-1 rounded mb-2 tracking-wider"
            style={{ background: 'rgba(204,208,207,0.1)', border: '0.5px solid rgba(204,208,207,0.2)', color: 'var(--accent)' }}>
            {CATEGORY_LABELS[event.category] || event.category}
          </span>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#fff', lineHeight: 1.15 }}>{event.title}</h1>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
              <Calendar size={11} />{new Date(event.startDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
              <Clock size={11} />{new Date(event.startDate).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} WAT
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
              <MapPin size={11} />{event.venue}
            </span>
          </div>
        </div>
      </div>


      {/* TICKET TIERS */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--accent)', marginBottom: isMobile ? '8px' : '0', paddingTop: isMobile ? '0' : '2px' }}>Select a ticket to get started</p>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {event.tiers.map(tier => {
            const tierAvail = tier.totalQuantity - tier.soldQuantity;
            const isSoldOut = tierAvail === 0;
            return (
              <button key={tier.id} onClick={() => !isSoldOut && openModal(tier)} disabled={isSoldOut}
                className="min-w-36 text-left rounded-xl p-4 border flex-shrink-0 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--bg2)', borderColor: isSoldOut ? 'var(--border)' : 'rgba(204,208,207,0.15)', opacity: isSoldOut ? 0.4 : 1, cursor: isSoldOut ? 'not-allowed' : 'pointer' }}>
                <span className="inline-block text-xs px-2 py-0.5 rounded mb-2 font-semibold"
                  style={{ background: isSoldOut ? 'rgba(224,85,85,0.1)' : tierAvail < 20 ? 'rgba(240,165,0,0.1)' : 'rgba(92,184,122,0.1)', color: isSoldOut ? '#e05555' : tierAvail < 20 ? '#f0a500' : '#5cb87a', fontSize: '9px' }}>
                  {isSoldOut ? 'Sold Out' : tierAvail < 20 ? 'Low Stock' : 'Available'}
                </span>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-bright)' }}>{tier.name}</p>
                <p className="text-xl font-bold mb-1" style={{ color: 'var(--text-bright)' }}>{tier.price === 0 ? 'Free' : `₦${tier.price.toLocaleString()}`}</p>
                <p className="text-xs" style={{ color: 'var(--accent)' }}>{isSoldOut ? '0 left' : `${tierAvail} left`}</p>
                {tier.features?.map((f, i) => (
                  <p key={i} className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--accent)' }}>
                    <CheckCircle size={9} style={{ color: '#5cb87a' }} /> {f}
                  </p>
                ))}
                {!isSoldOut && <p className="text-xs mt-2" style={{ color: 'var(--accent)', opacity: 0.5 }}>Tap to select →</p>}
              </button>
            );
          })}
        </div>

        {isOrganizer && event.status === 'DRAFT' && (
          <div className="mt-4 p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--accent)' }}>This event is in draft</p>
            <button onClick={async () => { await api.patch(`/events/${event.id}/publish`); setEvent(prev => prev ? { ...prev, status: 'PUBLISHED' } : prev); }}
              className="text-xs font-bold px-4 py-2 rounded-lg" style={{ background: '#5cb87a', color: '#fff' }}>
              Publish Event
            </button>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="px-5 py-6 max-w-2xl">

        {/* DESCRIPTION */}
        {event.description && (
          <div className="pb-6 border-b mb-6" style={{ borderColor: 'var(--border)', display: isMobile ? 'block' : 'grid', gridTemplateColumns: '110px 1fr', gap: '20px' }}>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>Description</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--accent)', lineHeight: 1.8 }}>{event.description}</p>
          </div>
        )}

        {/* COUNTDOWN */}
        <div className="pb-6 border-b mb-6" style={{ borderColor: 'var(--border)', display: isMobile ? 'block' : 'grid', gridTemplateColumns: '110px 1fr', gap: '20px' }}>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--accent)', marginBottom: isMobile ? '8px' : '0', paddingTop: isMobile ? '0' : '2px' }}>Starts in</p>
          <div className="grid grid-cols-4 gap-2">
            {[['days', countdown.days], ['hours', countdown.hours], ['mins', countdown.mins], ['secs', countdown.secs]].map(([label, val]) => (
              <div key={label} className="rounded-lg p-2 text-center border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <span className="text-xl font-bold block" style={{ color: 'var(--text-bright)' }}>{val}</span>
                <span className="uppercase tracking-wider" style={{ color: 'var(--accent)', fontSize: '9px' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* EVENT INFO */}
        <div className="pb-6 border-b mb-6" style={{ borderColor: 'var(--border)', display: isMobile ? 'block' : 'grid', gridTemplateColumns: '110px 1fr', gap: '20px' }}>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--accent)', marginBottom: isMobile ? '8px' : '0', paddingTop: isMobile ? '0' : '2px' }}>Date & time</p>
          <div className="flex gap-4 mb-2">
            <div className="rounded-lg p-3 border flex-1 text-center" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>{new Date(event.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
              <p className="text-xs" style={{ color: 'var(--accent)' }}>{new Date(event.startDate).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex items-center" style={{ color: 'var(--accent)', fontSize: '12px' }}>to</div>
            <div className="rounded-lg p-3 border flex-1 text-center" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>{new Date(event.endDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
              <p className="text-xs" style={{ color: 'var(--accent)' }}>{new Date(event.endDate).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--accent)' }}>(GMT+01:00) Nigeria</p>
        </div>

        {/* LOCATION MAP */}
        <div className="pb-6 border-b mb-6" style={{ borderColor: 'var(--border)', display: isMobile ? 'block' : 'grid', gridTemplateColumns: '110px 1fr', gap: '20px' }}>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--accent)', marginBottom: isMobile ? '8px' : '0', paddingTop: isMobile ? '0' : '2px' }}>Location</p>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-bright)' }}>{event.venue.split(',')[0]}</p>
            <p className="text-xs mb-3" style={{ color: 'var(--accent)'}}>{event.venue}</p>
            <div className="rounded-xl overflow-hidden border" style={{borderColor: 'var(--border)' }}>
              <iframe
                src={mapUrl}
                width="100%"
                height="180"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map of ${event.venue}`}
              />
              <div className="flex justify-between items-center px-3 py-2" style={{ background: 'var(--bg2)' }}>
                <a href={`https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 px-3 py-1.5 rounded border"
                  style={{ borderColor: 'var(--border)', color: 'var(--accent)', background: 'transparent' }}>
                  Open Maps ↗
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* GALLERY */}
        {event.galleryImages && event.galleryImages.length > 0 && (
          <div className="pb-6 border-b mb-6" style={{ borderColor: 'var(--border)', display: isMobile ? 'block' : 'grid', gridTemplateColumns: '110px 1fr', gap: '20px' }}>
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--accent)', marginBottom: isMobile ? '8px' : '0', paddingTop: isMobile ? '0' : '2px' }}>Gallery</p>
            <div className="grid grid-cols-2 gap-2">
              {event.galleryImages.map((img, i) => (
                <div key={i} className="rounded-lg overflow-hidden" style={{ height: '130px', cursor: 'pointer' }}
                  onClick={() => setLightbox({ images: event.galleryImages!, index: i })}>
                  <img src={img} alt={`gallery ${i + 1}`} className="w-full h-full object-cover" style={{ transition: 'transform 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHARE */}
        <div className="pb-6 border-b mb-6" style={{ borderColor: 'var(--border)', display: isMobile ? 'block' : 'grid', gridTemplateColumns: '110px 1fr', gap: '20px' }}>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--accent)', marginBottom: isMobile ? '8px' : '0', paddingTop: isMobile ? '0' : '2px' }}>Share event</p>
          <div className="flex gap-3">
            <button onClick={() => handleShare('whatsapp')} title="Share on WhatsApp"
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110"
              style={{ borderColor: 'var(--border)', background: 'rgba(37,211,102,0.1)', color: '#25D366' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            <button onClick={() => handleShare('twitter')} title="Share on Twitter/X"
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110"
              style={{ borderColor: 'var(--border)', background: 'rgba(204,208,207,0.06)', color: 'var(--accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            <button onClick={() => handleShare('copy')} title="Copy link"
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110"
              style={{ borderColor: 'var(--border)', background: copied ? 'rgba(92,184,122,0.1)' : 'rgba(204,208,207,0.06)', color: copied ? '#5cb87a' : 'var(--accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            </button>
            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`)} title="Share on Facebook"
              className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:scale-110"
              style={{ borderColor: 'var(--border)', background: 'rgba(24,119,242,0.1)', color: '#1877F2' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>
          </div>
        </div>

        {/* ORGANIZER */}
        {event.organizer && (
          <div className="pb-6" style={{ borderColor: 'var(--border)', display: isMobile ? 'block' : 'grid', gridTemplateColumns: '110px 1fr', gap: '20px' }}>
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--accent)', marginBottom: isMobile ? '8px' : '0', paddingTop: isMobile ? '0' : '2px' }}>Organized by</p>
            <div>
            <Link href={`/organizer/${event.organizer.id}`} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'var(--bg3)', color: 'var(--text-bright)' }}>
                {event.organizer.avatarUrl
                  ? <img src={event.organizer.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : event.organizer.companyName
                    ? event.organizer.companyName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                    : `${event.organizer.firstName[0]}${event.organizer.lastName[0]}`}
              </div>
              <div>
                <p className="text-sm font-semibold group-hover:underline" style={{ color: 'var(--text-bright)' }}>
                  {event.organizer.companyName || `${event.organizer.firstName} ${event.organizer.lastName}`}
                </p>
                <p className="text-xs" style={{ color: 'var(--accent)' }}>View profile →</p>
              </div>
            </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-lg text-sm mt-4" style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555' }}>{error}</div>
        )}
      </div>
      {/* SIMILAR EVENTS */}
      {similarEvents.length > 0 && (
        <div className="border-t pt-6 pb-4" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-base font-bold px-5 mb-4" style={{ color: 'var(--text-bright)' }}>You might also like</h3>
          <div className="grid grid-cols-3 gap-4 px-5">
            {similarEvents.map(ev => {
              const evImage = ev.coverImageUrl || CATEGORY_IMAGES[ev.category] || CATEGORY_IMAGES.OTHER;
              const minPrice = ev.tiers?.length ? Math.min(...ev.tiers.map((t: any) => t.price)) : 0;
              return (
                <Link href={`/events/${ev.id}`} key={ev.id}>
                  <div className="cursor-pointer group">
                    <div className="rounded-2xl overflow-hidden mb-2" style={{ height: '140px' }}>
                      <img src={evImage} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <p className="font-bold line-clamp-2 mb-1" style={{ color: 'var(--text-bright)', fontSize: '13px', lineHeight: '1.3' }}>{ev.title}</p>
                    <p style={{ color: 'var(--accent)', fontSize: '11px', marginBottom: '2px' }}>{new Date(ev.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} · {ev.venue.split(',')[0]}</p>
                    <p className="font-bold" style={{ color: ev.isFree ? '#5cb87a' : 'var(--text-bright)', fontSize: '12px' }}>{ev.isFree ? 'Free' : `₦${minPrice.toLocaleString()}`}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ height: '40px' }} />

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="w-full max-w-lg rounded-t-2xl border-t" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="w-9 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: 'rgba(204,208,207,0.2)' }} />
            <div className="flex justify-between items-center px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Complete your order</p>
              <button onClick={() => setModalOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(204,208,207,0.08)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl border" style={{ background: 'rgba(204,208,207,0.04)', borderColor: 'rgba(204,208,207,0.1)' }}>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--accent)' }}>{selectedTier?.name} ticket</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>{selectedTier?.price === 0 ? 'Free' : `₦${selectedTier?.price.toLocaleString()}`}</p>
                </div>
                <button onClick={() => { setModalOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-xs px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: 'var(--border)', color: 'var(--accent)', background: 'transparent', cursor: 'pointer' }}>
                  Change →
                </button>
              </div>
              <div>
                <p className="text-xs tracking-wider uppercase mb-3" style={{ color: 'var(--accent)' }}>Quantity</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center text-lg font-bold"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-bright)', background: 'transparent', cursor: 'pointer' }}>−</button>
                  <span className="text-lg font-bold" style={{ color: 'var(--text-bright)', minWidth: '24px', textAlign: 'center' }}>{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(10, q + 1, available))}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center text-lg font-bold"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-bright)', background: 'transparent', cursor: 'pointer' }}>+</button>
                </div>
              </div>
              {selectedTier && selectedTier.price > 0 && (
                <>
                  <div>
                    <label className="block text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Promo code</label>
                    {promoApplied ? (
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg border"
                        style={{ background: 'rgba(92,184,122,0.08)', borderColor: 'rgba(92,184,122,0.3)' }}>
                        <span className="text-xs font-bold" style={{ color: '#5cb87a' }}>✓ {promoApplied.code} — {promoApplied.discountType === 'PERCENTAGE' ? `${promoApplied.discountValue}% off` : `₦${promoApplied.discountValue} off`}</span>
                        <button onClick={() => setPromoApplied(null)} className="text-xs" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="Enter promo code"
                            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none border font-mono"
                            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' }} />
                          <button onClick={validatePromo} disabled={validatingPromo || !promoCode}
                            className="text-xs font-bold px-4 py-2 rounded-lg"
                            style={{ background: 'var(--text-bright)', color: 'var(--bg)', cursor: 'pointer', border: 'none' }}>
                            {validatingPromo ? '...' : 'Apply'}
                          </button>
                        </div>
                        {promoError && <p className="text-xs mt-1" style={{ color: '#e05555' }}>{promoError}</p>}
                      </>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-3 border-t border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--accent)' }}>Total</span>
                    <div className="text-right">
                      {promoApplied && discount > 0 && (
                        <p className="text-xs line-through" style={{ color: 'var(--accent)' }}>₦{baseTotal.toLocaleString()}</p>
                      )}
                      <span className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>₦{total.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
              {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555' }}>{error}</p>}
              <button onClick={handleBuy} disabled={buying}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: 'var(--text-bright)', color: 'var(--bg)', cursor: 'pointer' }}>
                {buying ? <><Loader2 size={16} className="animate-spin" /> Processing...</> :
                  selectedTier?.price === 0 ? 'Reserve Free Ticket' : 'Buy Ticket'}
              </button>
              {!isAuthenticated && (
                <p className="text-xs text-center" style={{ color: 'var(--accent)' }}>
                  You'll need to <Link href="/auth/login" className="font-bold" style={{ color: 'var(--text-bright)' }}>sign in</Link> to purchase
                </p>
              )}
            </div>
          </div>
        </div>
      )}


      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={e => { e.stopPropagation(); setLightbox(l => l && l.index > 0 ? { ...l, index: l.index - 1 } : l); }}
            style={{ position: 'absolute', left: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 28, width: 48, height: 48, borderRadius: '50%', cursor: 'pointer' }}>‹</button>
          <img src={lightbox.images[lightbox.index]} alt="gallery" onClick={e => e.stopPropagation()}
            style={{ maxHeight: '85vh', maxWidth: '85vw', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={e => { e.stopPropagation(); setLightbox(l => l && l.index < l.images.length - 1 ? { ...l, index: l.index + 1 } : l); }}
            style={{ position: 'absolute', right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 28, width: 48, height: 48, borderRadius: '50%', cursor: 'pointer' }}>›</button>
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 20, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
          <div style={{ position: 'absolute', bottom: 24, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{lightbox.index + 1} / {lightbox.images.length}</div>
        </div>
      )}
    </div>
  );
}
