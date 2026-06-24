'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Ticket, Bell, User, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
          <span className="text-sm font-bold tracking-widest uppercase" 
            style={{ color: 'var(--text-bright)' }}>Eventful</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ color: 'var(--accent)' }}>Home</Link>
          <Link href="/events" className="text-xs tracking-wider uppercase hover:text-white transition-colors"
            style={{ color: 'var(--accent)' }}>Browse</Link>

          {isAuthenticated && (
            <Link href="/dashboard" className="text-xs tracking-wider uppercase hover:text-white transition-colors"
              style={{ color: 'var(--accent)' }}>Dashboard</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent)' }}>
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
              <button onClick={logout} className="cursor-pointer hover:text-white transition-colors">
                <LogOut size={16} style={{ color: 'var(--accent)' }} />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-xs tracking-wider uppercase hover:text-white transition-colors"
                style={{ color: 'var(--accent)' }}>Sign In</Link>
              <Link href="/auth/register"
                className="text-xs font-bold tracking-wider uppercase px-4 py-2 rounded transition-colors hover:opacity-90"
                style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
