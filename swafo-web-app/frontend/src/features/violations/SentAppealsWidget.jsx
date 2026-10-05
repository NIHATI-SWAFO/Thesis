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
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.1em] bg-amber-100 text-amber-700 ring-1 ring-amber-200 shadow-sm">
          {statusText}
        </span>
      );
    case 'AWAITING_INFO':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.1em] bg-blue-100 text-blue-700 ring-1 ring-blue-200 shadow-sm">
          REPLY
        </span>
      );
    case 'APPROVED':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.1em] bg-emerald-100/60 text-[#006b5d] ring-1 ring-emerald-200 shadow-sm">
          {statusText}
        </span>
      );
    case 'REJECTED':
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.1em] bg-red-100/60 text-red-700 ring-1 ring-red-200 shadow-sm">
          {statusText}
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.1em] bg-slate-100 text-slate-700 ring-1 ring-slate-200 shadow-sm">
          {statusText}
        </span>
      );
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
    if (user?.token) {
      fetch(API_ENDPOINTS.VIOLATIONS_APPEALS, {
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
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <span className="material-symbols-outlined text-[32px] text-slate-300 mb-2">inbox</span>
            <p className="text-[13px] font-medium text-slate-500">
              {activeTab === 'replies' ? 'No active replies from the admin.' : 'No appeals submitted yet.'}
            </p>
          </div>
        ) : (
          displayedAppeals.map((appeal) => (
            <div 
              key={appeal.id} 
              onClick={() => setSelectedAppeal(appeal)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedAppeal(appeal);
                }
              }}
              className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500 hover:ring-2 hover:ring-emerald-500/30"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">
                  {new Date(appeal.created_at).toLocaleDateString()}
                </p>
                {getStatusBadge(appeal.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#009b69]">gavel</span>
                <p className="text-[14px] font-bold text-slate-700 group-hover:text-[#003624] transition-colors">
                  Ref: {appeal.violation_code}
                </p>
              </div>
              {appeal.status === 'AWAITING_INFO' && (
                <p className="mt-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                  Requires your attention
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <AppealThreadModal appeal={selectedAppeal} onClose={() => setSelectedAppeal(null)} role="STUDENT" />
    </div>
  );
}


