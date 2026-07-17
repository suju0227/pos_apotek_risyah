import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ClipboardList,
  Package,
  ShoppingBag,
  Settings,
  Check,
  Copy,
  Loader2,
  EyeOff,
  CheckCheck,
} from 'lucide-react';
import { useDashboardNotifications, type AppNotification } from '../dashboard.hooks';
import { useToastStore } from '../../../shared/components/toast.store';

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'operational', label: 'Operasional' },
  { id: 'stock', label: 'Stok' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'system', label: 'Sistem' },
] as const;

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'operational' | 'stock' | 'purchase' | 'system'>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const toast = useToastStore();

  const { data: notifications = [], isLoading, isError } = useDashboardNotifications();

  // Local storage state for read and deleted notifications
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const val = localStorage.getItem('pos_read_notifications');
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  });

  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    try {
      const val = localStorage.getItem('pos_deleted_notifications');
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setReadIds((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem('pos_read_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletedIds((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem('pos_deleted_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const copyReference = (id: string, ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(ref);
    setCopiedId(id);
    toast.show(`Nomor referensi ${ref} berhasil disalin!`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter((n) => !deletedIds.includes(n.id) && !readIds.includes(n.id))
      .map((n) => n.id);
    
    if (unreadIds.length > 0) {
      setReadIds((prev) => {
        const updated = [...new Set([...prev, ...unreadIds])];
        localStorage.setItem('pos_read_notifications', JSON.stringify(updated));
        return updated;
      });
      toast.show('Semua notifikasi ditandai sebagai dibaca.');
    }
  };

  // Compute unread count for badge (visible i.e. not deleted, and not read)
  const unreadCount = useMemo(() => {
    return notifications.filter(
      (n) => !deletedIds.includes(n.id) && !readIds.includes(n.id)
    ).length;
  }, [notifications, deletedIds, readIds]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Exclude deleted
      if (deletedIds.includes(notif.id)) return false;

      // 2. Filter by category tab
      if (activeTab !== 'all' && notif.type !== activeTab) return false;

      // 3. Filter by read status
      if (showOnlyUnread && readIds.includes(notif.id)) return false;

      return true;
    });
  }, [notifications, activeTab, showOnlyUnread, readIds, deletedIds]);

  // Relative time helper
  function formatRelativeTime(dateStr: string) {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return 'Kemarin';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  // Get Priority styles
  function getPriorityStyles(priority: AppNotification['priority'], isRead: boolean) {
    if (isRead) {
      switch (priority) {
        case 'critical': return { border: 'border-l-4 border-l-rose-200', bg: 'bg-white hover:bg-slate-50/50' };
        case 'high': return { border: 'border-l-4 border-l-orange-200', bg: 'bg-white hover:bg-slate-50/50' };
        case 'medium': return { border: 'border-l-4 border-l-amber-200', bg: 'bg-white hover:bg-slate-50/50' };
        case 'info': return { border: 'border-l-4 border-l-blue-200', bg: 'bg-white hover:bg-slate-50/50' };
        case 'success': return { border: 'border-l-4 border-l-emerald-200', bg: 'bg-white hover:bg-slate-50/50' };
        default: return { border: 'border-l-4 border-l-slate-200', bg: 'bg-white hover:bg-slate-50/50' };
      }
    } else {
      switch (priority) {
        case 'critical': return { border: 'border-l-4 border-l-rose-500', bg: 'bg-rose-50/40 hover:bg-rose-50/70' };
        case 'high': return { border: 'border-l-4 border-l-orange-500', bg: 'bg-orange-50/40 hover:bg-orange-50/70' };
        case 'medium': return { border: 'border-l-4 border-l-amber-500', bg: 'bg-amber-50/40 hover:bg-amber-50/70' };
        case 'info': return { border: 'border-l-4 border-l-blue-500', bg: 'bg-blue-50/40 hover:bg-blue-50/70' };
        case 'success': return { border: 'border-l-4 border-l-emerald-500', bg: 'bg-emerald-50/40 hover:bg-emerald-50/70' };
        default: return { border: 'border-l-4 border-l-slate-500', bg: 'bg-slate-50/40 hover:bg-slate-50/70' };
      }
    }
  }

  // Get Priority Badge Icon colors
  function getPriorityIconColors(priority: AppNotification['priority']) {
    switch (priority) {
      case 'critical': return 'text-rose-600 bg-rose-100/80';
      case 'high': return 'text-orange-600 bg-orange-100/80';
      case 'medium': return 'text-amber-600 bg-amber-100/80';
      case 'info': return 'text-blue-600 bg-blue-100/80';
      case 'success': return 'text-emerald-600 bg-emerald-100/80';
      default: return 'text-slate-600 bg-slate-100/80';
    }
  }

  // Render category icon
  function renderCategoryIcon(type: AppNotification['type'], className = '') {
    switch (type) {
      case 'operational': return <ClipboardList className={className} />;
      case 'stock': return <Package className={className} />;
      case 'purchase': return <ShoppingBag className={className} />;
      case 'system': return <Settings className={className} />;
      default: return <Bell className={className} />;
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition rounded-lg hover:bg-slate-100 focus:outline-none ${
          isOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-label="Notifikasi Apotek"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-[420px] rounded-xl border border-slate-200 bg-white shadow-xl max-h-[600px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition active:scale-95 cursor-pointer"
              >
                <CheckCheck size={14} />
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-slate-100 px-2 bg-slate-50/20 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub-Filters / Status filters */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-white">
            <button
              onClick={() => setShowOnlyUnread(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                !showOnlyUnread
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setShowOnlyUnread(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                showOnlyUnread
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              Belum Dibaca
            </button>
          </div>

          {/* Notifications Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[420px] scrollbar-thin">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
                <span className="text-xs font-medium">Memuat notifikasi...</span>
              </div>
            ) : isError ? (
              <div className="p-6 text-center text-xs text-rose-500 font-medium">
                Gagal memuat notifikasi. Silakan coba beberapa saat lagi.
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-slate-400 stroke-[1.5]" />
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {showOnlyUnread ? 'Tidak ada notifikasi baru' : 'Tidak ada notifikasi'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                  Semua laporan, stok, dan aktivitas apotek terpantau dengan baik.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRead = readIds.includes(notif.id);
                const styles = getPriorityStyles(notif.priority, isRead);
                const iconColors = getPriorityIconColors(notif.priority);

                return (
                  <div
                    key={notif.id}
                    className={`relative flex flex-col transition duration-150 group ${styles.border} ${styles.bg}`}
                  >
                    <div className="flex items-start gap-3 p-3">
                      {/* Category Icon */}
                      <div className={`p-2 rounded-lg shrink-0 ${iconColors}`}>
                        {renderCategoryIcon(notif.type, 'h-4 w-4')}
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0 pr-12">
                        {notif.path ? (
                          <Link
                            to={notif.path}
                            onClick={() => setIsOpen(false)}
                            className="block hover:underline text-left"
                          >
                            <h4 className={`text-xs font-bold text-slate-900 leading-snug truncate`}>
                              {notif.title}
                            </h4>
                          </Link>
                        ) : (
                          <h4 className={`text-xs font-bold text-slate-900 leading-snug truncate text-left`}>
                            {notif.title}
                          </h4>
                        )}
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed break-words text-left">
                          {notif.message}
                        </p>
                        
                        {/* Meta and Reference */}
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-semibold">
                          <span>{formatRelativeTime(notif.createdAt)}</span>
                          {notif.referenceNumber && (
                            <>
                              <span>•</span>
                              <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[9px]">
                                {notif.referenceNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions Hover/Absolute overlay */}
                    <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-inherit pl-2">
                      {notif.referenceNumber && (
                        <button
                          onClick={(e) => copyReference(notif.id, notif.referenceNumber!, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
                          title="Salin No Referensi"
                        >
                          {copiedId === notif.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600 animate-in zoom-in-50" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      {!isRead && (
                        <button
                          onClick={(e) => markAsRead(notif.id, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-200/50 transition cursor-pointer"
                          title="Tandai Dibaca"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(notif.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-200/50 transition cursor-pointer"
                        title="Sembunyikan"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
