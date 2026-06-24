'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, ChevronLeft, ChevronRight, Tag, BarChart3, Bell, Mail } from 'lucide-react';
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
  MUSIC: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1400&q=80',
  BUSINESS: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80',
  CONFERENCE: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1400&q=80',
  FOOD_AND_DRINK: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1400&q=80',
  CONCERT: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1400&q=80',
  NIGHTLIFE: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1400&q=80',
  OTHER: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1400&q=80',
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
      <div className="flex-shrink-0 w-48 rounded-xl overflow-hidden cursor-pointer group" style={{ background: 'var(--bg2)' }}>
        <div className="relative overflow-hidden" style={{ height: '120px' }}>
          <img src={image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,20,27,0.7) 0%, transparent 60%)' }} />
        </div>
        <div className="p-3">
          <p className="text-xs font-semibold mb-1 line-clamp-2" style={{ color: 'var(--text-bright)' }}>{event.title}</p>
          <p className="mb-1" style={{ color: 'var(--accent)', fontSize: '10px' }}>
            {new Date(event.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} · {event.venue.split(',')[0]}
          </p>
          <p className="text-xs font-bold" style={{ color: event.isFree ? '#5cb87a' : 'var(--text-bright)' }}>
            {event.isFree ? 'Free' : `₦${minPrice.toLocaleString()}`}
          </p>
        </div>
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
      <div className="relative overflow-hidden" style={{ height: '92vh', minHeight: '600px', marginTop: '-56px' }}>
        <div className="absolute inset-0 transition-all duration-700"
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(6,20,27,0.75) 0%, rgba(6,20,27,0.2) 55%, rgba(6,20,27,0) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,20,27,1) 0%, rgba(6,20,27,0.5) 40%, transparent 70%)' }} />
        {currentEvent && (
          <div className="absolute bottom-20 left-8 z-10 max-w-lg">
            <p className="text-xs mb-3 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {CATEGORY_LABELS[currentEvent.category] || currentEvent.category}
            </p>
            <h1 className="text-5xl font-bold mb-3 leading-tight" style={{ color: '#fff' }}>{currentEvent.title}</h1>
            <p className="text-sm mb-6 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <MapPin size={13} />{currentEvent.venue}
            </p>
            <Link href={`/events/${currentEvent.id}`}
              className="inline-block font-bold text-sm px-6 py-3 rounded-lg"
              style={{ background: '#fff', color: '#06141B' }}>
              Get Tickets
            </Link>
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
            <div key={label} className="mb-8">
              <div className="flex items-center justify-between px-8 mb-4">
                <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-bright)' }}>{label}</h2>
                <Link href="/events" className="text-xs" style={{ color: 'var(--accent)' }}>See all →</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto px-8 pb-2" style={{ scrollbarWidth: 'none' }}>
                {catEvents.map(event => <EventCard key={event.id} event={event} />)}
              </div>
            </div>
          ))
        )}
      </div>


      {/* TESTIMONIALS */}
      <div className="py-12 px-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>What organizers say</p>
        <h2 className="text-2xl font-bold mb-10" style={{ color: 'var(--text-bright)' }}>Trusted by organizers across Nigeria</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: 'We sold out 500 tickets in 3 days. The QR scanning at the entrance was seamless — no long queues, no fake tickets.', name: 'Chidi Okonkwo', role: 'Founder, Lagos Live Events', initials: 'CO' },
            { quote: 'Setting up our conference ticketing took less than 20 minutes. Payments landed in our account the same day.', name: 'Amara Nwosu', role: 'Head of Operations, TechFest Abuja', initials: 'AN' },
            { quote: "Finally a Nigerian platform that actually works. We've hosted 3 events and every single one sold out.", name: 'Tunde Adeyemi', role: 'Event Director, PHC Music Series', initials: 'TA' },
          ].map((t, i) => (
            <div key={i} className="rounded-xl p-6 border" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--accent)' }}>"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--bg3)', color: 'var(--text-bright)', border: '0.5px solid var(--border)' }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: 'var(--accent)' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
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
          <div className="grid grid-cols-2 gap-4" style={{ maxWidth: "600px" }}>
            {[
              { icon: 'tag', color: 'rgba(92,184,122,0.1)', iconColor: '#5cb87a', title: 'Promo codes', desc: 'Create discount codes for early birds or VIP attendees.' },
              { icon: 'chart', color: 'rgba(66,133,244,0.1)', iconColor: '#4285F4', title: 'Real-time analytics', desc: 'Track ticket sales, revenue, and attendance live.' },
              { icon: 'bell', color: 'rgba(240,165,0,0.1)', iconColor: '#f0a500', title: 'Instant notifications', desc: 'Get alerted the moment someone buys a ticket.' },
              { icon: 'mail', color: 'rgba(224,85,85,0.1)', iconColor: '#e05555', title: 'Contact organizer', desc: 'Attendees can reach you directly from your profile.' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg3)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: f.color }}>
                  {f.icon === 'tag' && <Tag size={16} style={{ color: f.iconColor }} />}
                  {f.icon === 'chart' && <BarChart3 size={16} style={{ color: f.iconColor }} />}
                  {f.icon === 'bell' && <Bell size={16} style={{ color: f.iconColor }} />}
                  {f.icon === 'mail' && <Mail size={16} style={{ color: f.iconColor }} />}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-bright)' }}>{f.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--accent)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
            {/* STATS */}
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

      {/* ORGANIZER CTA */}
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
          <div className="flex flex-col gap-2">
            {['Free to create an account', 'Paystack payments — money goes directly to you', 'QR ticket scanning included', 'Promo & discount codes', 'Real-time sales analytics', 'Instant notifications on every sale'].map((item, i) => (
              <p key={i} className="text-xs flex items-center gap-2" style={{ color: '#fff' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t py-8 px-8" style={{ borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs" style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>E</div>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-bright)' }}>Eventful</span>
          </div>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Support', 'Browse Events'].map(l => (
              <span key={l} className="text-xs cursor-pointer hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>{l}</span>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--accent)' }}>© 2026 Eventful · Built for Africa</p>
        </div>
      </footer>
    </div>
  );
}
