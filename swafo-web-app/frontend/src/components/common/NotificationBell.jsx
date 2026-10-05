import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, CheckCheck, Radio, FileText, ChevronRight, X, Shield, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../api/config';

// Role-specific fallback notifications in case server is starting or offline
const getRoleFallbacks = (role) => {
  const normalized = (role || 'student').toLowerCase();
  
  if (normalized === 'student') {
    return [
      { 
        id: 'fb-stud-1', 
        title: 'Disciplinary Clearance: Good Standing', 
        message: 'No active disciplinary infractions or holds on your institutional account.', 
        category: 'system', 
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(), 
        priority: 'low', 
        link: '/student/profile' 
      },
      { 
        id: 'fb-stud-2', 
        title: 'Campus Handbook 2025–2026', 
        message: 'University student regulations, dress code policies, and sanction matrix in effect.', 
        category: 'system', 
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(), 
        priority: 'low', 
        link: '/student/handbook' 
      },
      { 
        id: 'fb-stud-3', 
        title: 'SWAFO Connect Desk', 
        message: 'Student welfare grievance and inquiry desk accessible 24/7.', 
        category: 'connect', 
        timestamp: new Date(Date.now() - 180 * 60000).toISOString(), 
        priority: 'low', 
        link: '/student/freedom-wall' 
      }
    ];
  }

  if (normalized === 'admin') {
    return [
      { 
        id: 'fb-adm-1', 
        title: 'Director Case Oversight', 
        message: 'Disciplinary case audit registry active and synchronized.', 
        category: 'violation', 
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(), 
        priority: 'high', 
        link: '/admin/cases' 
      },
      { 
        id: 'fb-adm-2', 
        title: 'SWAFO Connect Submissions', 
        message: 'Community submissions and reports awaiting administrative review.', 
        category: 'connect', 
        timestamp: new Date(Date.now() - 40 * 60000).toISOString(), 
        priority: 'medium', 
        link: '/admin/freedom-wall' 
      },
      { 
        id: 'fb-adm-3', 
        title: 'Campus Patrol Monitoring', 
        message: 'Officer patrol telemetry and coverage logs active.', 
        category: 'patrol', 
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(), 
        priority: 'low', 
        link: '/admin/patrols' 
      }
    ];
  }

  // Officer Fallback
  return [
    { 
      id: 'fb-off-1', 
      title: 'Campus Patrol Schedule', 
      message: 'Monthly patrol assignments updated for current period.', 
      category: 'patrol', 
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(), 
      priority: 'high', 
      link: '/officer/patrols' 
    },
    { 
      id: 'fb-off-2', 
      title: 'Patrol Started', 
      message: 'Designated patrol started in East Campus Zone.', 
      category: 'patrol', 
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(), 
      priority: 'medium', 
      link: '/officer/patrols' 
    },
    { 
      id: 'fb-off-3', 
      title: 'Violation Logged', 
      message: 'New uniform violation logged in ICTC.', 
      category: 'violation', 
      timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), 
      priority: 'high', 
      link: '/officer/cases' 
    }
  ];
};

