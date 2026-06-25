'use client';
import { Suspense } from 'react';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Ticket, Calendar, QrCode, BarChart3, Plus, Loader2, MapPin, ScanLine, MoreVertical } from 'lucide-react';
import api from '@/lib/api';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  tickets: {
    id: string;
    qrCodeHash: string;
    isUsed: boolean;
    tier: {
      name: string;
      price: number;
      event: {
        id: string;
        title: string;
        startDate: string;
        venue: string;
        coverImageUrl?: string;
        category: string;
      };
    };
  }[];
}

const CATEGORY_IMAGES: Record<string, string> = {
  MUSIC: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
  BUSINESS: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
  CONFERENCE: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&q=80',
  SPORTS: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80',
  ART: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80',
  FOOD: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
  OTHER: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80',
};

function DashboardPageInner() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'events' | 'analytics'>('tickets');
  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'events' || tab === 'analytics' || tab === 'tickets') setActiveTab(tab);
  }, [searchParams]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [qrModal, setQrModal] = useState<{ hash: string; title: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        api.get('/users/me/tickets'),
        api.get('/users/me/events'),
      ]).then(([ticketsRes, eventsRes]) => {
        setOrders(ticketsRes.data.data || []);
        setMyEvents(eventsRes.data.data || []);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [isAuthenticated]);
  useEffect(() => {
    if (activeTab === 'analytics' && analytics.length === 0) {
      setLoadingAnalytics(true);
      api.get('/analytics/dashboard')
        .then(res => setAnalytics(Array.isArray(res.data.data) ? res.data.data : res.data.data?.events || []))
        .catch(() => {})
        .finally(() => setLoadingAnalytics(false));
    }
  }, [activeTab]);


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }


  const totalTickets = orders.reduce((acc, o) => acc + o.tickets.length, 0);
  const upcomingEvents = orders.filter(o =>
    o.tickets.some(t => new Date(t.tier.event.startDate) > new Date())
  ).length;
  const totalSpent = orders.filter(o => o.status === 'COMPLETED').reduce((acc, o) => acc + Number(o.totalAmount), 0);
  const scannedTickets = orders.reduce((acc, o) => acc + o.tickets.filter(t => t.isUsed).length, 0);

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';
  const totalEventsCreated = myEvents.length;
  const totalTicketsSold = myEvents.reduce((acc, e) => acc + (e.tiers?.reduce((a: number, t: any) => a + t.soldQuantity, 0) || 0), 0);
  const totalRevenue = myEvents.reduce((acc, e) => acc + (e.tiers?.reduce((a: number, t: any) => a + (t.soldQuantity * Number(t.price)), 0) || 0), 0);
  const totalScanned = 0; // TODO: fetch from analytics endpoint

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="border-b py-8" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--accent)' }}>Welcome back</p>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--accent)' }}>{user?.email}</p>
            </div>
            {(user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && (
              <>
                <Link href="/events/create" className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm" style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                  <Plus size={16} /> Create Event
                </Link>
                <Link href="/scanner" className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>
                  <ScanLine size={16} /> Scan Tickets
                </Link>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {(isOrganizer ? [
              { label: 'Total Events', value: totalEventsCreated, icon: <Calendar size={20} />, color: '#5cb87a' },
              { label: 'Tickets Sold', value: totalTicketsSold, icon: <Ticket size={20} />, color: 'var(--text-bright)' },
              { label: 'Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: <BarChart3 size={20} />, color: '#9BA8AB' },
              { label: 'Tickets Scanned', value: totalScanned, icon: <QrCode size={20} />, color: '#e05555' },
            ] : [
              { label: 'Total Tickets', value: totalTickets, icon: <Ticket size={20} />, color: '#5cb87a' },
              { label: 'Upcoming Events', value: upcomingEvents, icon: <Calendar size={20} />, color: 'var(--text-bright)' },
            ]).map((stat, i) => (
              <div key={i} className="rounded-xl p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--accent)' }}>{stat.label}</p>
                  <div style={{ color: stat.color }}>{stat.icon}</div>
                </div>
                <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--bg2)' }}>
          {((user?.role === 'ORGANIZER' || user?.role === 'ADMIN') ? (['tickets', 'events', 'analytics'] as const) : (['tickets'] as const)).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-md text-sm font-semibold transition-all capitalize"
              style={{
                background: activeTab === tab ? 'var(--text-bright)' : 'transparent',
                color: activeTab === tab ? 'var(--bg)' : 'var(--accent)',
              }}>
              {tab === 'analytics' ? 'Analytics' : `My ${tab.charAt(0).toUpperCase() + tab.slice(1)}`}
            </button>
          ))}
        </div>

        {activeTab === 'tickets' && (
          orders.length === 0 ? (
            <div className="text-center py-20">
              <Ticket size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-bright)' }}>No tickets yet</p>
              <p className="text-sm mb-6" style={{ color: 'var(--accent)' }}>Browse events and grab your first ticket</p>
              <Link href="/events" className="inline-block font-bold text-sm px-6 py-3 rounded-lg"
                style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order =>
                order.tickets.map(ticket => {
                  const event = ticket.tier.event;
                  const image = event.coverImageUrl || CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES.OTHER;
                  const isPast = new Date(event.startDate) < new Date();
                  return (
                    <div key={ticket.id} className="rounded-xl border overflow-hidden"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                      <div className="flex">
                        <div className="relative flex-shrink-0" style={{ width: 100 }}>
                          <img src={image} alt={event.title} className="w-full h-full object-cover opacity-70" style={{ minHeight: 100 }} />
                          {isPast && (
                            <div className="absolute inset-0 flex items-center justify-center"
                              style={{ background: 'rgba(6,20,27,0.7)' }}>
                              <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>PAST</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-bright)' }}>{event.title}</p>
                            <span className="inline-block text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background: ticket.isUsed ? 'rgba(224,85,85,0.1)' : 'rgba(92,184,122,0.1)',
                                color: ticket.isUsed ? '#e05555' : '#5cb87a',
                              }}>
                              {ticket.isUsed ? 'Used' : 'Valid'}
                            </span>
                          </div>
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                            <Calendar size={10} />
                            {new Date(event.startDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs mt-0.5 flex items-center gap-1 truncate" style={{ color: 'var(--accent)' }}>
                            <MapPin size={10} /> {event.venue}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs" style={{ color: 'var(--accent)' }}>{ticket.tier.name}</p>
                            <button onClick={() => setQrModal({ hash: ticket.qrCodeHash, title: event.title })}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                              style={{ background: 'var(--bg2)', color: ticket.isUsed ? 'var(--accent)' : 'var(--text-bright)', border: '1px solid var(--border)' }}>
                              <QrCode size={12} /> QR
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )
        )}

        {activeTab === 'events' && (
          myEvents.length === 0 ? (
            <div className="text-center py-20">
              <Calendar size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-bright)' }}>No events created yet</p>
              <p className="text-sm mb-6" style={{ color: 'var(--accent)' }}>Start hosting your own events</p>
              <Link href="/events/create"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-lg"
                style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                <Plus size={16} /> Create Your First Event
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {myEvents.map((event: any) => (
                <div key={event.id} className="rounded-xl border p-4"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div style={{ marginBottom: 12 }}>
                    <p className="font-semibold mb-1" style={{ color: 'var(--text-bright)' }}>{event.title}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                      <Calendar size={10} />
                      {new Date(event.startDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--accent)' }}>
                      <MapPin size={10} /> {event.venue}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{
                        background: event.status === 'PUBLISHED' ? 'rgba(92,184,122,0.1)' : 'rgba(224,85,85,0.1)',
                        color: event.status === 'PUBLISHED' ? '#5cb87a' : '#e05555',
                      }}>
                      {event.status}
                    </span>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setOpenMenu(prev => prev === event.id ? null : event.id)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--accent)' }}>
                        <MoreVertical size={16} />
                      </button>
                      {openMenu === event.id && (
                        <>
                        <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                        <div style={{ position: 'absolute', right: 0, bottom: 36, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, width: 170, zIndex: 50, overflow: 'hidden' }}>
                          <Link href={'/events/' + event.id + '?from=dashboard'} onClick={() => setOpenMenu(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text-bright)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
                            <QrCode size={14} /> View event
                          </Link>
                          <Link href={'/events/edit/' + event.id + '?from=dashboard'} onClick={() => setOpenMenu(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text-bright)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
                            <BarChart3 size={14} /> Edit event
                          </Link>
                          <Link href={'/events/' + event.id + '/checkin?from=dashboard'} onClick={() => setOpenMenu(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text-bright)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
                            <ScanLine size={14} /> Check-in
                          </Link>

                          <button
                            onClick={async () => {
                              setOpenMenu(null);
                              if (confirm('Delete this event?')) {
                                try {
                                  await api.delete('/events/' + event.id);
                                  setMyEvents(prev => prev.filter((e: any) => e.id !== event.id));
                                } catch (err: any) {
                                  alert(err.response?.data?.error || 'Failed to delete event');
                                }
                              }
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, color: '#e05555', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                            <Ticket size={14} /> Delete
                          </button>
                        </div>
                        </>
                      )}
                    </div>
                    </div>
                </div>
              ))}
            </div>
          )
        )}
        {activeTab === 'analytics' && (
          <div>
            {loadingAnalytics ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>
            ) : analytics.length === 0 ? (
              <div className="text-center py-20">
                <BarChart3 size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-bright)' }}>No analytics yet</p>
                <p className="text-xs" style={{ color: 'var(--accent)' }}>Create and publish events to see analytics</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Total Tickets Sold', value: analytics.reduce((a: number, e: any) => a + e.totalTicketsSold, 0) },
                    { label: 'Total Revenue', value: `₦${analytics.reduce((a: number, e: any) => a + Number(e.totalRevenue), 0).toLocaleString()}` },
                    { label: 'Total Scanned', value: analytics.reduce((a: number, e: any) => a + e.scannedTickets, 0) },
                  ].map((stat, i) => (
                    <div key={i} className="rounded-xl p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                      <p className="text-xs tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>{stat.label}</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {analytics.map((event: any) => {
                    const pct = event.totalTickets > 0 ? Math.round((event.totalTicketsSold / event.totalTickets) * 100) : 0;
                    const isFree = event.totalRevenue === 0 && event.totalTickets > 0 && event.totalTicketsSold > 0;
                    return (
                      <div key={event.eventId} className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-bright)' }}>{event.eventTitle}</p>
                            <p className="text-xs" style={{ color: 'var(--accent)' }}>{new Date(event.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg3)', color: 'var(--accent)', fontSize: '11px' }}>
                              {isFree ? 'Free' : Number(event.totalRevenue) === 0 ? '₦0' : `₦${Number(event.totalRevenue).toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 80px 80px' }}>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs" style={{ color: 'var(--accent)' }}>Capacity</span>
                              <span className="text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>{event.totalTicketsSold} / {event.totalTickets}</span>
                            </div>
                            <div className="rounded-full overflow-hidden" style={{ height: '5px', background: 'var(--border)' }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#5cb87a' }} />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs mb-1" style={{ color: 'var(--accent)' }}>Revenue</p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>{Number(event.totalRevenue) === 0 ? '—' : `₦${Number(event.totalRevenue).toLocaleString()}`}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs mb-1" style={{ color: 'var(--accent)' }}>Scanned</p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>{event.scannedTickets}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR MODAL */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setQrModal(null)}>
          <div className="rounded-2xl border p-6 max-w-xs w-full text-center" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-bright)' }}>{qrModal.title}</p>
            <p className="text-xs mb-4" style={{ color: 'var(--accent)' }}>Show this at the entrance</p>
            <div className="bg-white p-4 rounded-xl mx-auto inline-block mb-4">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrModal.hash}`} alt="QR Code" width={180} height={180} />
            </div>
            <p className="text-xs font-mono break-all mb-4" style={{ color: 'var(--accent)' }}>{qrModal.hash}</p>
            <button onClick={() => setQrModal(null)} className="text-xs px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageInner />
    </Suspense>
  );
}
