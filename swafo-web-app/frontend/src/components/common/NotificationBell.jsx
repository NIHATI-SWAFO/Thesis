import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Clock } from 'lucide-react';

const mockNotifications = [
  { id: 1, title: 'Campus Patrol Schedule', message: 'Monthly patrol assignments updated for current period.', timestamp: '2 mins ago', read: false },
  { id: 2, title: 'Patrol Started', message: 'Designated patrol started in East Campus Zone.', timestamp: '1 hour ago', read: false },
  { id: 3, title: 'Violation logged', message: 'New uniform violation logged in ICTC.', timestamp: '3 hours ago', read: false },
  { id: 4, title: 'System update', message: 'SWAFO portal updated successfully.', timestamp: '1 day ago', read: true }
];

export default function NotificationBell({ isDarkBg = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors flex items-center justify-center ${isDarkBg ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
      >
        <Bell size={22} strokeWidth={2.5} />
        
        {/* Red Unread Badge */}
        {unreadCount > 0 && (
          <span className={`absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 border-2 ${isDarkBg ? 'border-[#003624]' : 'border-white'} text-[9px] font-bold text-white shadow-sm pointer-events-none`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 font-sans">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-[14px] font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications yet.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <button 
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) markAsRead(notif.id);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                      notif.read ? 'bg-white hover:bg-gray-50' : 'bg-[#f0f7ff] hover:bg-[#e0f0ff]'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${notif.read ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                      {notif.title.toLowerCase().includes('error') ? (
                        <AlertTriangle size={14} className={notif.read ? 'text-gray-400' : 'text-red-500'} />
                      ) : (
                        <Bell size={14} />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[13px] font-bold truncate ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notif.title}
                        </span>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>}
                      </div>
                      <span className={`text-[12px] leading-tight ${notif.read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notif.message}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 mt-1">
                        <Clock size={10} /> {notif.timestamp}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
