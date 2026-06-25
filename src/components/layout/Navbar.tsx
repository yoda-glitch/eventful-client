'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Ticket, Bell, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

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
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>Home</Link>
          <Link href="/events" className="text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>Browse</Link>
          {isAuthenticated && (
            <Link href="/dashboard" className="text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>Dashboard</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--accent)' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <>
              <Link href="/notifications" className="relative">
                <Bell size={18} style={{ color: 'var(--accent)' }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#e05555', color: '#fff', fontSize: '9px' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </Link>
              <Link href="/profile" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--bg3)', color: 'var(--text-bright)' }}>
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <>{user?.firstName[0]}{user?.lastName[0]}</>}
                </div>
              </Link>
              <button onClick={logout} className="hidden md:block cursor-pointer hover:text-white transition-colors">
                <LogOut size={16} style={{ color: 'var(--accent)' }} />
              </button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/auth/login" className="text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>Sign In</Link>
              <Link href="/auth/register" className="text-xs font-bold tracking-wider uppercase px-4 py-2 rounded transition-colors hover:opacity-90"
                style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>Sign Up</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden" style={{ color: 'var(--text-bright)', background: 'none', border: 'none', cursor: 'pointer' }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <div className="px-6 py-4 flex flex-col gap-4">
            <Link href="/" onClick={() => setMenuOpen(false)} className="text-sm tracking-wider uppercase" style={{ color: 'var(--accent)' }}>Home</Link>
            <Link href="/events" onClick={() => setMenuOpen(false)} className="text-sm tracking-wider uppercase" style={{ color: 'var(--accent)' }}>Browse</Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-sm tracking-wider uppercase" style={{ color: 'var(--accent)' }}>Dashboard</Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-sm tracking-wider uppercase" style={{ color: 'var(--accent)' }}>Profile</Link>
                <Link href="/notifications" onClick={() => setMenuOpen(false)} className="text-sm tracking-wider uppercase" style={{ color: 'var(--accent)' }}>Notifications</Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="text-sm tracking-wider uppercase text-left" style={{ color: '#e05555', background: 'none', border: 'none', cursor: 'pointer' }}>Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-sm tracking-wider uppercase" style={{ color: 'var(--accent)' }}>Sign In</Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="text-sm font-bold tracking-wider uppercase px-4 py-2 rounded text-center"
                  style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
