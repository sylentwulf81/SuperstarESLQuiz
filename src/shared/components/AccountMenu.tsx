import React, { useState, useRef, useEffect } from 'react';
import { User, LogIn, LogOut, Cloud, CloudCheck, RefreshCw, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { useAuth } from '@/shared/context/AuthContext';
import { sounds } from '@/shared/utils/sound';

interface AccountMenuProps {
  onManualSync?: () => void;
  onManualLoad?: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({ onManualSync, onManualLoad }) => {
  const { user, isLoggedIn, syncStatus, lastSyncedAt, loginWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignIn = async () => {
    sounds.playClick();
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
      setIsOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    sounds.playClick();
    await logout();
    setIsOpen(false);
  };

  // Compute initials for AvatarFallback
  const getInitials = () => {
    if (!user?.displayName && !user?.email) return 'MP';
    const name = user.displayName || user.email || '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      {isLoggedIn && user ? (
        /* Logged In: ShadCN Avatar nested at top-right */
        <button
          id="account-avatar-btn"
          onClick={() => {
            sounds.playClick();
            setIsOpen(!isOpen);
          }}
          className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400/80 cursor-pointer group transition-transform active:scale-95 shrink-0"
          title={`${user.displayName || user.email || 'Host'} - Account & Cloud Sync`}
        >
          <Avatar className="w-8 h-8 sm:w-9 sm:h-9 border border-amber-400/60 group-hover:border-amber-300 shadow-md">
            {user.photoURL && (
              <AvatarImage
                src={user.photoURL}
                alt={user.displayName || 'User avatar'}
                referrerPolicy="no-referrer"
              />
            )}
            <AvatarFallback className="bg-gradient-to-br from-indigo-700 to-slate-900 text-amber-300 font-mario text-xs sm:text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          {/* Cloud Sync Status indicator badge */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
              syncStatus === 'syncing'
                ? 'bg-amber-400 animate-pulse'
                : syncStatus === 'error'
                ? 'bg-rose-500'
                : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
            }`}
            title={`Cloud Sync: ${syncStatus}`}
          />
        </button>
      ) : (
        /* Logged Out / Optional Login Button */
        <button
          id="login-btn"
          onClick={() => {
            sounds.playClick();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white border border-white/20 text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          title="Sign in optionally for cloud question backup"
        >
          <LogIn className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">Sign In</span>
        </button>
      )}

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          id="account-dropdown-panel"
          className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-slate-900 border border-white/20 rounded-2xl shadow-2xl z-50 p-4 text-white animate-in fade-in zoom-in-95 duration-150"
        >
          {isLoggedIn && user ? (
            /* Logged In View */
            <div className="space-y-3.5">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <Avatar className="w-11 h-11 border border-amber-400/80 shadow-md">
                  {user.photoURL && (
                    <AvatarImage
                      src={user.photoURL}
                      alt={user.displayName || 'User avatar'}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-indigo-700 to-slate-900 text-amber-300 font-mario text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {user.displayName || 'Mario Party Host'}
                  </p>
                  <p className="text-xs text-indigo-300 truncate">
                    {user.email || 'Connected Account'}
                  </p>
                </div>
              </div>

              {/* Cloud Sync Status Box */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span>Firestore Cloud Sync</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight">
                  Your customized question decks and settings sync automatically to your Firestore database.
                </p>
                {lastSyncedAt && (
                  <p className="text-[10px] text-indigo-300">
                    Last synced at {lastSyncedAt}
                  </p>
                )}
              </div>

              {/* Cloud Actions */}
              <div className="space-y-1.5 pt-1">
                {onManualSync && (
                  <button
                    onClick={() => {
                      sounds.playSaveCloud();
                      onManualSync();
                    }}
                    disabled={syncStatus === 'syncing'}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs rounded-xl shadow border border-yellow-200 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Save Current Deck to Cloud'}</span>
                  </button>
                )}

                {onManualLoad && (
                  <button
                    onClick={() => {
                      sounds.playCloudSync();
                      onManualLoad();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-750 active:scale-98 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-white/15 transition-all cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Load Saved Deck from Cloud</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/80 hover:bg-red-950/60 text-slate-300 hover:text-red-300 font-semibold text-xs rounded-xl border border-white/15 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out to Guest</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out / Guest View */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h4 className="font-mario text-base text-yellow-300">
                  Cloud Question Backup
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Signing in is <span className="font-bold text-amber-200">completely optional</span>. Guests can play offline using local browser storage.
              </p>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-white/10 text-[11px] text-indigo-200 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sync all 60 custom questions across any classroom device</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Keep summer & holiday decks saved in Firestore</span>
                </div>
              </div>

              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm rounded-xl shadow-lg border border-slate-200 transition-all cursor-pointer active:scale-95"
              >
                {/* Google G Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Signing In...' : 'Sign In with Google'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
