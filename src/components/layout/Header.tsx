import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Sparkles,
  Cloud,
  CloudCheck,
  User as UserIcon,
  LogOut,
  LogIn,
  CheckCircle2,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.js';
import { AgentRole } from '../../types.js';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInAnonymously,
  fbSignOut,
  onAuthStateChanged,
  User,
  testConnection,
} from '../../lib/firebase.js';

interface HeaderProps {
  activeAgent: AgentRole;
  isVoiceMuted: boolean;
  onToggleVoiceMute: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeAgent,
  isVoiceMuted,
  onToggleVoiceMute,
  isMobileFrame,
  onToggleMobileFrame,
}) => {
  const [time, setTime] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor Firebase Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    // Test Firestore connection on load
    testConnection().then((connected) => {
      setIsCloudConnected(connected);
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeAuth();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setAuthError(err.message || 'Google sign-in was interrupted. You can also use Guest sync.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInAnonymously(auth);
      setShowAuthModal(false);
    } catch (err: any) {
      console.error('Guest Sign In failed:', err);
      setAuthError(err.message || 'Could not start guest session.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
      setShowAuthModal(false);
    } catch (err: any) {
      console.error('Sign Out failed:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Android Top System Bar */}
      <div className="flex items-center justify-between px-4 py-1 text-xs text-slate-400 select-none border-b border-slate-900/50">
        <div className="font-semibold tracking-tight text-slate-300 font-mono">
          {time || '09:41'}
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="text-[10px] text-amber-400 font-medium">Offline</span>
          )}
          {/* Cloud Firestore Status Badge */}
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => setShowAuthModal(true)}
            title="Firebase Cloud Sync Status"
          >
            <Cloud className={`w-3 h-3 ${isCloudConnected ? 'text-cyan-400' : 'text-amber-400'}`} />
            <span className="text-[10px] font-mono text-slate-400 hidden xs:inline">
              {currentUser ? 'Cloud Synced' : 'Cloud Ready'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">5G</span>
          <Wifi className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-mono text-slate-300">100%</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main App Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-sm shadow-cyan-500/20">
            <span className="text-white font-black text-sm tracking-tighter">D</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                DAYMATE <span className="text-cyan-400">AI</span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5 font-medium truncate max-w-[170px] sm:max-w-xs">
              Agent: <span className="text-slate-200">{activeAgent}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Cloud Auth / Account Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border transition ${
              currentUser
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Firebase Cloud Account & Sync"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-4 h-4 rounded-full"
              />
            ) : (
              <UserIcon className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px] font-medium hidden sm:inline">
              {currentUser?.displayName ? currentUser.displayName.split(' ')[0] : currentUser?.isAnonymous ? 'Guest' : 'Cloud Sync'}
            </span>
          </button>

          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-800/80 rounded-md hover:bg-cyan-900/60 transition"
              title="Install DAYMATE on Android or Desktop"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* Voice Output Mute Toggle */}
          <button
            onClick={onToggleVoiceMute}
            className={`p-2 rounded-lg border transition ${
              isVoiceMuted
                ? 'bg-slate-900 text-slate-500 border-slate-800'
                : 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60'
            }`}
            title={isVoiceMuted ? 'Voice output is muted' : 'Voice output is active'}
            aria-label="Toggle voice output"
          >
            {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Mobile Frame Toggle (Desktop helper) */}
          <button
            onClick={onToggleMobileFrame}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              isMobileFrame
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Toggle between Android Phone frame and Wide Dashboard"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Full</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden lg:inline">Phone</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cloud & Account Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Firebase Cloud Storage & Auth</h3>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Firestore Cloud Status:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Online & Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                DAYMATE syncs your personal memory, task pipelines, motion critiques, and delivery packages to your provisioned Firebase Firestore database.
              </p>
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-[11px] text-rose-300">
                {authError}
              </div>
            )}

            {currentUser ? (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-9 h-9 rounded-full ring-2 ring-cyan-500/50"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {currentUser.displayName || (currentUser.isAnonymous ? 'Guest User' : 'Authenticated User')}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {currentUser.email || `UID: ${currentUser.uid.slice(0, 12)}...`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  {isSigningIn ? 'Connecting...' : 'Sign In with Google'}
                </button>

                <button
                  onClick={handleGuestSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Continue as Guest Sync
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
