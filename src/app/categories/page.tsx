'use client';

import Link from 'next/link';
import { Music, Briefcase, Mic, Trophy, Palette, UtensilsCrossed, Sparkles, LayoutGrid } from 'lucide-react';

const CATEGORIES = [
  {
    key: 'MUSIC',
    label: 'Music',
    icon: <Music size={32} />,
    description: 'Concerts, live performances and music festivals',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
    color: '#e05555',
  },
  {
    key: 'BUSINESS',
    label: 'Business',
    icon: <Briefcase size={32} />,
    description: 'Networking events, seminars and business summits',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
    color: '#9BA8AB',
  },
  {
    key: 'CONFERENCE',
    label: 'Technology',
    icon: <Mic size={32} />,
    description: 'Tech talks, innovation events and developer workshops',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80',
    color: '#5cb87a',
  },
  {
    key: 'SPORTS',
    label: 'Sports',
    icon: <Trophy size={32} />,
    description: 'Sporting events, tournaments and fitness activities',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80',
    color: '#f0a500',
  },
  {
    key: 'ART',
    label: 'Arts',
    icon: <Palette size={32} />,
    description: 'Art exhibitions, theatre and cultural events',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80',
    color: '#a855f7',
  },
  {
    key: 'FOOD',
    label: 'Food & Drink',
    icon: <UtensilsCrossed size={32} />,
    description: 'Food festivals, tastings and culinary experiences',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    color: '#f97316',
  },
  {
    key: 'OTHER',
    label: 'Other',
    icon: <Sparkles size={32} />,
    description: 'Everything else — unique and special events',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
    color: '#CCD0CF',
  },
];

export default function CategoriesPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* HEADER */}
      <div className="border-b py-12" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--accent)' }}>Explore</p>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-bright)' }}>Browse Categories</h1>
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            Find exactly what you're looking for — explore events by category
          </p>
        </div>
      </div>

      {/* CATEGORIES GRID */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIES.map(cat => (
            <Link href={`/events?category=${cat.key}`} key={cat.key}>
              <div className="rounded-2xl overflow-hidden border cursor-pointer group transition-transform hover:-translate-y-1"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="relative h-48 overflow-hidden">
                  <img src={cat.image} alt={cat.label}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,20,27,0.95) 0%, rgba(6,20,27,0.3) 100%)' }} />
                  <div className="absolute bottom-4 left-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 border"
                      style={{ background: 'rgba(6,20,27,0.8)', borderColor: 'var(--border)', color: cat.color }}>
                      {cat.icon}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-bright)' }}>{cat.label}</h3>
                  <p className="text-sm" style={{ color: 'var(--accent)' }}>{cat.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-semibold tracking-wider uppercase"
                    style={{ color: cat.color }}>
                    Browse {cat.label} →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
