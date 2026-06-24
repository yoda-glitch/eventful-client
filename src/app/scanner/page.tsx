'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, CheckCircle, XCircle, Loader2, Camera } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface ScanResult {
  success: boolean;
  message: string;
  ticket?: {
    id: string;
    attendeeName?: string;
    tierName?: string;
    eventTitle?: string;
  };
}

export default function ScannerPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualHash, setManualHash] = useState('');
  const [validating, setValidating] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [tab, setTab] = useState<'camera' | 'manual'>('manual');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'ORGANIZER' && user?.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        setCameraError('');
      }
    } catch {
      setCameraError('Could not access camera. Use manual entry instead.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const validateHash = async (hash: string) => {
    if (!hash.trim()) return;
    setValidating(true);
    setResult(null);
    try {
      const res = await api.post('/qr/validate', { qrCodeHash: hash.trim() });
      const data = res.data.data;
      setResult({
        success: true,
        message: 'Ticket validated successfully!',
        ticket: {
          id: data.ticket?.id,
          attendeeName: data.ticket?.user ? `${data.ticket.user.firstName} ${data.ticket.user.lastName}` : undefined,
          tierName: data.ticket?.tier?.name,
          eventTitle: data.ticket?.tier?.event?.title,
        },
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.response?.data?.error || 'Invalid or already used ticket.',
      });
    } finally {
      setValidating(false);
      setManualHash('');
    }
  };

  const handleManualSubmit = () => validateHash(manualHash);

  const resetResult = () => setResult(null);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 border-b backdrop-blur-md"
        style={{ background: 'rgba(6,20,27,0.95)', borderColor: 'var(--border)' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
          <ChevronLeft size={14} /> Back
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs" style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>E</div>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-bright)' }}>Eventful</span>
        </Link>
        <div style={{ width: 60 }} />
      </nav>

      <div className="px-5 py-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-bright)' }}>Ticket Scanner</h1>
        <p className="text-xs mb-6" style={{ color: 'var(--accent)' }}>Validate tickets at the entrance</p>

        {/* TABS */}
        <div className="flex border-b mb-6" style={{ borderColor: 'var(--border)' }}>
          {(['manual', 'camera'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === 'camera') startCamera(); else stopCamera(); }}
              className="text-xs py-3 mr-6 font-semibold capitalize border-b-2 transition-all"
              style={{
                borderColor: tab === t ? 'var(--text-bright)' : 'transparent',
                color: tab === t ? 'var(--text-bright)' : 'var(--accent)',
              }}>
              {t === 'camera' ? 'Camera Scan' : 'Manual Entry'}
            </button>
          ))}
        </div>

        {/* RESULT */}
        {result && (
          <div className="rounded-xl border p-5 mb-6 text-center"
            style={{ background: result.success ? 'rgba(92,184,122,0.08)' : 'rgba(224,85,85,0.08)', borderColor: result.success ? 'rgba(92,184,122,0.3)' : 'rgba(224,85,85,0.3)' }}>
            {result.success
              ? <CheckCircle size={40} className="mx-auto mb-3" style={{ color: '#5cb87a' }} />
              : <XCircle size={40} className="mx-auto mb-3" style={{ color: '#e05555' }} />}
            <p className="text-sm font-bold mb-1" style={{ color: result.success ? '#5cb87a' : '#e05555' }}>{result.message}</p>
            {result.ticket && (
              <div className="mt-3 text-left rounded-lg p-3" style={{ background: 'rgba(204,208,207,0.05)' }}>
                {result.ticket.eventTitle && <p className="text-xs mb-1" style={{ color: 'var(--text-bright)' }}><span style={{ color: 'var(--accent)' }}>Event: </span>{result.ticket.eventTitle}</p>}
                {result.ticket.tierName && <p className="text-xs mb-1" style={{ color: 'var(--text-bright)' }}><span style={{ color: 'var(--accent)' }}>Tier: </span>{result.ticket.tierName}</p>}
                {result.ticket.attendeeName && <p className="text-xs" style={{ color: 'var(--text-bright)' }}><span style={{ color: 'var(--accent)' }}>Attendee: </span>{result.ticket.attendeeName}</p>}
              </div>
            )}
            <button onClick={resetResult} className="mt-4 text-xs px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--accent)', background: 'transparent' }}>
              Scan Another
            </button>
          </div>
        )}

        {/* MANUAL ENTRY */}
        {tab === 'manual' && !result && (
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--accent)' }}>Paste or type the ticket QR hash</p>
            <textarea
              value={manualHash}
              onChange={e => setManualHash(e.target.value)}
              placeholder="Paste QR hash here..."
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-xs resize-none outline-none mb-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-bright)', fontFamily: 'monospace' }}
            />
            <button onClick={handleManualSubmit} disabled={validating || !manualHash.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)', opacity: !manualHash.trim() ? 0.5 : 1, cursor: !manualHash.trim() ? 'not-allowed' : 'pointer' }}>
              {validating ? <><Loader2 size={16} className="animate-spin" /> Validating...</> : 'Validate Ticket'}
            </button>
          </div>
        )}

        {/* CAMERA */}
        {tab === 'camera' && !result && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {cameraError ? (
              <div className="p-6 text-center">
                <Camera size={32} className="mx-auto mb-3" style={{ color: 'var(--accent)' }} />
                <p className="text-xs" style={{ color: '#e05555' }}>{cameraError}</p>
              </div>
            ) : (
              <>
                <div className="relative" style={{ height: '300px', background: '#000' }}>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Scan frame overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: 'var(--text-bright)' }} />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2" style={{ borderColor: 'var(--text-bright)' }} />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2" style={{ borderColor: 'var(--text-bright)' }} />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: 'var(--text-bright)' }} />
                    </div>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <p className="text-xs" style={{ color: 'var(--accent)' }}>
                    {scanning ? 'Point camera at QR code' : 'Starting camera...'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
