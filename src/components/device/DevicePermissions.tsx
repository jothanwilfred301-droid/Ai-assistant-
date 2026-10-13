import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mic,
  Camera,
  Bell,
  HardDrive,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

interface PermissionEntry {
  id: string;
  name: string;
  icon: any;
  purpose: string;
  status: 'granted' | 'prompt' | 'denied' | 'unsupported';
  onRequest: () => Promise<void>;
}

export const DevicePermissions: React.FC = () => {
  const [micStatus, setMicStatus] = useState<'granted' | 'prompt' | 'denied' | 'unsupported'>('prompt');
  const [camStatus, setCamStatus] = useState<'granted' | 'prompt' | 'denied' | 'unsupported'>('prompt');
  const [notifStatus, setNotifStatus] = useState<'granted' | 'prompt' | 'denied' | 'unsupported'>('prompt');
  const [geoStatus, setGeoStatus] = useState<'granted' | 'prompt' | 'denied' | 'unsupported'>('prompt');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Check initial permissions
  useEffect(() => {
    // Check Notification status
    if (typeof Notification !== 'undefined') {
      setNotifStatus(Notification.permission as any);
    } else {
      setNotifStatus('unsupported');
    }

    // Check navigator.permissions if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((res) => setMicStatus(res.state as any))
        .catch(() => {});

      navigator.permissions
        .query({ name: 'camera' as any })
        .then((res) => setCamStatus(res.state as any))
        .catch(() => {});

      navigator.permissions
        .query({ name: 'geolocation' as any })
        .then((res) => setGeoStatus(res.state as any))
        .catch(() => {});
    }
  }, []);

  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('granted');
      setStatusMessage('Microphone access granted for voice input & audio recording.');
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setMicStatus('denied');
      setStatusMessage('Microphone permission denied.');
    }
  };

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCamStatus('granted');
      setStatusMessage('Camera access granted for scene references.');
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setCamStatus('denied');
      setStatusMessage('Camera permission denied.');
    }
  };

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const result = await Notification.requestPermission();
      setNotifStatus(result as any);
      if (result === 'granted') {
        new Notification('DAYMATE AI', {
          body: 'Notifications active! Daily briefings and task alerts enabled.',
          icon: '/icon.svg',
        });
        setStatusMessage('Notifications granted.');
      } else {
        setStatusMessage('Notification permission denied.');
      }
    } catch {
      setStatusMessage('Failed to request notifications.');
    }
  };

  const requestGeolocation = async () => {
    if (!navigator.geolocation) {
      setGeoStatus('unsupported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoStatus('granted');
        setStatusMessage('Location granted for local contextual weather & scheduling.');
      },
      () => {
        setGeoStatus('denied');
        setStatusMessage('Location permission denied.');
      }
    );
  };

  const permissions: PermissionEntry[] = [
    {
      id: 'mic',
      name: 'Microphone',
      icon: Mic,
      purpose: 'Enables continuous voice recognition, speech-to-text, and conversational interruptions.',
      status: micStatus,
      onRequest: requestMicrophone,
    },
    {
      id: 'camera',
      name: 'Camera',
      icon: Camera,
      purpose: 'Enables capturing reference photos and textures for Motion Studio visual development.',
      status: camStatus,
      onRequest: requestCamera,
    },
    {
      id: 'notif',
      name: 'Push Notifications',
      icon: Bell,
      purpose: 'Dispatches morning intelligence briefings, task deadline reminders, and checkpoint approval alerts.',
      status: notifStatus,
      onRequest: requestNotifications,
    },
    {
      id: 'storage',
      name: 'Storage & Offline Files',
      icon: HardDrive,
      purpose: 'Persists task queues, memories, motion project files, and audio assets on device.',
      status: 'granted',
      onRequest: async () => {},
    },
    {
      id: 'geo',
      name: 'Geolocation (Contextual)',
      icon: MapPin,
      purpose: 'Contextualizes daily planning with local sunrise/sunset and regional intelligence.',
      status: geoStatus,
      onRequest: requestGeolocation,
    },
  ];

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Device Permission Center
        </h2>
        <p className="text-[11px] text-slate-400">
          Transparent, least-privilege control over Android and browser hardware integrations.
        </p>
      </div>

      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-800/80 text-xs text-cyan-300">
          {statusMessage}
        </div>
      )}

      {/* Security Boundary Notice */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Security & Boundary Policy</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          DAYMATE AI respects Android sandbox boundaries. It operates as a web application / PWA and never claims unrestricted access to your private files, contacts, or system settings.
        </p>
      </div>

      {/* Permissions List */}
      <div className="space-y-2.5">
        {permissions.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-slate-950 text-cyan-400 border border-slate-800 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{p.name}</h3>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        p.status === 'granted'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : p.status === 'denied'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{p.purpose}</p>
                </div>
              </div>

              <div>
                {p.status !== 'granted' && p.status !== 'unsupported' ? (
                  <button
                    onClick={p.onRequest}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95 whitespace-nowrap"
                  >
                    Grant
                  </button>
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
