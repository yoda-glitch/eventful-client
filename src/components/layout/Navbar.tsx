'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { Sun, Moon, Ticket, Bell, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/in-app-notifications/unread-count?t=' + Date.now())
        .then(res => setUnreadCount(res.data.data.count))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
      <div className="px-6 h-14 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2">
          <Ticket size={20} style={{ color: 'var(--text-bright)' }} />
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-bright)' }}>Eventful</span>
        </Link>

        {/* Desktop links */}
        {!isMobile && (
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>Home</Link>
            <Link href="/events" className="text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>Browse</Link>
            {isAuthenticated && (
              <Link href="/dashboard" className="text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>Dashboard</Link>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated && (
            <Link href="/notifications" style={{ position: 'relative', display: 'flex' }}>
              <Bell size={18} style={{ color: 'var(--accent)' }} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#e05555', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </Link>
          )}

          {isAuthenticated && (
            <Link href="/profile">
              <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)', color: 'var(--text-bright)', fontSize: 11, fontWeight: 700 }}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <>{user?.firstName[0]}{user?.lastName[0]}</>}
              </div>
            </Link>
          )}

          {!isMobile && !isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/auth/login" className="text-xs tracking-wider uppercase" style={{ color: 'var(--accent)' }}>Sign In</Link>
              <Link href="/auth/register" style={{ background: 'var(--text-bright)', color: 'var(--bg)', fontSize: 11, fontWeight: 700, padding: '8px 16px', borderRadius: 8, textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sign Up</Link>
            </div>
          )}

          {!isMobile && isAuthenticated && (
            <button onClick={logout} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <LogOut size={16} />
            </button>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ color: 'var(--text-bright)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Link href="/" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Home</Link>
          <Link href="/events" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Browse</Link>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dashboard</Link>
              <Link href="/profile" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile</Link>
              <Link href="/notifications" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notifications</Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} style={{ color: '#e05555', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent)', fontSize: 14, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sign In</Link>
              <Link href="/auth/register" onClick={() => setMenuOpen(false)} style={{ background: 'var(--text-bright)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, padding: '10px 16px', borderRadius: 8, textDecoration: 'none', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
