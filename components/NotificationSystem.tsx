import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Terminal, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  RefreshCw, 
  Play, 
  Sparkles, 
  X,
  FileWarning,
  Keyboard,
  ClipboardList
} from 'lucide-react';
import { Theme } from '../theme';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'default';
  duration?: number;
  icon?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  status: 'running' | 'active' | 'success' | 'failed' | 'warning' | 'alert' | 'info';
  timestamp: number;
}

// Global helper functions so any component can trigger notifications
export const triggerToast = (message: string, type: ToastItem['type'] = 'default', duration = 3000) => {
  window.dispatchEvent(new CustomEvent('qlipto_toast', { 
    detail: { message, type, duration } 
  }));
};

export const triggerSysNotification = (
  title: string, 
  description: string, 
  status: SystemNotification['status'] = 'info',
  id?: string
) => {
  window.dispatchEvent(new CustomEvent('qlipto_sys_notification', { 
    detail: { title, description, status, id: id || `sys-${Date.now()}` } 
  }));
};

interface NotificationSystemProps {
  theme: Theme;
  isDashboardOpen?: boolean;
  onCloseDashboard?: () => void;
  notesFromClipboardEnabled?: boolean;
  keyboardCompanionOpen?: boolean;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  theme,
  isDashboardOpen = false,
  onCloseDashboard,
  notesFromClipboardEnabled = false,
  keyboardCompanionOpen = false
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'init-clipboard',
      title: 'Clipboard listener running.',
      description: 'Qklipto background clipboard daemon is monitoring system buffers.',
      status: 'running',
      timestamp: Date.now() - 60000
    },
    {
      id: 'init-keyboard',
      title: 'Keyboard Companion overlay active.',
      description: 'Companion injection keyboard overlay is registered and listening for focus hotkeys.',
      status: 'active',
      timestamp: Date.now() - 30000
    }
  ]);
  const [isPanelOpen, setIsPanelOpen] = useState(isDashboardOpen);
  const [audioFeedback, setAudioFeedback] = useState(true);

  // Sync isPanelOpen prop with local state
  useEffect(() => {
    setIsPanelOpen(isDashboardOpen);
  }, [isDashboardOpen]);

  // Handle Event Listeners for Toast & Notification triggers
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastItem['type']; duration?: number }>;
      const { message, type, duration } = customEvent.detail;
      
      const newToast: ToastItem = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        message,
        type,
        duration: duration || 3000
      };

      setToasts(prev => [newToast, ...prev]);

      // Sound feedback
      if (audioFeedback) {
        playTickSound(type);
      }

      // Auto dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, newToast.duration);
    };

    const handleSysNotificationEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; description: string; status: SystemNotification['status']; id: string }>;
      const { title, description, status, id } = customEvent.detail;

      const newNotification: SystemNotification = {
        id,
        title,
        description,
        status,
        timestamp: Date.now()
      };

      setNotifications(prev => {
        // Avoid adding duplicate identical ID notifications, update existing or insert new
        const exists = prev.some(n => n.id === id);
        if (exists) {
          return prev.map(n => n.id === id ? newNotification : n);
        }
        return [newNotification, ...prev];
      });

      // Sound feedback
      if (audioFeedback) {
        playNotificationSound(status);
      }

      // Automatically trigger HTML5 standard notification if permission is granted
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, { body: description });
        } catch (err) {
          console.warn('Standard desktop notification failed to render:', err);
        }
      }
    };

    window.addEventListener('qlipto_toast', handleToastEvent);
    window.addEventListener('qlipto_sys_notification', handleSysNotificationEvent);

    return () => {
      window.removeEventListener('qlipto_toast', handleToastEvent);
      window.removeEventListener('qlipto_sys_notification', handleSysNotificationEvent);
    };
  }, [audioFeedback]);

  // Monitor Clipboard settings and update active daemon status
  useEffect(() => {
    if (notesFromClipboardEnabled) {
      triggerSysNotification(
        'Clipboard listener running.',
        'Continuous background polling service is actively monitoring browser clipboard changes.',
        'running',
        'daemon-clipboard'
      );
    } else {
      // Set to inactive or remove from list
      setNotifications(prev => prev.map(n => 
        n.id === 'daemon-clipboard' || n.id === 'init-clipboard' 
          ? { ...n, status: 'info', description: 'Clipboard monitoring is currently turned off.' } 
          : n
      ));
    }
  }, [notesFromClipboardEnabled]);

  // Monitor Keyboard companion overlay status
  useEffect(() => {
    if (keyboardCompanionOpen) {
      triggerSysNotification(
        'Keyboard Companion overlay active.',
        'Virtual snippets injection panel is expanded and responsive.',
        'active',
        'daemon-keyboard'
      );
    } else {
      setNotifications(prev => prev.map(n => 
        n.id === 'daemon-keyboard' || n.id === 'init-keyboard' 
          ? { ...n, status: 'info', description: 'Keyboard companion window is currently closed.' } 
          : n
      ));
    }
  }, [keyboardCompanionOpen]);

  // Synthesize sound effects using Web Audio API
  const playTickSound = (type: ToastItem['type']) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      let freq = 600;
      let duration = 0.05;
      
      if (type === 'error') {
        freq = 150;
        duration = 0.25;
        osc.type = 'sawtooth';
      } else if (type === 'warning') {
        freq = 300;
        duration = 0.15;
        osc.type = 'triangle';
      } else {
        osc.type = 'sine';
      }

      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  const playNotificationSound = (status: SystemNotification['status']) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc1.type = 'triangle';
      osc2.type = 'sine';
      
      const t = audioCtx.currentTime;
      
      if (status === 'failed' || status === 'alert') {
        osc1.frequency.setValueAtTime(320, t);
        osc1.frequency.setValueAtTime(220, t + 0.12);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc1.connect(gain);
        gain.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(t + 0.35);
      } else {
        osc1.frequency.setValueAtTime(440, t);
        osc2.frequency.setValueAtTime(554.37, t + 0.08); // major chord feel
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(t + 0.25);
        osc2.stop(t + 0.25);
      }
    } catch (e) {}
  };

  // Browser Permission Request Flow
  const requestBrowserNotificationPermission = async () => {
    if (!('Notification' in window)) {
      triggerToast('Notifications not supported by this browser.', 'error');
      return;
    }

    triggerSysNotification(
      'Permission required.',
      'Desktop notification credentials are required to dispatch background task statuses directly to your OS.',
      'warning',
      'sys-perm'
    );

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        triggerToast('Desktop Notifications Enabled! ✅', 'success');
        triggerSysNotification(
          'Desktop Permission Authorized',
          'OS notification pipeline established successfully. System services will now project natively.',
          'success',
          'sys-perm'
        );
      } else {
        triggerToast('Notification Permission Denied 🚫', 'error');
        triggerSysNotification(
          'Permission required.',
          'OS notification credentials were denied. Standard in-app system overlay is fallback active.',
          'alert',
          'sys-perm'
        );
      }
    } catch (err) {
      triggerToast('Failed to request notification permission.', 'error');
    }
  };

  // Pre-configured manual triggers to perfectly demonstrate required notifications
  const runTestTrigger = (key: string) => {
    switch(key) {
      // Toasts
      case 'toast_copied':
        triggerToast('Copied to clipboard ✅', 'success');
        break;
      case 'toast_autosave':
        triggerToast('Note saved automatically ✅', 'success');
        break;
      case 'toast_delete':
        triggerToast('Tap again to delete ⚠️', 'warning');
        break;
      case 'toast_limit':
        triggerToast('File exceeds 300 MB limit 🚫', 'error');
        break;
      case 'toast_listener_active':
        triggerToast('Clipboard listener is active 📋', 'info');
        break;

      // System Notifications
      case 'sys_clipboard':
        triggerSysNotification(
          'Clipboard listener running.',
          'Continuous background polling service is actively monitoring browser clipboard changes.',
          'running',
          'daemon-clipboard'
        );
        break;
      case 'sys_keyboard':
        triggerSysNotification(
          'Keyboard Companion overlay active.',
          'Virtual snippets injection panel is expanded and responsive.',
          'active',
          'daemon-keyboard'
        );
        break;
      case 'sys_sync':
        triggerSysNotification(
          'Sync in progress.',
          'Synchronizing offline cache database changes with local daemon endpoint.',
          'running',
          'sys-sync'
        );
        // Automatically mark sync finished after 3 seconds
        setTimeout(() => {
          triggerSysNotification(
            'Sync completed successfully',
            'All database transactions are synchronized with local endpoint server.',
            'success',
            'sys-sync'
          );
        }, 3000);
        break;
      case 'sys_backup':
        triggerSysNotification(
          'Backup complete.',
          'Database backup archive JSON file successfully constructed and downloaded.',
          'success',
          'sys-backup'
        );
        break;
      case 'sys_import_failed':
        triggerSysNotification(
          'Import failed.',
          'Backup restore halted. Chosen file contains corrupted schema formatting.',
          'failed',
          'sys-import'
        );
        break;
      case 'sys_file_large':
        triggerSysNotification(
          'File too large.',
          'Upload denied. Clipboard files and image attachments must be under the 300 MB threshold.',
          'warning',
          'sys-large-file'
        );
        break;
      case 'sys_permission':
        requestBrowserNotificationPermission();
        break;
      default:
        break;
    }
  };

  return (
    <>
      {/* ================= TOAST OVERLAY LAYER ================= */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isWarning = toast.type === 'warning';
            const isError = toast.type === 'error';
            const isInfo = toast.type === 'info';

            let accentBg = 'bg-slate-900/95 border-slate-800 text-slate-100';
            if (isSuccess) accentBg = 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100';
            if (isWarning) accentBg = 'bg-amber-950/90 border-amber-500/30 text-amber-100';
            if (isError) accentBg = 'bg-red-950/90 border-red-500/30 text-red-100';
            if (isInfo) accentBg = 'bg-blue-950/90 border-blue-500/30 text-blue-100';

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-2xl backdrop-blur-md ${accentBg} w-full`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base select-none">
                    {isSuccess && '✅'}
                    {isWarning && '⚠️'}
                    {isError && '🚫'}
                    {isInfo && '📋'}
                    {!isSuccess && !isWarning && !isError && !isInfo && '🔔'}
                  </span>
                  <p className="text-xs font-bold leading-tight font-sans">
                    {toast.message}
                  </p>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ================= PANEL TOGGLE BUTTON (IN-APP BELL INDICATOR) ================= */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="fixed bottom-24 left-6 w-14 h-14 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/60 text-amber-500 flex items-center justify-center shadow-2xl z-40 transition-transform active:scale-90 duration-150 group"
        title="Open Notification Status Hub"
      >
        <div className="relative">
          <Bell className="w-6 h-6 animate-swing group-hover:rotate-12 transition-transform" />
          {notifications.some(n => n.status === 'running' || n.status === 'active') && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          )}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
      </button>

      {/* ================= SYSTEM STATUS CENTER DRAWER ================= */}
      <AnimatePresence>
        {isPanelOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop click close */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsPanelOpen(false);
                if (onCloseDashboard) onCloseDashboard();
              }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className={`relative w-full max-w-md ${theme.modalBg} border-l ${theme.border} h-full flex flex-col shadow-2xl`}
            >
              {/* HEADER */}
              <div className="p-5 border-b border-slate-800/60 bg-slate-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Terminal className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-100">
                      System Daemons & Logs
                    </h2>
                    <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-tight">
                      Runtime Service Notifications
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAudioFeedback(!audioFeedback)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
                    title={audioFeedback ? "Disable alert sounds" : "Enable alert sounds"}
                  >
                    {audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsPanelOpen(false);
                      if (onCloseDashboard) onCloseDashboard();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* SERVICE DAEMONS GRID (ACTIVE SERVICES TRAY) */}
              <div className="px-5 py-4 border-b border-slate-800/40 bg-slate-900/10 space-y-3 flex-shrink-0">
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Active Daemons (Background Services)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 flex flex-col justify-between h-20`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm select-none">📋</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${notesFromClipboardEnabled ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500' : 'bg-slate-600'}`} />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tight">
                          {notesFromClipboardEnabled ? 'ACTIVE' : 'IDLE'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-200 leading-tight">Clipboard Listener</p>
                      <p className="text-[8px] text-slate-500 font-semibold mt-0.5 leading-none">Capture background buffers</p>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 flex flex-col justify-between h-20`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm select-none">⌨️</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${keyboardCompanionOpen ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500' : 'bg-slate-600'}`} />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tight">
                          {keyboardCompanionOpen ? 'ACTIVE' : 'IDLE'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-200 leading-tight">Keyboard Companion</p>
                      <p className="text-[8px] text-slate-500 font-semibold mt-0.5 leading-none">Overlays & input injection</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CORE SCROLLABLE LOG */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* 1. REQUIRED NOTIFICATIONS & TOAST PLAYGROUND (SUPER ACCESSIBLE & EXTREMELY USEFUL!) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Interactive Tester & Sandbox
                    </h3>
                    <span className="text-[8px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase">
                      One-Click Demonstrations
                    </span>
                  </div>

                  {/* Toast test panel */}
                  <div className="border border-slate-800/60 bg-slate-900/5 px-4 py-3 rounded-xl space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Test Runtime Toasts:</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => runTestTrigger('toast_copied')}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9px] font-black flex items-center gap-1 uppercase tracking-tight transition-all"
                      >
                        <span>Copied ✅</span>
                      </button>
                      <button
                        onClick={() => runTestTrigger('toast_autosave')}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9px] font-black flex items-center gap-1 uppercase tracking-tight transition-all"
                      >
                        <span>Saved ✅</span>
                      </button>
                      <button
                        onClick={() => runTestTrigger('toast_delete')}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9px] font-black flex items-center gap-1 uppercase tracking-tight transition-all"
                      >
                        <span>Delete ⚠️</span>
                      </button>
                      <button
                        onClick={() => runTestTrigger('toast_limit')}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9px] font-black flex items-center gap-1 uppercase tracking-tight transition-all"
                      >
                        <span>Size Limit 🚫</span>
                      </button>
                      <button
                        onClick={() => runTestTrigger('toast_listener_active')}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9px] font-black flex items-center gap-1 uppercase tracking-tight transition-all"
                      >
                        <span>Listener Active 📋</span>
                      </button>
                    </div>
                  </div>

                  {/* System background notifications test panel */}
                  <div className="border border-slate-800/60 bg-slate-900/5 px-4 py-3 rounded-xl space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Test Daemon Alerts:</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => runTestTrigger('sys_clipboard')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9.5px] font-bold text-left flex items-center gap-1.5 transition-all"
                      >
                        <ClipboardList className="w-3 h-3 text-emerald-500" />
                        <span className="truncate">Clipboard Daemon</span>
                      </button>
                      <button
                        onClick={() => runTestTrigger('sys_keyboard')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9.5px] font-bold text-left flex items-center gap-1.5 transition-all"
                      >
                        <Keyboard className="w-3 h-3 text-sky-400" />
                        <span className="truncate">Companion Daemon</span>
                      </button>
                      <button
                        onClick={() => runTestTrigger('sys_sync')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9.5px] font-bold text-left flex items-center gap-1.5 transition-all animate-pulse"
                      >
                        <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                        <span className="truncate">Sync in progress</span>
                      </button>
                      <button
                        onClick={() => runTestTrigger('sys_backup')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9.5px] font-bold text-left flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="truncate">Backup complete</span>
                      </button>
                      <button
                        onClick={() => runTestTrigger('sys_import_failed')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9.5px] font-bold text-left flex items-center gap-1.5 transition-all"
                      >
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="truncate">Import failed</span>
                      </button>
                      <button
                        onClick={() => runTestTrigger('sys_file_large')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[9.5px] font-bold text-left flex items-center gap-1.5 transition-all"
                      >
                        <FileWarning className="w-3 h-3 text-yellow-500" />
                        <span className="truncate">File too large</span>
                      </button>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => runTestTrigger('sys_permission')}
                        className="w-full px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Request Native Desktop Permission</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. RECENT LOG EVENTS LIST */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Recent System Notifications ({notifications.length})
                    </h3>
                    <button
                      onClick={() => setNotifications([])}
                      className="text-[9px] font-extrabold uppercase tracking-tight text-red-500 hover:text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/15"
                    >
                      Clear Log
                    </button>
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {notifications.length === 0 ? (
                        <div className="text-center py-10 rounded-xl border border-dashed border-slate-800/80">
                          <Info className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">System Log Empty</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed px-4">
                            No background operations logged yet. Click some sandbox controls above to test!
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const isError = notif.status === 'failed' || notif.status === 'alert';
                          const isWarning = notif.status === 'warning';
                          const isSuccess = notif.status === 'success';
                          const isRunning = notif.status === 'running' || notif.status === 'active';

                          let badgeColor = 'bg-slate-800/50 text-slate-400';
                          if (isError) badgeColor = 'bg-red-500/10 text-red-500 border border-red-500/20';
                          if (isWarning) badgeColor = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                          if (isSuccess) badgeColor = 'bg-green-500/10 text-green-500 border border-green-500/20';
                          if (isRunning) badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

                          return (
                            <motion.div
                              key={notif.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 flex items-start gap-3`}
                            >
                              <div className="mt-0.5 select-none text-base shrink-0">
                                {isSuccess && '🟢'}
                                {isRunning && '⚡'}
                                {isWarning && '⚠️'}
                                {isError && '🔴'}
                                {!isSuccess && !isRunning && !isWarning && !isError && '🔵'}
                              </div>

                              <div className="flex-1 min-w-0 text-left space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-xs font-bold leading-tight text-slate-200">
                                    {notif.title}
                                  </h4>
                                  <span className="text-[8px] font-mono text-slate-500 shrink-0 mt-0.5">
                                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-normal font-medium">
                                  {notif.description}
                                </p>
                                <div className="pt-1 flex items-center justify-between">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${badgeColor}`}>
                                    {notif.status}
                                  </span>
                                  <button
                                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                                    className="text-[9px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>

              {/* FOOTER */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-shrink-0 select-none">
                <span className="text-[8.5px] font-extrabold uppercase text-slate-500 tracking-wider">
                  Qklipto notification engine • v1.1.0
                </span>
                <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>ONLINE</span>
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
