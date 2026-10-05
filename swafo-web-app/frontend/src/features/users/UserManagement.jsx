import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  X, 
  Loader2, 
  ChevronDown, 
  Mail, 
  Calendar,
  Lock,
  ArrowRight,
  Shield
} from 'lucide-react';
import { API_ENDPOINTS } from '../../api/config';
import { useAuth } from '../../context/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Modals
  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    username: '',
    role: 'OFFICER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.USERS_ALL);
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId, newRole) => {
    setActionLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.USER_DETAIL(targetUserId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
        setEditingUser(null);
        showFeedbackMessage(`Role successfully updated to ${newRole}`);
      } else {
        showFeedbackMessage('Failed to update role. Please try again.', true);
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      showFeedbackMessage('Network error occurred.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.full_name || !newUser.email) return;

    setActionLoading(true);
    try {
      const payload = {
        ...newUser,
        username: newUser.username || newUser.email.split('@')[0]
      };
      const res = await fetch(API_ENDPOINTS.USERS_ALL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        setUsers(prev => [created, ...prev]);
        setShowAddModal(false);
        setNewUser({ full_name: '', email: '', username: '', role: 'OFFICER' });
        showFeedbackMessage(`User ${created.full_name} created successfully!`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showFeedbackMessage(errorData.error || 'Failed to create user account.', true);
      }
    } catch (err) {
      console.error('Error creating user:', err);
      showFeedbackMessage('Error connecting to server.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const showFeedbackMessage = (msg, isError = false) => {
    setFeedback({ message: msg, isError });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'ALL' || (u.role || '').toUpperCase() === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => (u.role || '').toUpperCase() === 'ADMIN').length;
    const officers = users.filter(u => (u.role || '').toUpperCase() === 'OFFICER').length;
    const students = users.filter(u => (u.role || '').toUpperCase() === 'STUDENT').length;
    return { total, admins, officers, students };
  }, [users]);

  const getRoleBadge = (role) => {
    const r = (role || '').toUpperCase();
    switch (r) {
      case 'ADMIN':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-600',
          label: 'Director / Admin'
        };
      case 'OFFICER':
        return {
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          dot: 'bg-blue-600',
          label: 'SWAFO Officer'
        };
      case 'STUDENT':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: 'Student'
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
          label: role || 'User'
        };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen bg-[#f8fafc] font-manrope animate-fade-in pb-24">
      
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] p-4 rounded-2xl shadow-2xl border transition-all animate-in slide-in-from-top-4 flex items-center justify-between gap-3 ${
          feedback.isError 
            ? 'bg-rose-50 text-rose-800 border-rose-200' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            {feedback.isError ? <ShieldAlert size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />}
            <span className="text-xs sm:text-sm font-bold truncate">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ══════════════════════════════ HEADER ══════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
              Access Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-pjs font-extrabold text-[#003624] tracking-tight">
            User Management
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
            Configure institutional permissions, officer credentials, and system accounts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#004d33] text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-[#004d33]/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Add Account</span>
        </button>
      </div>

      {/* ══════════════════════════════ STATS METRICS (2x2 on Mobile) ══════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Total Accounts</span>
            <span className="text-xl sm:text-2xl font-pjs font-black text-[#003624]">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Directors / Admin</span>
            <span className="text-xl sm:text-2xl font-pjs font-black text-[#003624]">{stats.admins}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Shield size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Field Officers</span>
            <span className="text-xl sm:text-2xl font-pjs font-black text-[#003624]">{stats.officers}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Students</span>
            <span className="text-xl sm:text-2xl font-pjs font-black text-[#003624]">{stats.students}</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════ SEARCH & FILTER BAR ══════════════════════════════ */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Roles' },
            { id: 'ADMIN', label: 'Admins' },
            { id: 'OFFICER', label: 'Officers' },
            { id: 'STUDENT', label: 'Students' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-[#004d33] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════ USER DIRECTORY ══════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-10 h-10 text-[#004d33] animate-spin mx-auto mb-3" />
            <p className="text-xs sm:text-sm font-bold text-slate-500">Loading user roster...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 sm:p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
              <Search size={32} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-700 mb-1">No users found</h3>
            <p className="text-xs text-slate-400 max-w-xs">No accounts match the current filter or search criteria.</p>
          </div>
        ) : (
          <>
            {/* ─── DESKTOP TABLE VIEW ─── */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-6">User Account</th>
                    <th className="py-4 px-6">Institutional Email</th>
                    <th className="py-4 px-6">System Role</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Joined</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => {
                    const badge = getRoleBadge(u.role);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#004d33] font-bold text-sm flex items-center justify-center border border-emerald-100 shrink-0">
                              {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-[#003624] text-sm truncate">{u.full_name || 'Unnamed User'}</h4>
                              <p className="text-xs text-slate-400 font-mono">@{u.username || u.email?.split('@')[0]}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold text-slate-600">{u.email}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400 font-medium">
                          {u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Edit Role
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ─── MOBILE CARD VIEW ─── */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredUsers.map(u => {
                const badge = getRoleBadge(u.role);
                return (
                  <div key={u.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/40 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#003624] font-bold text-sm flex items-center justify-center border border-emerald-100 shrink-0">
                          {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#003624] text-sm truncate">{u.full_name || 'Unnamed User'}</h4>
                          <p className="text-[11px] text-slate-400 font-mono truncate">@{u.username || u.email?.split('@')[0]}</p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider shrink-0 ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-50">
                      <span className="truncate pr-2 font-medium">{u.email}</span>
                      <button
                        onClick={() => setEditingUser(u)}
                        className="px-3 py-1.5 bg-[#004d33] text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 active:scale-95 transition-all cursor-pointer"
                      >
                        Edit Role
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════ EDIT ROLE MODAL ══════════════════════════════ */}
      {editingUser && (
        <div className="fixed inset-0 z-[9999] bg-[#003624]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-pjs font-black text-[#003624]">Edit User Role</h3>
                <p className="text-xs text-slate-400 font-medium">Update institutional permissions</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 p-3.5 bg-slate-50 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-[#003624] font-bold text-sm flex items-center justify-center border border-slate-200">
                {(editingUser.full_name || editingUser.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#003624] truncate">{editingUser.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{editingUser.email}</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {[
                { id: 'ADMIN', title: 'Director / Admin', desc: 'Full access to case adjudication, patrols, and analytics.' },
                { id: 'OFFICER', title: 'SWAFO Officer', desc: 'Field patrol logging, violation citations, and heatmaps.' },
                { id: 'STUDENT', title: 'Student', desc: 'Standard student view with freedom wall and handbook.' }
              ].map(opt => {
                const isSelected = (editingUser.role || '').toUpperCase() === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleUpdateRole(editingUser.id, opt.id)}
                    disabled={actionLoading}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#003624] mb-0.5">{opt.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setEditingUser(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ CREATE ACCOUNT MODAL ══════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-[#003624]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-pjs font-black text-[#003624]">Add New Account</h3>
                <p className="text-xs text-slate-400 font-medium">Create credentials for officers or staff</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Officer Juan Dela Cruz"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jdelacruz@dlsud.edu.ph"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Username (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-generate from email"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Assigned Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-[#003624] outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="OFFICER">SWAFO Officer</option>
                  <option value="ADMIN">Director / Administrator</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-[#004d33] hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#004d33]/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
