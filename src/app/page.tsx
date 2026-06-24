'use client';
import { motion, AnimatePresence, useInView } from 'framer-motion';

function FadeIn({ children, delay = 0, direction = 'up' }: { children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right' | 'none' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const variants = {
    hidden: { opacity: 0, y: direction === 'none' ? 0 : 80 },
    visible: { opacity: 1, y: 0 },
  };
  const transition = direction === 'none'
    ? { duration: 0.8, delay, ease: 'easeOut' as const }
    : { duration: 1.1, delay, ease: 'easeOut' as const };
  return (
    <motion.div ref={ref} variants={variants} initial="hidden" animate={inView ? 'visible' : 'hidden'} transition={transition}>
      {children}
    </motion.div>
  );
}

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, ChevronLeft, ChevronRight, Tag, BarChart3, Bell, Mail, QrCode, CreditCard } from 'lucide-react';
import api from '@/lib/api';

interface Event {
  id: string;
  title: string;
  venue: string;
  startDate: string;
  category: string;
  isFree: boolean;
  coverImageUrl?: string;
  tiers?: { price: number }[];
  status: string;
}

const CATEGORY_IMAGES: Record<string, string> = {
  MUSIC: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80',
  BUSINESS: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1400&q=80',
  CONFERENCE: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1400&q=80',
  FOOD_AND_DRINK: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80',
  CONCERT: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1400&q=80',
  NIGHTLIFE: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1400&q=80',
  OTHER: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1400&q=80',
};

const CATEGORIES = ['MUSIC', 'BUSINESS', 'CONFERENCE', 'FOOD_AND_DRINK', 'CONCERT', 'NIGHTLIFE'];
const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: 'Music', BUSINESS: 'Business', CONFERENCE: 'Technology',
  FOOD_AND_DRINK: 'Food & Drink', CONCERT: 'Concert', NIGHTLIFE: 'Nightlife',
};

