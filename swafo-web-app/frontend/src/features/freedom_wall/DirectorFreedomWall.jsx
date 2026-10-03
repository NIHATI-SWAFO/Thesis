import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, MessageSquare, AlertTriangle, Repeat, Search, Filter, SlidersHorizontal, ChevronRight, Inbox, Clock, ArrowRight } from 'lucide-react';
import SubmissionManagerModal from './SubmissionManagerModal';

export default function DirectorFreedomWall() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubId, setSelectedSubId] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    priority: '',
    status: ''
  });

  useEffect(() => {
    if (user && user.token) {
      fetchData();
    }
  }, [filters, user]);

  const fetchData = async () => {
    if (!user || !user.token) return;
    
    setLoading(true);
    try {
      // Build query string
      const query = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v !== '')
      ).toString();
      
      const [analyticsRes, listRes] = await Promise.all([
        fetch(API_ENDPOINTS.FW_ANALYTICS, { headers: { 'Authorization': `Bearer ${user.token}` } }),
        fetch(`${API_ENDPOINTS.FW_MANAGE_LIST}?${query}`, { headers: { 'Authorization': `Bearer ${user.token}` } })
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (listRes.ok) setSubmissions(await listRes.json());
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Submitted': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Acknowledged': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Under Review': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'For Investigation': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Action Taken': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Resolved': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Dismissed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Low': return 'text-slate-500';
      case 'Moderate': return 'text-blue-500';
      case 'High': return 'text-orange-500 font-bold';
      case 'Critical': return 'text-red-600 font-black';
      default: return 'text-slate-500';
    }
  };

  const getIntentLabel = (type) => {
      switch(type) {
          case 'report_something': return 'Report Something';
          case 'get_help': return 'Get Help';
          case 'resolve_conflict': return 'Resolve a Conflict';
          case 'suggest_improvement': return 'Suggest an Improvement';
          case 'share_experience': return 'Share Your Experience';
          case 'give_appreciation': return 'Give Appreciation';
          default: return type;
      }
  };

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#f4f7f6]/50 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center">
            <MessageSquare size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-pjs font-extrabold text-[#003624] tracking-tight">SWAFO Connect Management</h1>
            <p className="text-slate-500 font-manrope text-[15px] font-medium mt-1">Review, triage, and manage student concerns and feedback.</p>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-slate-100 group-hover:scale-105 transition-all">
            <Inbox size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Submissions</p>
            <h3 className="text-2xl font-pjs font-extrabold text-[#003624] leading-none">{analytics ? analytics.summary.total : '-'}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 group-hover:scale-105 transition-all">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pending / Submitted</p>
            <h3 className="text-2xl font-pjs font-extrabold text-[#003624] leading-none">{analytics ? analytics.summary.pending : '-'}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-red-100 group-hover:scale-105 transition-all">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Critical Concerns</p>
            <h3 className="text-2xl font-pjs font-extrabold text-[#003624] leading-none">{analytics ? analytics.summary.critical : '-'}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-100 group-hover:scale-105 transition-all">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Resolved</p>
            <h3 className="text-2xl font-pjs font-extrabold text-[#003624] leading-none">{analytics ? analytics.summary.resolved : '-'}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xl shadow-emerald-900/5 mb-8 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-slate-400 px-4 border-r border-slate-100">
          <Filter size={16} className="text-emerald-500" />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Filters</span>
        </div>
        
        <select name="type" value={filters.type} onChange={handleFilterChange} className="bg-slate-50/50 border-0 ring-1 ring-slate-200/50 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-slate-50 cursor-pointer transition-all">
          <option value="">All Intents</option>
          <option value="report_something">Report Something</option>
          <option value="get_help">Get Help</option>
          <option value="resolve_conflict">Resolve a Conflict</option>
          <option value="suggest_improvement">Suggest an Improvement</option>
          <option value="share_experience">Share Your Experience</option>
          <option value="give_appreciation">Give Appreciation</option>
        </select>

        <select name="category" value={filters.category} onChange={handleFilterChange} className="bg-slate-50/50 border-0 ring-1 ring-slate-200/50 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-slate-50 cursor-pointer transition-all">
          <option value="">All Categories</option>
          <option value="Professor">Professor / Faculty</option>
          <option value="Subject">Subject / Curriculum</option>
          <option value="Facilities">Facilities</option>
          <option value="Safety">Safety & Security</option>
          <option value="Bullying">Bullying / Harassment</option>
          <option value="Welfare">Student Welfare</option>
        </select>

        <select name="status" value={filters.status} onChange={handleFilterChange} className="bg-slate-50/50 border-0 ring-1 ring-slate-200/50 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-slate-50 cursor-pointer transition-all">
          <option value="">All Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Under Review">Under Review</option>
          <option value="For Investigation">For Investigation</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select name="priority" value={filters.priority} onChange={handleFilterChange} className="bg-slate-50/50 border-0 ring-1 ring-slate-200/50 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-slate-50 cursor-pointer transition-all">
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        {(filters.type || filters.category || filters.status || filters.priority) && (
          <button onClick={() => setFilters({type: '', category: '', priority: '', status: ''})} className="ml-auto px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold font-pjs">Loading records...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[1.5rem] flex items-center justify-center mb-4">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-pjs font-bold text-slate-700 mb-2">No submissions found</h3>
            <p className="text-slate-500 font-manrope">There are no records matching your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Reference</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Subject & Details</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporter</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Intent & Category</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority & Vis</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub.id} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-all duration-200 group">
                    <td className="py-6 px-6">
                      <span className="text-[12px] font-bold font-pjs text-slate-500 bg-slate-100 px-2 py-1 rounded-md group-hover:bg-white transition-colors">{sub.reference_number}</span>
                    </td>
                    <td className="py-6 px-6">
                      <p className="font-bold text-[#003624] text-sm truncate max-w-[250px] leading-tight">{sub.title}</p>
                      <p className="text-[12px] text-slate-400 font-medium mt-1 truncate max-w-[250px]">{sub.description}</p>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-2">
                        {sub.is_anonymous ? (
                          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <ShieldCheck size={14} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                            {sub.student_name.charAt(0)}
                          </div>
                        )}
                        <span className={`text-[13px] font-bold ${sub.is_anonymous ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                          {sub.student_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <p className="font-bold text-slate-700 text-[13px] leading-tight">{getIntentLabel(sub.submission_type)}</p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">{sub.category}</p>
                    </td>
                    <td className="py-6 px-6">
                      <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-6 px-6 text-[13px]">
                      <span className={getPriorityColor(sub.official_priority)}>{sub.official_priority}</span>
                      <div className="mt-1">
                        <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase tracking-widest
                          ${sub.visibility === 'Community' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            sub.visibility === 'Private' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            sub.visibility === 'Hidden' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'}
                        `}>
                          {sub.visibility || 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-right">
                      <button 
                        onClick={() => setSelectedSubId(sub.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm group/btn"
                      >
                        Review <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSubId && (
        <SubmissionManagerModal 
          submissionId={selectedSubId} 
          onClose={() => setSelectedSubId(null)} 
          onUpdated={fetchData} 
        />
      )}
    </div>
  );
}
