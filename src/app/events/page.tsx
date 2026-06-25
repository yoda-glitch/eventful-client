'use client';
import { Suspense } from 'react';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Calendar, ChevronLeft, ChevronRight, Music, Briefcase, Mic, Trophy, Palette, UtensilsCrossed, Sparkles, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';

interface Event {
  id: string;
  title: string;
  slug: string;
  venue: string;
  startDate: string;
  category: string;
  isFree: boolean;
  coverImageUrl?: string;
  tiers?: { price: number }[];
  status: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: 'Music', BUSINESS: 'Business', CONFERENCE: 'Technology',
  FOOD_AND_DRINK: 'Food & Drink', CONCERT: 'Concert', NIGHTLIFE: 'Nightlife',
  PERFORMING_ARTS: 'Performing Arts', COMMUNITY: 'Community',
  HOBBIES: 'Hobbies', SEASONAL: 'Seasonal', OTHER: 'Other',
};

const CATEGORY_IMAGES: Record<string, string> = {
  MUSIC: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
  BUSINESS: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
  CONFERENCE: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80',
  FOOD_AND_DRINK: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
  CONCERT: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
  NIGHTLIFE: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
  PERFORMING_ARTS: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80',
  COMMUNITY: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80',
  OTHER: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
};

const CATEGORIES = [
  { key: 'All', label: 'All Events', icon: <LayoutGrid size={22} /> },
  { key: 'MUSIC', label: 'Music', icon: <Music size={22} /> },
  { key: 'BUSINESS', label: 'Business', icon: <Briefcase size={22} /> },
  { key: 'CONFERENCE', label: 'Technology', icon: <Mic size={22} /> },
  { key: 'FOOD_AND_DRINK', label: 'Food & Drink', icon: <UtensilsCrossed size={22} /> },
  { key: 'CONCERT', label: 'Concert', icon: <Music size={22} /> },
  { key: 'NIGHTLIFE', label: 'Nightlife', icon: <Sparkles size={22} /> },
  { key: 'OTHER', label: 'Other', icon: <Palette size={22} /> },
];

function EventsPageInner() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(() => searchParams.get('category') || 'All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: 'PUBLISHED',
      ...(search && { search }),
      ...(category !== 'All' && { category }),
    });
    api.get(`/events?${params}`)
      .then(res => {
        setEvents(res.data.data.events || []);
        setTotal(res.data.data.total || 0);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [search, category, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* PAGE HEADER */}
      <div className="border-b py-8" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-1" style={{ color:'var(--text-bright)' }}>Explore Events</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--accent)' }}>From concerts to conferences, find what moves you</p>

          {/* SEARCH */}
          <div className="flex items-center gap-3 rounded-lg px-4 py-3 border mb-8"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Search size={16} style={{ color: 'var(--accent)' }} />
            <input
              type="text"
              placeholder="Search events, artists, venues..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-bright)' }}
            />
          </div>

          {/* EVENTBRITE STYLE ICON CATEGORIES */}
          <div className="flex gap-8 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => { setCategory(cat.key); setPage(1); }}
                className="flex flex-col items-center gap-2 min-w-[64px] group"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all border group-hover:bg-[rgba(128,128,128,0.12)]"
                  style={{
                    background: category === cat.key ? 'var(--text-bright)' : 'transparent',
                    borderColor: category === cat.key ? 'var(--text-bright)' : 'rgba(204,208,207,0.15)',
                    color: category === cat.key ? 'var(--bg)' : 'var(--accent)',
                    boxShadow: category === cat.key ? '0 0 0 2px var(--text-bright)' : 'none',
                    transform: category === cat.key ? 'scale(1.08)' : 'scale(1)',
                  }}>
                  {cat.icon}
                </div>
                <span
                  className="text-xs text-center leading-tight"
                  style={{
                    color: category === cat.key ? 'var(--text-bright)' : 'var(--accent)',
                    fontWeight: category === cat.key ? 700 : 400,
                  }}>
                  {cat.label}
                </span>
                {category === cat.key && (
                  <div className="w-1 h-1 rounded-full" style={{ background: 'var(--text-bright)' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-xs mb-6 tracking-wider uppercase" style={{ color: 'var(--accent)' }}>
          {total} events found {category !== 'All' && `· ${CATEGORIES.find(c => c.key === category)?.label}`}
        </p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl h-64 animate-pulse" style={{ background: 'var(--card)' }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎭</p>
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-bright)' }}>No events found</p>
            <p className="text-sm" style={{ color: 'var(--accent)' }}>Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {events.map(event => {
              const image = event.coverImageUrl || CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES.OTHER;
              const minPrice = event.tiers?.length ? Math.min(...event.tiers.map(t => t.price)) : 0;
              return (
                <Link href={`/events/${event.id}`} key={event.id}>
                  <div className="cursor-pointer group">
                    <div className="rounded-2xl overflow-hidden mb-3" style={{ height: '220px' }}>
                      <img src={image} alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <p className="font-bold line-clamp-2 mb-1" style={{ color: 'var(--text-bright)', fontSize: '14px', lineHeight: '1.3' }}>{event.title}</p>
                    <p style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '2px' }}>
                      {new Date(event.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="truncate" style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '4px' }}>{event.venue.split(',')[0]}</p>
                    <p className="font-bold" style={{ color: event.isFree ? '#5cb87a' : 'var(--text-bright)', fontSize: '13px' }}>
                      {event.isFree ? 'Free' : `₦${minPrice.toLocaleString()}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border disabled:opacity-30"
              style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
              <ChevronLeft size={16} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className="w-8 h-8 rounded-lg text-xs font-bold border"
                style={{
                  background: page === i + 1 ? 'var(--text-bright)' : 'transparent',
                  color: page === i + 1 ? 'var(--bg)' : 'var(--accent)',
                  borderColor: 'var(--border)',
                }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg border disabled:opacity-30"
              style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense>
      <EventsPageInner />
    </Suspense>
  );
}
