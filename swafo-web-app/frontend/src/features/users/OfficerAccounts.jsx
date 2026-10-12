import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, KeyRound, ShieldAlert, History, Check, Copy, RefreshCw, 
  Search, Filter, ShieldCheck, UserCheck, UserX, AlertCircle, 
  ChevronRight, ArrowUpDown, Lock, Clock, Info, CheckCircle2, X, Trash2, UserPlus
} from 'lucide-react';
import { API_ENDPOINTS } from '../../api/config';

export default function OfficerAccounts() {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'requests' | 'audit'

  // Data states
  const [officers, setOfficers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE'

  // Temp Password Modal State
  const [tempPasswordModal, setTempPasswordModal] = useState({
    isOpen: false,
    officerName: '',
    officerEmail: '',
    temporaryPassword: '',
    copied: false
  });

  // Reject Modal State
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    requestId: null,
    officerName: '',
    reason: ''
  });

  // Delete Officer Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    officerId: null,
    officerName: '',
    officerEmail: ''
  });

  // Add Patrol Officer Modal State
  const [addOfficerModal, setAddOfficerModal] = useState({
    isOpen: false,
    fullName: '',
    email: '',
    password: '',
    mustChangePassword: true,
    submitting: false,
    error: ''
  });

  // Fetch initial data
  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [officersRes, requestsRes, auditRes] = await Promise.all([
        fetch(API_ENDPOINTS.ADMIN_OFFICERS),
        fetch(API_ENDPOINTS.ADMIN_RESET_REQUESTS),
        fetch(API_ENDPOINTS.ADMIN_SECURITY_AUDIT_LOGS)
      ]);

      if (officersRes.ok) {
        const officersData = await officersRes.json();
        setOfficers(Array.isArray(officersData) ? officersData : []);
      }

      if (requestsRes.ok) {
        const reqData = await requestsRes.json();
        setRequests(reqData.requests || []);
        setPendingCount(reqData.pending_count || 0);
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(Array.isArray(auditData) ? auditData : []);
      }
    } catch (err) {
      console.error("Error fetching officer management data:", err);
      if (!isSilent) showNotice('error', 'Failed to load officer records. Please try again.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Live presence polling every 15 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  // ─── Actions ─────────────────────────────────────────────────────────────

  // Approve Reset Request
  const handleApproveRequest = async (requestId) => {
    setActionLoadingId(`approve-${requestId}`);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_RESET_REQUEST_APPROVE(requestId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve request');

      setTempPasswordModal({
        isOpen: true,
        officerName: data.officer_name,
        officerEmail: data.officer_email,
        temporaryPassword: data.temporary_password,
        copied: false
      });

      showNotice('success', `Reset request approved for ${data.officer_name}`);
      fetchData();
    } catch (err) {
      showNotice('error', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Submit Rejection
  const handleSubmitReject = async () => {
    if (!rejectModal.requestId) return;
    setActionLoadingId(`reject-${rejectModal.requestId}`);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_RESET_REQUEST_REJECT(rejectModal.requestId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectModal.reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject request');

      showNotice('info', 'Request has been rejected.');
      setRejectModal({ isOpen: false, requestId: null, officerName: '', reason: '' });
      fetchData();
    } catch (err) {
      showNotice('error', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Manual Reset Password for Directory Officer
  const handleManualReset = async (officerId, officerName) => {
    if (!window.confirm(`Generate a temporary password reset for ${officerName}?`)) return;

    setActionLoadingId(`manual-${officerId}`);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_OFFICER_MANUAL_RESET(officerId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setTempPasswordModal({
        isOpen: true,
        officerName: data.officer_name,
        officerEmail: data.officer_email,
        temporaryPassword: data.temporary_password,
        copied: false
      });

      showNotice('success', `Temporary credentials created for ${officerName}`);
      fetchData();
    } catch (err) {
      showNotice('error', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Officer Account
  const handleDeleteOfficer = async () => {
    if (!deleteModal.officerId) return;
    setActionLoadingId(`delete-${deleteModal.officerId}`);
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_OFFICER_DELETE(deleteModal.officerId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete officer account');

      showNotice('success', data.message || `Officer ${deleteModal.officerName} has been deleted.`);
      setDeleteModal({ isOpen: false, officerId: null, officerName: '', officerEmail: '' });
      fetchData();
    } catch (err) {
      showNotice('error', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create Patrol Officer Account
  const handleCreateOfficer = async (e) => {
    if (e) e.preventDefault();
    if (!addOfficerModal.fullName.trim() || !addOfficerModal.email.trim()) {
      setAddOfficerModal(prev => ({ ...prev, error: 'Full name and institutional email are required.' }));
      return;
    }

    setAddOfficerModal(prev => ({ ...prev, submitting: true, error: '' }));
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_OFFICER_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: addOfficerModal.fullName.trim(),
          email: addOfficerModal.email.trim(),
          officer_badge: 'Patrol Officer',
          password: addOfficerModal.password.trim(),
          must_change_password: addOfficerModal.mustChangePassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create officer account');

      setAddOfficerModal({
        isOpen: false,
        fullName: '',
        email: '',
        password: '',
        mustChangePassword: true,
        submitting: false,
        error: ''
      });

      // Show temporary credentials modal
      setTempPasswordModal({
        isOpen: true,
        officerName: data.officer.full_name,
        officerEmail: data.officer.email,
        temporaryPassword: data.temporary_password,
        copied: false
      });

      showNotice('success', `Patrol officer account created for ${data.officer.full_name}`);
      fetchData();
    } catch (err) {
      setAddOfficerModal(prev => ({ ...prev, submitting: false, error: err.message }));
    }
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAddOfficerModal(prev => ({ ...prev, password: generated }));
  };

  const handleCopyPassword = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(tempPasswordModal.temporaryPassword);
      setTempPasswordModal(prev => ({ ...prev, copied: true }));
      setTimeout(() => setTempPasswordModal(prev => ({ ...prev, copied: false })), 2500);
    }
  };

  // ─── Filtered Lists & Metrics ─────────────────────────────────────────────

  const onlineCount = useMemo(() => {
    return officers.filter(off => off.is_currently_online).length;
  }, [officers]);

  const filteredOfficers = useMemo(() => {
    return officers.filter(off => {
      const q = searchQuery.toLowerCase();
      const matchSearch = off.full_name?.toLowerCase().includes(q) || off.email?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || (
        statusFilter === 'ONLINE' ? off.is_currently_online :
        statusFilter === 'OFFLINE' ? !off.is_currently_online : true
      );
      return matchSearch && matchStatus;
    });
  }, [officers, searchQuery, statusFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const q = searchQuery.toLowerCase();
      return req.officer_name?.toLowerCase().includes(q) || req.officer_email?.toLowerCase().includes(q);
    });
  }, [requests, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 pb-20 font-manrope">
      
      {/* ─── Top Notification Banner ─── */}
      {notification.message && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-xs sm:text-[13px] font-bold animate-in fade-in slide-in-from-top-4 duration-300 border ${
          notification.type === 'error' 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : notification.type === 'info' 
              ? 'bg-blue-50 border-blue-200 text-blue-800' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ─── Clean Executive Header ─── */}
      <div className="bg-white border-b border-gray-200/80 px-6 sm:px-10 lg:px-12 py-7">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider mb-2">
              <ShieldCheck size={12} className="text-emerald-700" />
              <span>Director Security Operations • Patrol Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-pjs text-gray-900 tracking-tight">
              Patrol Officer Accounts & Credential Recovery
            </h1>
            <p className="mt-1 text-xs text-gray-500 font-medium max-w-2xl">
              Real-time shift presence monitoring, access controls, and password recovery authorizations for designated patrol officers.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 text-center min-w-[90px]">
              <span className="block text-xl font-black font-pjs text-gray-900">{officers.length}</span>
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Patrol Officers</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-3.5 py-2 text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xl font-black font-pjs text-emerald-900">{onlineCount}</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider text-emerald-700 font-bold">Active Now</span>
            </div>

            <div className={`rounded-2xl px-3.5 py-2 text-center min-w-[95px] border transition-all ${
              pendingCount > 0 
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm animate-pulse' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <span className={`block text-xl font-black font-pjs ${pendingCount > 0 ? 'text-amber-800' : 'text-gray-900'}`}>
                {pendingCount}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold">Pending Resets</span>
            </div>

            <button
              onClick={() => fetchData()}
              disabled={loading}
              title="Refresh Data"
              className="p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-700' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs & Search ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-[#003624] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users size={15} />
              <span>Designated Patrol Roster</span>
              <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${activeTab === 'directory' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {officers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-[#003624] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <KeyRound size={15} />
              <span>Pending Requests</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#003624] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <History size={15} />
              <span>Security Audit Logs</span>
            </button>
          </div>

          {/* Search box */}
          {activeTab !== 'audit' && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'requests' ? 'Search requests...' : 'Search patrol officers...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#003624] focus:ring-1 focus:ring-[#003624] outline-none transition-all"
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Content Body ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mt-6">
        
        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: PENDING RESET REQUESTS                                      */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold font-pjs text-gray-900">Credential Recovery Requests</h2>
                <p className="text-xs text-gray-500 font-medium">
                  Review and authorize temporary passwords for patrol officers requesting account resets.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500">Status:</span>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  pendingCount > 0 
                    ? 'bg-amber-50 text-amber-800 border-amber-200' 
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  {pendingCount} Pending Action
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw size={24} className="animate-spin text-emerald-700" />
                <span>Loading recovery requests...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-20 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-900">All Clear — No Pending Requests</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  There are currently no outstanding password recovery requests from officers.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-gray-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Officer Information</th>
                      <th className="px-6 py-4">Date & Time Requested</th>
                      <th className="px-6 py-4">Request Status</th>
                      <th className="px-6 py-4 text-right">Director Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#003624] font-black flex items-center justify-center text-xs">
                              {req.officer_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 font-pjs text-sm">{req.officer_name}</p>
                              <p className="text-[11px] text-gray-500 font-mono">{req.officer_email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-600 font-medium font-mono text-[11px]">
                          {new Date(req.requested_at).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>

                        <td className="px-6 py-4">
                          {req.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending Approval
                            </span>
                          ) : req.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                              <Check size={12} /> Approved
                            </span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 w-max">
                                Rejected
                              </span>
                              {req.rejection_reason && (
                                <span className="text-[10px] text-gray-400 italic mt-0.5">
                                  {req.rejection_reason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setRejectModal({
                                  isOpen: true,
                                  requestId: req.id,
                                  officerName: req.officer_name,
                                  reason: ''
                                })}
                                disabled={actionLoadingId === `reject-${req.id}`}
                                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-colors cursor-pointer text-xs"
                              >
                                Reject
                              </button>

                              <button
                                onClick={() => handleApproveRequest(req.id)}
                                disabled={actionLoadingId === `approve-${req.id}`}
                                className="px-3.5 py-1.5 rounded-xl bg-[#003624] text-white font-bold hover:bg-[#0f4d35] transition-all shadow-sm cursor-pointer text-xs flex items-center gap-1.5"
                              >
                                {actionLoadingId === `approve-${req.id}` ? (
                                  <>
                                    <RefreshCw size={12} className="animate-spin" />
                                    <span>Processing...</span>
                                  </>
                                ) : (
                                  <>
                                    <KeyRound size={13} />
                                    <span>Approve & Reset</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">
                              Handled {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: DESIGNATED PATROL ROSTER                                    */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'directory' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-700">Filter Activity:</span>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 font-semibold text-gray-700 outline-none"
                >
                  <option value="ALL">All Patrol Officers ({officers.length})</option>
                  <option value="ONLINE">Active Now Only ({onlineCount})</option>
                  <option value="OFFLINE">Off Duty Only ({Math.max(0, officers.length - onlineCount)})</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium">
                  Showing <strong className="text-gray-800">{filteredOfficers.length}</strong> of {officers.length} designated patrol officers
                </span>

                <button
                  type="button"
                  onClick={() => setAddOfficerModal({
                    isOpen: true,
                    fullName: '',
                    email: '',
                    password: '',
                    mustChangePassword: true,
                    submitting: false,
                    error: ''
                  })}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#003624] text-white hover:bg-[#0f4d35] active:scale-95 transition-all text-xs font-bold shadow-xs cursor-pointer shrink-0"
                  title="Add a designated patrol officer account"
                >
                  <UserPlus size={13} className="text-[#a1dbba]" />
                  <span>Add Patrol Officer</span>
                </button>
              </div>
            </div>

            {/* Patrol Officers Table */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-gray-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Patrol Officer</th>
                      <th className="px-6 py-4">Assignment</th>
                      <th className="px-6 py-4">Duty & Activity Status</th>
                      <th className="px-6 py-4">Last Activity</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOfficers.map((off) => (
                      <tr key={off.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#003624] text-[#a1dbba] font-black flex items-center justify-center text-xs shadow-sm ring-2 ring-emerald-500/20">
                              {off.full_name?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 font-pjs text-sm">{off.full_name}</p>
                              <p className="text-[11px] text-gray-500 font-mono">{off.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Patrol Officer
                          </span>
                        </td>

                        {/* Real-Time Presence Status */}
                        <td className="px-6 py-4">
                          {off.is_currently_online ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Active Now
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Inactive (Off Duty)
                            </span>
                          )}
                        </td>

                        {/* Last Seen / Session Info */}
                        <td className="px-6 py-4 text-gray-500 font-mono text-[11px]">
                          {off.is_currently_online ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              Active in session
                            </span>
                          ) : off.last_seen ? (
                            new Date(off.last_seen).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : off.last_login ? (
                            new Date(off.last_login).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : (
                            <span className="text-gray-400 italic">No recorded session</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleManualReset(off.id, off.full_name)}
                              disabled={actionLoadingId === `manual-${off.id}`}
                              className="px-2.5 py-1.5 rounded-xl border border-emerald-800/20 text-[#003624] font-bold hover:bg-emerald-50 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                              title="Generate temporary reset password"
                            >
                              <KeyRound size={12} />
                              <span>Reset Password</span>
                            </button>

                            <button
                              onClick={() => setDeleteModal({
                                isOpen: true,
                                officerId: off.id,
                                officerName: off.full_name,
                                officerEmail: off.email
                              })}
                              disabled={actionLoadingId === `delete-${off.id}`}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center gap-1"
                              title="Delete patrol officer account"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: SECURITY AUDIT LOGS                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold font-pjs text-gray-900">Security Audit Trail</h2>
                <p className="text-xs text-gray-500 font-medium">
                  Immutable security ledger tracking password recoveries, approvals, and authorization events.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gray-100 text-gray-600">
                {auditLogs.length} events logged
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-20 text-center text-gray-400 text-xs">
                No audit events recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-gray-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Action Event</th>
                      <th className="px-6 py-4">Performed By (Actor)</th>
                      <th className="px-6 py-4">Target User</th>
                      <th className="px-6 py-4">IP Address</th>
                      <th className="px-6 py-4">Event Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-3.5 text-gray-600 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'medium'
                          })}
                        </td>

                        <td className="px-6 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            log.action.includes('APPROVED')
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action.includes('REJECTED')
                                ? 'bg-rose-100 text-rose-800'
                                : log.action.includes('REQUESTED')
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>

                        <td className="px-6 py-3.5 font-bold text-gray-800">
                          {log.actor_name || 'System / Anonymous'}
                        </td>

                        <td className="px-6 py-3.5 font-medium text-gray-700">
                          {log.target_name || '—'}
                        </td>

                        <td className="px-6 py-3.5 text-gray-400 font-mono text-[11px]">
                          {log.ip_address || '127.0.0.1'}
                        </td>

                        <td className="px-6 py-3.5 text-gray-600 max-w-xs truncate" title={log.details}>
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ONE-TIME TEMPORARY PASSWORD MODAL (Prominent Security Card)          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tempPasswordModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-100">
            <button
              onClick={() => setTempPasswordModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#003624] text-[#a1dbba] flex items-center justify-center shadow-md">
                <KeyRound size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  One-Time Temporary Password
                </span>
                <h3 className="text-xl font-black text-gray-900 font-pjs mt-0.5">
                  Reset Authorized for {tempPasswordModal.officerName}
                </h3>
              </div>
            </div>

            {/* Warning Box */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold leading-relaxed mb-5 flex items-start gap-2.5">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                This temporary password is displayed <span className="underline font-bold">once only</span> and cannot be retrieved again. Please securely communicate this to the officer. They will be forced to change credentials upon logging in.
              </div>
            </div>

            {/* Credentials Display Box */}
            <div className="bg-[#0f172a] text-white rounded-2xl p-4 sm:p-5 mb-5">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">
                <span>Account Identifier</span>
                <span>{tempPasswordModal.officerEmail}</span>
              </div>
              
              <div className="flex items-center justify-between gap-3 bg-slate-800/80 rounded-xl px-4 py-3 border border-slate-700">
                <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-emerald-400 select-all">
                  {tempPasswordModal.temporaryPassword}
                </span>

                <button
                  onClick={handleCopyPassword}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tempPasswordModal.copied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {tempPasswordModal.copied ? (
                    <>
                      <Check size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => setTempPasswordModal(prev => ({ ...prev, isOpen: false }))}
              className="w-full py-3 bg-[#003624] text-white text-xs sm:text-[13px] font-bold rounded-xl hover:bg-[#0f4d35] transition-colors cursor-pointer"
            >
              I Have Securely Copied This Password
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* REJECT REQUEST MODAL                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <button
              onClick={() => setRejectModal({ isOpen: false, requestId: null, officerName: '', reason: '' })}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 font-pjs mb-1">
              Reject Reset Request
            </h3>
            <p className="text-xs text-gray-500 font-manrope mb-4">
              Provide an optional reason for denying the password reset request for <strong>{rejectModal.officerName}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 block mb-1">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="EG: Please verify identity with the SWAFO Office in person."
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#003624] outline-none"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectModal({ isOpen: false, requestId: null, officerName: '', reason: '' })}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReject}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CONFIRM DELETE OFFICER MODAL                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-100">
            <button
              onClick={() => setDeleteModal({ isOpen: false, officerId: null, officerName: '', officerEmail: '' })}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs">
                <Trash2 size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  Director Access Control
                </span>
                <h3 className="text-xl font-black text-gray-900 font-pjs mt-0.5">
                  Delete Officer Account
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-600 font-manrope leading-relaxed mb-6">
              Are you sure you want to permanently delete the patrol officer account for <strong className="text-gray-900">{deleteModal.officerName}</strong> (<span className="font-mono text-gray-500">{deleteModal.officerEmail}</span>)?
              <br /><br />
              This officer will immediately lose access to the SWAFO portal and active patrol duties.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, officerId: null, officerName: '', officerEmail: '' })}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOfficer}
                disabled={actionLoadingId === `delete-${deleteModal.officerId}`}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                {actionLoadingId === `delete-${deleteModal.officerId}` ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ADD PATROL OFFICER ACCOUNT MODAL                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {addOfficerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-100 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setAddOfficerModal(prev => ({ ...prev, isOpen: false, error: '' }))}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#003624] text-[#a1dbba] flex items-center justify-center shadow-md">
                <UserPlus size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Director Command Center
                </span>
                <h3 className="text-xl font-black text-gray-900 font-pjs mt-0.5">
                  Add Patrol Officer Account
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-500 font-medium mb-5">
              Provision a new designated patrol officer account with institutional access for campus patrols and safety operations.
            </p>

            {addOfficerModal.error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold mb-4 flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{addOfficerModal.error}</span>
              </div>
            )}

            <form onSubmit={handleCreateOfficer} className="space-y-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan C. Dela Cruz"
                  value={addOfficerModal.fullName}
                  onChange={(e) => setAddOfficerModal(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#003624] focus:ring-1 focus:ring-[#003624] outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                  DLSU-D Institutional Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. juan.delacruz@dlsud.edu.ph"
                  value={addOfficerModal.email}
                  onChange={(e) => setAddOfficerModal(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#003624] outline-none font-mono transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 block mb-1">
                  Designated Assignment
                </label>
                <div className="w-full text-xs p-3 rounded-xl bg-gray-50 border border-gray-200 font-bold text-emerald-900 flex items-center justify-between">
                  <span>Patrol Officer (Campus Safety & Grounds)</span>
                  <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-extrabold">Designated</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                    Temporary Initial Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                  >
                    Generate Secure Key
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate a secure 12-char key"
                  value={addOfficerModal.password}
                  onChange={(e) => setAddOfficerModal(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full text-xs p-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#003624] outline-none font-mono transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mustChangePassword"
                  checked={addOfficerModal.mustChangePassword}
                  onChange={(e) => setAddOfficerModal(prev => ({ ...prev, mustChangePassword: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#003624] focus:ring-[#003624] border-gray-300 cursor-pointer"
                />
                <label htmlFor="mustChangePassword" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Require officer to change password upon first login
                </label>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setAddOfficerModal(prev => ({ ...prev, isOpen: false, error: '' }))}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addOfficerModal.submitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#003624] hover:bg-[#0f4d35] rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {addOfficerModal.submitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin text-[#a1dbba]" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} className="text-[#a1dbba]" />
                      <span>Create Officer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