export default function NotificationBell({ isDarkBg = false, role: explicitRole }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Deduce role strictly
  const currentRole = useMemo(() => {
    if (explicitRole) return explicitRole.toLowerCase();
    if (user?.role) return user.role.toLowerCase();
    if (location.pathname.startsWith('/student')) return 'student';
    if (location.pathname.startsWith('/officer')) return 'officer';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'student';
  }, [explicitRole, user?.role, location.pathname]);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => getRoleFallbacks(currentRole));
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'category1' | 'category2'
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`swafo_read_notifications_${currentRole}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dropdownRef = useRef(null);

  // Helper for relative time formatting
  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  // Fetch real-time notifications scoped by role and user email
  const fetchNotifications = async () => {
    try {
      const url = API_ENDPOINTS.NOTIFICATIONS(user?.email || '', currentRole);
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        let items = data.results;

        // Strict Client-Side Filter: Guarantee students NEVER receive officer or admin internal tasks
        if (currentRole === 'student') {
          items = items.filter(n => 
            n.category !== 'patrol' && 
            !(n.link && (n.link.startsWith('/officer') || n.link.startsWith('/admin')))
          );
        } else if (currentRole === 'officer') {
          items = items.filter(n => !(n.link && n.link.startsWith('/student')));
        } else if (currentRole === 'admin') {
          items = items.filter(n => !(n.link && n.link.startsWith('/student')));
        }

        setNotifications(items.length > 0 ? items : getRoleFallbacks(currentRole));
      }
    } catch (err) {
      console.warn("Real-time notifications polling silent fallback:", err);
    }
  };

  // Initial fetch and 20-second real-time poll
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [user, currentRole]);

  // Persist read IDs in local storage per role
  const persistReadIds = (newSet) => {
    setReadIds(newSet);
    try {
      localStorage.setItem(`swafo_read_notifications_${currentRole}`, JSON.stringify(Array.from(newSet)));
    } catch (e) {
      console.error("Failed to save read notifications:", e);
    }
  };

  // Mark single item read
  const markAsRead = (id) => {
    const next = new Set(readIds);
    next.add(id);
    persistReadIds(next);
  };

  // Mark all currently loaded items as read
  const markAllAsRead = () => {
    const next = new Set(readIds);
    notifications.forEach(n => next.add(n.id));
    persistReadIds(next);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const isRead = readIds.has(n.id);
      if (filter === 'unread') return !isRead;
      if (filter === 'patrol') return n.category === 'patrol';
      if (filter === 'violation') return n.category === 'violation';
      if (filter === 'connect') return n.category === 'connect';
      return true;
    });
  }, [notifications, readIds, filter]);

  const getCategoryIcon = (category, priority) => {
    switch (category) {
      case 'patrol':
        return <Radio size={14} className="text-emerald-600" />;
      case 'violation':
        return priority === 'high' 
          ? <AlertTriangle size={14} className="text-rose-500" />
          : <FileText size={14} className="text-amber-600" />;
      case 'connect':
        return <MessageSquare size={14} className="text-blue-600" />;
      default:
        return <Shield size={14} className="text-emerald-700" />;
    }
  };

  const getCategoryBg = (category) => {
    switch (category) {
      case 'patrol': return 'bg-emerald-50 border-emerald-100';
      case 'violation': return 'bg-rose-50 border-rose-100';
      case 'connect': return 'bg-blue-50 border-blue-100';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0, arrowLeft: 0, width: 310 });

  // Dynamically position the dropdown directly under the bell trigger
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const updatePosition = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const panelWidth = Math.min(320, window.innerWidth - 20);
      const bellCenterX = rect.left + rect.width / 2;

      // Default: anchor dropdown towards the right under the bell
      let desiredLeft = bellCenterX - (panelWidth - 28);

      // Clamp within screen boundaries
      const padding = 10;
      if (desiredLeft < padding) {
        desiredLeft = padding;
      }
      if (desiredLeft + panelWidth > window.innerWidth - padding) {
        desiredLeft = window.innerWidth - panelWidth - padding;
      }

      // Pointer arrow aligned to bell center
      const arrowLeft = Math.max(14, Math.min(panelWidth - 14, bellCenterX - desiredLeft));

      setPanelPosition({
        top: rect.bottom + 6,
        left: desiredLeft,
        width: panelWidth,
        arrowLeft: arrowLeft,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* ── Bell Trigger Button ── */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
        className={`relative p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 ${
          isDarkBg 
            ? 'text-white/80 hover:text-white hover:bg-white/10' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        } ${isOpen ? (isDarkBg ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-900') : ''}`}
      >
        <Bell size={20} className={unreadCount > 0 ? 'animate-wiggle' : ''} />
        
        {/* Unread Indicator Pill */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 border-2 border-[#003624] text-[9px] font-black text-white shadow-md pointer-events-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Transparent Click-Outside Overlay ── */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[9990] bg-transparent"
        />
      )}

      {/* ── Connected Compact Dropdown Panel ── */}
      {isOpen && (
        <div 
          style={{
            top: `${panelPosition.top}px`,
            left: `${panelPosition.left}px`,
            width: `${panelPosition.width}px`,
          }}
          className="fixed bg-white rounded-xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.22)] border border-gray-200/90 z-[9999] animate-in fade-in zoom-in-95 duration-150 font-sans"
        >
          {/* Upward Connecting Arrow Notch */}
          <div 
            className="absolute -top-[5px] w-2.5 h-2.5 bg-slate-50 border-t border-l border-gray-200 rotate-45 z-20 pointer-events-none"
            style={{ left: `${panelPosition.arrowLeft - 5}px` }}
          />

          {/* Compact Header */}
          <div className="px-3 py-2 border-b border-gray-100 bg-slate-50/90 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-pjs font-extrabold text-[12.5px] text-gray-900">
                {currentRole === 'student' ? 'Student Alerts' : (currentRole === 'admin' ? 'Director Alerts' : 'Officer Station')}
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 px-1.5 py-0.5 rounded hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck size={12} />
                  <span>Mark read</span>
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Role-tailored Filter Tabs */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-gray-100 bg-white text-[10px] font-bold overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                filter === 'all' ? 'bg-[#003624] text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                filter === 'unread' ? 'bg-[#003624] text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>

            {/* Role-specific category tabs */}
            {currentRole === 'student' ? (
              <>
                <button
                  onClick={() => setFilter('violation')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                    filter === 'violation' ? 'bg-[#003624] text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Cases
                </button>
                <button
                  onClick={() => setFilter('connect')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                    filter === 'connect' ? 'bg-[#003624] text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Connect
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setFilter('patrol')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                    filter === 'patrol' ? 'bg-[#003624] text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Patrols
                </button>
                <button
                  onClick={() => setFilter('violation')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                    filter === 'violation' ? 'bg-[#003624] text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Violations
                </button>
              </>
            )}
          </div>

          {/* Compact Scrollable Items List */}
          <div className="max-h-[260px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
            {filteredNotifications.length === 0 ? (
              <div className="py-6 px-3 text-center">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-1.5">
                  <Bell size={16} />
                </div>
                <p className="font-pjs font-bold text-[11px] text-gray-500">No {filter !== 'all' ? filter : ''} notifications</p>
                <p className="text-[10px] text-gray-400 mt-0.5">All alerts are up-to-date</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRead = readIds.has(notif.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.link) {
                        setIsOpen(false);
                        navigate(notif.link);
                      }
                    }}
                    className={`flex items-start gap-2.5 p-2.5 transition-all text-left cursor-pointer group ${
                      isRead ? 'bg-white hover:bg-slate-50/80' : 'bg-emerald-50/25 hover:bg-emerald-50/50'
                    }`}
                  >
                    {/* Category Icon Badge */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${getCategoryBg(notif.category)} shadow-xs group-hover:scale-105 transition-transform`}>
                      {getCategoryIcon(notif.category, notif.priority)}
                    </div>

                    {/* Notification Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-[11.5px] font-pjs font-bold truncate ${isRead ? 'text-gray-700' : 'text-gray-900 font-extrabold'}`}>
                          {notif.title}
                        </span>
                        {!isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                        )}
                      </div>

                      <p className={`text-[10.5px] leading-snug line-clamp-2 ${isRead ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <span className="flex items-center gap-1 text-[9px] font-semibold text-gray-400">
                          <Clock size={9} />
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                        {notif.link && (
                          <span className="text-[9.5px] font-bold text-emerald-700 inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            View <ChevronRight size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Compact Footer */}
          <div className="px-3 py-1.5 bg-slate-50/90 border-t border-gray-100 rounded-b-xl flex items-center justify-between text-[10px]">
            <span className="text-gray-400 font-medium">Auto-updated</span>
            <button
              onClick={() => {
                fetchNotifications();
              }}
              className="text-[#003624] font-bold hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