function EventCard({ event }: { event: Event }) {
  const image = event.coverImageUrl || CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES.OTHER;
  const minPrice = event.tiers?.length ? Math.min(...event.tiers.map(t => t.price)) : 0;
  return (
    <Link href={`/events/${event.id}`}>
      <div className="flex-shrink-0 cursor-pointer group" style={{ width: '285px' }}>
        <div className="rounded-2xl overflow-hidden" style={{ height: '291px', marginBottom: '12px' }}>
          <img src={image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>
        <p className="font-bold line-clamp-2" style={{ color: 'var(--text-bright)', fontSize: '15px', lineHeight: '1.3', marginBottom: '4px' }}>{event.title}</p>
        <p style={{ color: 'var(--accent)', fontSize: '13px', marginBottom: '2px' }}>
          {new Date(event.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        <p style={{ color: 'var(--accent)', fontSize: '13px', marginBottom: '4px' }}>{event.venue.split(',')[0]}</p>
        <p className="font-bold" style={{ color: event.isFree ? '#5cb87a' : 'var(--text-bright)', fontSize: '14px' }}>
          {event.isFree ? 'Free' : `₦${minPrice.toLocaleString()}`}
        </p>
      </div>
    </Link>
  );
}

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {

  const [count, setCount] = useState(0);

  const ref = useRef<HTMLSpanElement>(null);

  const started = useRef(false);

  useEffect(() => {

    const observer = new IntersectionObserver(([entry]) => {

      if (entry.isIntersecting && !started.current) {

        started.current = true;

        const duration = 1500;

        const steps = 40;

        const increment = target / steps;

        let current = 0;

        const timer = setInterval(() => {

          current += increment;

          if (current >= target) { setCount(target); clearInterval(timer); }

          else setCount(Math.floor(current));

        }, duration / steps);

      }

    }, { threshold: 0.5 });

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();

  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;

}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get('/events?limit=20&status=PUBLISHED')
      .then(res => setEvents(res.data.data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const featuredEvents = events.slice(0, 5);

  useEffect(() => {
    if (featuredEvents.length === 0) return;
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % featuredEvents.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [featuredEvents.length]);

  const goTo = (i: number) => {
    setSlide(i);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % featuredEvents.length), 5000);
  };

  const currentEvent = featuredEvents[slide];
  const heroImage = currentEvent?.coverImageUrl || CATEGORY_IMAGES[currentEvent?.category] || CATEGORY_IMAGES.OTHER;
  const eventsByCategory = CATEGORIES.map(cat => ({ label: CATEGORY_LABELS[cat], key: cat, events: events.filter(e => e.category === cat) })).filter(c => c.events.length > 0);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="relative overflow-hidden" style={{ height: '80vh', minHeight: '560px', marginTop: '12px', marginLeft: '16px', marginRight: '16px', borderRadius: '16px' }}>
        <div className="absolute inset-0 transition-all duration-700"
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(6,20,27,0.75) 0%, rgba(6,20,27,0.2) 55%, rgba(6,20,27,0) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,20,27,0.85) 0%, rgba(6,20,27,0.3) 30%, transparent 60%)' }} />
        {currentEvent && (
          <div className="absolute bottom-20 left-8 z-10 max-w-lg">
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xs mb-3 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {CATEGORY_LABELS[currentEvent.category] || currentEvent.category}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
              className="text-3xl md:text-5xl font-bold mb-3 leading-tight" style={{ color: '#fff' }}>{currentEvent.title}</motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
              className="text-sm mb-6 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <MapPin size={13} />{currentEvent.venue}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.65 }}>
              <Link href={`/events/${currentEvent.id}`}
                className="inline-block font-bold text-sm px-6 py-3 rounded-lg"
                style={{ background: '#fff', color: '#06141B' }}>
                Get Tickets
              </Link>
            </motion.div>
          </div>
        )}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            {featuredEvents.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ height: '3px', width: i === slide ? '24px' : '6px', borderRadius: '2px', background: i === slide ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => goTo((slide - 1 + featuredEvents.length) % featuredEvents.length)}
              className="flex items-center justify-center rounded-full"
              style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.25)', cursor: 'pointer', color: '#fff' }}>
              <ChevronLeft size={15} />
            </button>
            <button onClick={() => goTo((slide + 1) % featuredEvents.length)}
              className="flex items-center justify-center rounded-full"
              style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.25)', cursor: 'pointer', color: '#fff' }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
      <div className="py-6">
        {loading ? (
          <div className="px-8 py-12 text-center text-sm" style={{ color: 'var(--accent)' }}>Loading events...</div>
        ) : (
          eventsByCategory.map(({ label, events: catEvents }) => (
            <FadeIn key={label} delay={0.1}>
            <div className="mb-8">
              <div className="flex items-center justify-between px-16 mb-4">
                <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-bright)' }}>{label}</h2>
                <Link href="/events" className="text-xs" style={{ color: 'var(--accent)' }}>See all →</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto px-16 pb-4" style={{ scrollbarWidth: 'none' }}>
                {catEvents.map(event => <EventCard key={event.id} event={event} />)}
              </div>
            </div>
            </FadeIn>
          ))
        )}
      </div>


      {/* TESTIMONIALS */}
      <FadeIn delay={0.1}>
      <div className="py-12 px-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>What organizers say</p>
        <h2 className="text-2xl font-bold mb-10" style={{ color: 'var(--text-bright)', fontFamily: 'var(--font-heading)' }}>Trusted by organizers everywhere</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: 'We sold out 500 tickets in 3 days. The QR scanning at the entrance was seamless — no long queues, no fake tickets.', name: 'John Doe', role: 'Founder, Lagos Live Events', initials: 'JD' },
            { quote: 'I was skeptical at first but Eventful blew me away. Ticket sales went live in minutes and the dashboard gave me everything I needed in real time.', name: 'Bitrus Jeb', role: 'Head of Operations, TechFest', initials: 'BJ' },
            { quote: "Finally a platform that actually works. We have hosted 3 events and every single one sold out. Highly recommend.", name: 'Mark Johnson', role: 'Event Director, PHC Music Series', initials: 'MJ' },
          ].map((t, i) => (
            <div key={i} className="rounded-xl p-6 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#f0a500', fontSize: 14 }}>&#9733;</span>)}
              </div>
              <p className="leading-relaxed mb-6" style={{ color: 'var(--accent)', fontSize: 14 }}>"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                  style={{ background: 'var(--bg3)', color: 'var(--text-bright)', border: '0.5px solid var(--border)', fontSize: 13 }}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-bright)', fontSize: 14 }}>{t.name}</p>
                  <p style={{ color: 'var(--accent)', fontSize: 12 }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </FadeIn>
      {/* HOW IT WORKS */}
      <FadeIn delay={0.1}>
      <div className="py-12 px-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>How it works</p>
        <h2 className="text-2xl font-bold mb-10" style={{ color: 'var(--text-bright)' }}>Sell out your event in 3 steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {[
            { num: '01', title: 'Create your event', desc: 'Set up your event page in minutes. Add ticket tiers, gallery images, and event details.' },
            { num: '02', title: 'Sell tickets instantly', desc: 'Accept payments via Paystack. Money lands in your account directly — no delays.' },
            { num: '03', title: 'Scan at the door', desc: 'Every attendee gets a QR ticket by email. Scan it at the entrance — fast, secure, no fakes.' },
          ].map((step, i) => (
            <div key={i}>
              <p className="text-5xl font-bold mb-4" style={{ color: 'var(--accent)', opacity: 0.35 }}>{step.num}</p>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-bright)' }}>{step.title}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--accent)' }}>{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs tracking-widest uppercase mb-6" style={{ color: 'var(--accent)' }}>Everything you need</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: 'tag', color: 'rgba(92,184,122,0.1)', iconColor: '#5cb87a', title: 'Promo codes', desc: 'Create discount codes for early birds, VIP attendees, or group bookings.' },
              { icon: 'chart', color: 'rgba(66,133,244,0.1)', iconColor: '#4285F4', title: 'Real-time analytics', desc: 'Track ticket sales, revenue, check-in rates, and attendance live.' },
              { icon: 'bell', color: 'rgba(240,165,0,0.1)', iconColor: '#f0a500', title: 'Instant notifications', desc: 'Get alerted the moment someone buys a ticket or scans in at the door.' },
              { icon: 'mail', color: 'rgba(224,85,85,0.1)', iconColor: '#e05555', title: 'Contact organizer', desc: 'Attendees can reach you directly from your event or organizer profile.' },
              { icon: 'qr', color: 'rgba(139,92,246,0.1)', iconColor: '#8b5cf6', title: 'QR ticket scanning', desc: 'Every ticket gets a unique QR code. Scan at the entrance — fast, secure, no fakes.' },
              { icon: 'card', color: 'rgba(20,184,166,0.1)', iconColor: '#14b8a6', title: 'Paystack payments', desc: 'Accept payments instantly. Money lands in your account with zero delays.' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl" style={{ background: 'var(--bg3)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: f.color }}>
                  {f.icon === 'tag' && <Tag size={20} style={{ color: f.iconColor }} />}
                  {f.icon === 'chart' && <BarChart3 size={20} style={{ color: f.iconColor }} />}
                  {f.icon === 'bell' && <Bell size={20} style={{ color: f.iconColor }} />}
                  {f.icon === 'mail' && <Mail size={20} style={{ color: f.iconColor }} />}
                  {f.icon === 'qr' && <QrCode size={20} style={{ color: f.iconColor }} />}
                  {f.icon === 'card' && <CreditCard size={20} style={{ color: f.iconColor }} />}
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-bright)', fontSize: '15px' }}>{f.title}</p>
                  <p className="leading-relaxed" style={{ color: 'var(--accent)', fontSize: '13px' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
            </FadeIn>
            {/* STATS */}
            <FadeIn delay={0.1}>
      <div className="grid grid-cols-3 border-t border-b" style={{ borderColor: 'var(--border)' }}>
        {[
          { target: 20, suffix: '+', label: 'Events hosted' },
          { target: 500, suffix: '+', label: 'Tickets sold' },
          { target: 1000, suffix: '+', label: 'Satisfied Attendees' },
        ].map((stat, i) => (
          <div key={i} className="py-8 text-center border-r last:border-r-0" style={{ borderColor: 'var(--border)' }}>
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-bright)' }}><CountUp target={stat.target} suffix={stat.suffix} /></p>
            <p className="text-xs" style={{ color: 'var(--accent)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      </FadeIn>
      {/* ORGANIZER CTA */}
      <FadeIn direction="none" delay={0.1}>
      <div className="relative overflow-hidden px-8 py-16 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d2535 0%, var(--bg) 60%)' }} />
        <div className="relative z-10 max-w-lg">
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'rgba(204,208,207,0.7)' }}>For organizers</p>
          <h2 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#fff' }}>Ready to host your<br/>next event?</h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: 'rgba(204,208,207,0.8)' }}>
            Join organizers across Nigeria selling out concerts, conferences, and meetups — with zero stress and full control.
          </p>
          <div className="flex gap-3 mb-8">
            <Link href="/auth/register" className="font-bold text-sm px-6 py-3 rounded-lg"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
              Become an Organizer
            </Link>
            <Link href="/events" className="font-bold text-sm px-6 py-3 rounded-lg border"
              style={{ borderColor: 'rgba(204,208,207,0.4)', color: '#fff' }}>
              Browse Events
            </Link>
          </div>
        </div>
      </div>

      </FadeIn>
      <footer className="border-t py-8 px-8" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs" style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>E</div>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-bright)' }}>Eventful</span>
          </div>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Support', 'Browse Events'].map(l => (
              <span key={l} className="text-xs cursor-pointer hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>{l}</span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>

            <p style={{ color: 'var(--accent)', fontSize: 13 }}>© 2026 Eventful · Built for Africa</p>

            <p style={{ color: 'var(--accent)', fontSize: 13 }}>Built by <a href="https://github.com/yoda-glitch" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-bright)', textDecoration: 'none', fontWeight: 600 }}>Michael Vondee</a></p>

            <div style={{ display: 'flex', gap: 14, marginTop: 2 }}>

              <a href="https://github.com/yoda-glitch" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>GitHub</a>

              <a href="https://www.linkedin.com/in/michael-vondee/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>LinkedIn</a>

            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
