import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../api/config";
import AppealThreadModal from '../../components/common/AppealThreadModal';

import { useSearchParams } from 'react-router-dom';

const getStatusBadge = (status) => {
  const statusText = status.toUpperCase();
  switch (statusText) {
    case 'PENDING':
    case 'REVIEWING':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700">
          {statusText}
        </span>
      );
    case 'AWAITING_INFO':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
          REPLY
        </span>
      );
    case 'APPROVED':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700">
          {statusText}
        </span>
      );
    case 'REJECTED':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700">
          {statusText}
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-700">
          {statusText}
        </span>
      );
  }
};

const getLeftAccent = (status, isRead) => {
  if (isRead) return "border-l-4 border-transparent bg-white";
  const statusText = status.toUpperCase();
  switch (statusText) {
    case 'PENDING':
    case 'REVIEWING': return "border-l-4 border-orange-400 bg-blue-50/30";
    case 'APPROVED': return "border-l-4 border-green-500 bg-blue-50/30";
    case 'AWAITING_INFO': return "border-l-4 border-blue-500 bg-blue-50/30";
    case 'REJECTED': return "border-l-4 border-red-500 bg-blue-50/30";
    default: return "border-l-4 border-gray-400 bg-blue-50/30";
  }
};

export default function SentAppealsWidget() {
  const { user } = useAuth();
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Fail-safe: ensure we have both token and user ID before fetching
    if (user?.token && user?.id) {
      // Append student_id parameter as an extra frontend safeguard
      const url = `${API_ENDPOINTS.VIOLATIONS_APPEALS}?student_id=${user.id}`;
      
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const fetchedAppeals = Array.isArray(data) ? data : (data.results || []);
        setAppeals(fetchedAppeals);
        setLoading(false);
        
        const appealId = searchParams.get('appeal_id');
        if (appealId) {
          const matchingAppeal = fetchedAppeals.find(a => String(a.id) === appealId);
          if (matchingAppeal) {
            setSelectedAppeal(matchingAppeal);
            if (matchingAppeal.status === 'AWAITING_INFO') {
               setActiveTab('replies');
            }
          }
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [user, searchParams]);


  const handleAppealClick = async (appeal) => {
    setSelectedAppeal(appeal);
    
    // If already read, do nothing
    if (appeal.student_read_status) return;

    // Optimistic UI update
    setAppeals(prev => prev.map(a => 
      a.id === appeal.id ? { ...a, student_read_status: true } : a
    ));

    try {
      await fetch(API_ENDPOINTS.VIOLATIONS_APPEALS_UPDATE(appeal.id), {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_read_status: true })
      });
    } catch (err) {
      console.warn("Failed to mark appeal as read", err);
    }
  };

  const displayedAppeals = activeTab === 'replies' 
    ? appeals.filter(a => a.status === 'AWAITING_INFO') 
    : appeals;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col h-fit max-h-[800px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-pjs font-bold text-[18px] text-[#003624]">Appeals History</h2>
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#009b69]">
          <span className="material-symbols-outlined text-[20px]">history</span>
        </div>
      </div>
      
      <div className="flex gap-2 mb-6 p-1 bg-slate-50 rounded-xl">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${
            activeTab === 'all' 
              ? 'bg-white text-[#003624] shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          All Appeals
        </button>
        <button 
          onClick={() => setActiveTab('replies')}
          className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'replies' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Replies
          {appeals.filter(a => a.status === 'AWAITING_INFO').length > 0 && (
             <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayedAppeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[250px] space-y-3 text-center px-4">
            <span className="material-symbols-outlined w-8 h-8 text-gray-300 flex items-center justify-center text-[32px]">folder</span>
            <p className="text-sm font-medium text-gray-400">
              {activeTab === 'replies' ? 'No active replies from the admin.' : 'No appeals submitted yet.'}
            </p>
          </div>
        ) : (
          displayedAppeals.map((appeal) => (
            <div 
              key={appeal.id} 
              onClick={() => handleAppealClick(appeal)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAppealClick(appeal);
                }
              }}
              className={`group p-4 border border-gray-100 rounded-r-xl rounded-l-md shadow-sm transition-all cursor-pointer outline-none hover:shadow-md ${getLeftAccent(appeal.status, appeal.student_read_status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-gray-400 text-xs transition-colors">
                  {new Date(appeal.created_at).toLocaleDateString()}
                </p>
                {getStatusBadge(appeal.status)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`material-symbols-outlined text-[16px] transition-colors ${!appeal.student_read_status ? 'text-[#009b69]' : 'text-slate-400 group-hover:text-[#009b69]'}`}>gavel</span>
                <p className={`text-[14px] font-bold transition-colors flex items-center ${!appeal.student_read_status ? 'text-[#003624]' : 'text-slate-500 group-hover:text-[#003624]'}`}>
                  Ref: {appeal.violation_code}
                </p>
              </div>
              {!appeal.student_read_status && appeal.status === 'AWAITING_INFO' && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                    Requires your attention
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AppealThreadModal appeal={selectedAppeal} onClose={() => setSelectedAppeal(null)} role="STUDENT" />
    </div>
  );
}


