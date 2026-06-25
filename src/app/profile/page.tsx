'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Loader2, CheckCircle, ChevronLeft, User, Lock, Calendar, QrCode, Menu, X } from 'lucide-react';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [form, setForm] = useState({ firstName: '', lastName: '', companyName: '', city: '', bio: '', organizationType: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (user) {
      api.get('/users/me').then(res => {
        const u = res.data.data;
        setForm({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          companyName: u.companyName || '',
          city: u.city || '',
          bio: u.bio || '',
          organizationType: u.organizationType || '',
        });
        setAvatarUrl(u.avatarUrl || '');
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.upload('/users/me/avatar', formData);
      setAvatarUrl(res.data.data.avatarUrl);
      await refreshUser();
      setSuccess('Profile photo updated.');
    } catch {
      setError('Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await api.patch('/users/me', { avatarUrl: '' });
      setAvatarUrl('');
      setSuccess('Profile photo removed.');
    } catch {
      setError('Failed to remove photo.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.patch('/users/me', form);
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setError('Passwords do not match.'); return; }
    setSavingPassword(true); setError(''); setSuccess('');
    try {
      await api.patch('/users/me/password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setSuccess('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally { setSavingPassword(false); }
  };

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';
  const initials = form.companyName
    ? form.companyName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : `${form.firstName[0] || ''}${form.lastName[0] || ''}`.toUpperCase();
  const displayName = form.companyName || `${form.firstName} ${form.lastName}`;
  const inputStyle = { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-bright)' };

  const navItems = [
    { key: 'profile', label: 'Edit Profile', icon: <User size={14} /> },
    { key: 'password', label: 'Change Password', icon: <Lock size={14} /> },
  ];

  const SidebarContent = () => (
    <div>
      <div className="text-center mb-5">
        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold mx-auto mb-3"
          style={{ background: 'var(--bg3)', color: 'var(--text-bright)', border: '1px solid var(--border)' }}>
          {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initials}
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>{displayName}</p>
        {form.companyName && <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>by {form.firstName} {form.lastName}</p>}
        <span className="inline-block text-xs px-2 py-0.5 rounded mt-1" style={{ background: 'var(--bg3)', color: 'var(--accent)', border: '0.5px solid var(--border)' }}>{user?.role}</span>
      </div>
      <div className="flex flex-col gap-1">
        {navItems.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); setError(''); setSuccess(''); setDrawerOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all"
            style={{ background: activeTab === tab.key ? 'var(--bg3)' : 'transparent', color: activeTab === tab.key ? 'var(--text-bright)' : 'var(--accent)' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
        {isOrganizer && (
          <>
            <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              <Calendar size={14} /> My Events
            </Link>
            <Link href="/scanner" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              <QrCode size={14} /> Scan Tickets
            </Link>
          </>
        )}
      </div>
    </div>
  );

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Mobile/Tablet top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ display: typeof window !== "undefined" && window.innerWidth >= 1024 ? "none" : "flex", borderColor: "var(--border)" }} style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
          <ChevronLeft size={14} /> Back
        </button>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Profile</p>
        <button onClick={() => setDrawerOpen(true)} style={{ color: 'var(--text-bright)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Menu size={20} />
        </button>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, background: 'var(--bg2)', borderRight: '1px solid var(--border)', padding: 20, overflowY: 'auto' }}>
            <div className="flex justify-end mb-4">
              <button onClick={() => setDrawerOpen(false)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Desktop back button */}
        <div className="hidden lg:flex items-center gap-2 mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
            <ChevronLeft size={14} /> Back
          </button>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="rounded-2xl border p-5 flex-shrink-0" style={{ display: typeof window !== "undefined" && window.innerWidth >= 1024 ? "block" : "none" }} style={{ background: 'var(--bg2)', borderColor: 'var(--border)', height: 'fit-content', width: 240 }}>
            <SidebarContent />
          </div>

          {/* Main Content */}
          <div className="flex-1 rounded-2xl border p-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4" style={{ background: 'rgba(92,184,122,0.1)', color: '#5cb87a', border: '0.5px solid rgba(92,184,122,0.2)' }}>
                <CheckCircle size={14} /> {success}
              </div>
            )}
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm mb-4" style={{ background: 'rgba(224,85,85,0.1)', color: '#e05555', border: '0.5px solid rgba(224,85,85,0.2)' }}>
                {error}
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="space-y-5">
                <h2 className="text-sm font-bold pb-3 border-b" style={{ color: 'var(--text-bright)', borderColor: 'var(--border)' }}>Personal information</h2>
                <div className="flex items-center gap-5 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                    {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--accent)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-bright)' }}>Profile photo</p>
                    <p className="text-xs mb-3" style={{ color: 'var(--accent)' }}>{avatarUrl ? 'Your photo is visible on your public profile.' : 'Upload a photo. JPG or PNG. Max 2MB.'}</p>
                    <div className="flex gap-2 flex-wrap">
                      <label className="flex items-center gap-2 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer" style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                        {uploadingAvatar ? 'Uploading...' : avatarUrl ? 'Change photo' : 'Upload photo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                      </label>
                      {avatarUrl && (
                        <button type="button" onClick={handleAvatarRemove} className="font-bold text-xs px-4 py-2 rounded-lg border" style={{ borderColor: 'rgba(224,85,85,0.3)', color: '#e05555', background: 'transparent' }}>Remove</button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>First name</label>
                    <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Last name</label>
                    <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Email address</label>
                  <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 rounded-lg text-sm outline-none border opacity-50" style={inputStyle} />
                  <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>Email cannot be changed</p>
                </div>
                {isOrganizer && (
                  <>
                    <h2 className="text-sm font-bold pb-3 border-b pt-2" style={{ color: 'var(--text-bright)', borderColor: 'var(--border)' }}>Organization details</h2>
                    <div>
                      <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Company / Organization name</label>
                      <input type="text" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="e.g. Lagos Live Events" className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
                      <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>💡 This will be shown publicly on your profile and event listings</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>City</label>
                        <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Lagos" className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Organization type</label>
                        <select value={form.organizationType} onChange={e => setForm({ ...form, organizationType: e.target.value })} className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle}>
                          <option value="">Select type</option>
                          <option>Individual / Freelancer</option>
                          <option>Business / Company</option>
                          <option>Non-profit</option>
                          <option>Government / Institution</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Bio <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                      <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell attendees about you or your organization..." rows={3} className="w-full px-4 py-3 rounded-lg text-sm outline-none border resize-none" style={inputStyle} />
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-2 flex-wrap">
                  <button type="submit" disabled={saving} className="font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2" style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save changes'}
                  </button>
                  <button type="button" onClick={() => router.back()} className="font-bold text-sm px-6 py-3 rounded-xl border" style={{ borderColor: 'var(--border)', color: 'var(--accent)', background: 'transparent' }}>Cancel</button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <h2 className="text-sm font-bold pb-3 border-b" style={{ color: 'var(--text-bright)', borderColor: 'var(--border)' }}>Change password</h2>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Current password</label>
                  <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Enter current password" required className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>New password</label>
                  <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Min. 8 characters" required className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: 'var(--accent)' }}>Confirm new password</label>
                  <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Repeat new password" required className="w-full px-4 py-3 rounded-lg text-sm outline-none border" style={inputStyle} />
                </div>
                <button type="submit" disabled={savingPassword} className="font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2" style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                  {savingPassword ? <><Loader2 size={14} className="animate-spin" /> Changing...</> : 'Change password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
