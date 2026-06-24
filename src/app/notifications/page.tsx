'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loader2, Bell, Check, Trash2, CheckCheck, Ticket, CreditCard, Smartphone, PartyPopper, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  TICKET_CONFIRMED: <Ticket size={16} style={{ color: '#5cb87a' }} />,
  PAYMENT_SUCCESS: <CreditCard size={16} style={{ color: '#5cb87a' }} />,
  TICKET_SCANNED: <Smartphone size={16} style={{ color: 'var(--text-bright)' }} />,
  TICKET_SOLD: <PartyPopper size={16} style={{ color: '#f0a500' }} />,
  EVENT_PUBLISHED: <CheckCircle size={16} style={{ color: '#5cb87a' }} />,
  EVENT_CANCELLED: <XCircle size={16} style={{ color: '#e05555' }} />,
  EVENT_REMINDER: <Clock size={16} style={{ color: '#f0a500' }} />,
  LOW_STOCK: <AlertTriangle size={16} style={{ color: '#f0a500' }} />,
};

export default function NotificationsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    api.get('/in-app-notifications?t=' + Date.now())
      .then(res => setNotifications(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id: string) => {
    await api.patch(`/in-app-notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = async () => {
    await api.patch('/in-app-notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = async (id: string) => {
    await api.delete(`/in-app-notifications/${id}`);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell size={20} style={{ color: 'var(--text-bright)' }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#e05555', color: '#fff' }}>{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs font-bold"
              style={{ color: 'var(--accent)' }}>
              <CheckCheck size={14} /> Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-bright)' }}>No notifications yet</p>
            <p className="text-xs" style={{ color: 'var(--accent)' }}>We'll notify you when something happens</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map(n => (
              <div key={n.id} className="flex items-start gap-3 rounded-xl border p-4 transition-all"
                style={{ background: n.isRead ? 'var(--bg2)' : 'var(--bg3)', borderColor: n.isRead ? 'var(--border)' : 'rgba(204,208,207,0.2)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)' }}>
                  {TYPE_ICONS[n.type] || <Bell size={16} style={{ color: 'var(--accent)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-bright)' }}>{n.title}</p>
                  <p className="text-xs leading-relaxed mb-1" style={{ color: 'var(--accent)' }}>{n.message}</p>
                  <p className="text-xs" style={{ color: 'var(--accent)', opacity: 0.6 }}>
                    {new Date(n.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!n.isRead && (
                    <button onClick={() => markAsRead(n.id)} title="Mark as read"
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(92,184,122,0.1)', color: '#5cb87a', border: 'none', cursor: 'pointer' }}>
                      <Check size={13} />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(n.id)} title="Delete"
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
