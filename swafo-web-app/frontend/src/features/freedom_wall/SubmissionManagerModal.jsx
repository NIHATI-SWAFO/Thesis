import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_ENDPOINTS } from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import { X, ShieldCheck, MapPin, Send, Lock, Loader2, Share2, UploadCloud, FileText } from 'lucide-react';

export default function SubmissionManagerModal({ submissionId, onClose, onUpdated }) {
  const { user } = useAuth();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Status & Priority Edits
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [visibility, setVisibility] = useState('');
  const [resolutionFile, setResolutionFile] = useState(null);
  
  // Response/Note
  const [replyContent, setReplyContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  // Referral
  const [showReferral, setShowReferral] = useState(false);
  const [referTo, setReferTo] = useState('');
  const [referReason, setReferReason] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [submissionId]);

  const fetchDetail = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.FW_MANAGE_DETAIL(submissionId), {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSub(data);
        setStatus(data.status);
        setPriority(data.official_priority);
        setVisibility(data.visibility || 'Pending Review');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const handleUpdateMeta = async () => {
    try {
      const formData = new FormData();
      formData.append('status', status);
      formData.append('official_priority', priority);
      formData.append('visibility', visibility);
      
      if (status === 'Resolved' && resolutionFile) {
        formData.append('resolution_file', resolutionFile);
      }

      const res = await fetch(API_ENDPOINTS.FW_MANAGE_DETAIL(submissionId), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });
      if (res.ok) {
        onUpdated();
        fetchDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    setIsReplying(true);
    try {
      const res = await fetch(API_ENDPOINTS.FW_MANAGE_RESPOND(submissionId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ content: replyContent, is_internal_note: isInternalNote })
      });
      if (res.ok) {
        setReplyContent('');
        fetchDetail();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplying(false);
    }
  };

  const handleSendReferral = async () => {
    if (!referTo || !referReason) return;
    try {
      const res = await fetch(API_ENDPOINTS.FW_MANAGE_REFER(submissionId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ referred_to: referTo, reason: referReason })
      });
      if (res.ok) {
        setShowReferral(false);
        fetchDetail();
        onUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!sub && !loading) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-[#003624]/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-emerald-50">
        
        {/* Header */}
        <div className="h-[80px] px-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-pjs font-bold text-[#003624]">Manage Submission</h3>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{sub?.reference_number}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-emerald-600" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            
            {/* Quick Actions / Status Strip */}
            <div className="flex gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Official Status</label>
                <div className="space-y-3">
                  <select value={status} onChange={(e) => setStatus(e.target.value)} onBlur={handleUpdateMeta} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-[#003624] outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="Submitted">Submitted</option>
                    <option value="Acknowledged">Acknowledged</option>
                    <option value="Under Review">Under Review</option>
                    <option value="For Investigation">For Investigation</option>
                    <option value="Action Taken">Action Taken</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Dismissed">Dismissed</option>
                  </select>
                  
                  {status === 'Resolved' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1.5 flex items-center gap-1"><UploadCloud size={12}/> Attach Resolution Report</label>
                      <input 
                        type="file" 
                        onChange={(e) => {
                          setResolutionFile(e.target.files[0]);
                        }}
                        onBlur={handleUpdateMeta}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
                      />
                      {sub?.resolution_file && !resolutionFile && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1"><FileText size={10}/> Report already uploaded</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} onBlur={handleUpdateMeta} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-[#003624] outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Visibility</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)} onBlur={handleUpdateMeta} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-[#003624] outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="Pending Review">Pending Review</option>
                  <option value="Community">Community Feed</option>
                  <option value="Private">Private</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => setShowReferral(!showReferral)} className="h-[38px] px-4 bg-blue-50 text-blue-700 rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-blue-100 flex items-center gap-2 transition-colors">
                  <Share2 size={14} /> Escalate
                </button>
              </div>
            </div>

            {/* Referral Form */}
            {showReferral && (
              <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl animate-in fade-in zoom-in-95">
                <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2"><Share2 size={16} /> External Referral</h4>
                <div className="space-y-4">
                  <select value={referTo} onChange={e=>setReferTo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-none ring-1 ring-blue-200 text-sm outline-none">
                    <option value="">Select Destination...</option>
                    <option value="Guidance Office">Guidance Office</option>
                    <option value="Campus Security">Campus Security</option>
                    <option value="College Dean">College Dean</option>
                    <option value="Facilities Management">Facilities Management</option>
                  </select>
                  <textarea value={referReason} onChange={e=>setReferReason(e.target.value)} placeholder="Reason for referral..." className="w-full px-4 py-2.5 rounded-xl border-none ring-1 ring-blue-200 text-sm outline-none resize-none h-20"></textarea>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowReferral(false)} className="px-4 py-2 text-xs font-bold text-blue-600">Cancel</button>
                    <button onClick={handleSendReferral} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-700">Submit Referral</button>
                  </div>
                </div>
              </div>
            )}

            {/* Core Info */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-1 rounded-md uppercase">{getIntentLabel(sub.submission_type)}</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">{sub.category}</span>
                {sub.is_anonymous && <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1"><ShieldCheck size={12}/> Anonymous</span>}
              </div>
              
              <h2 className="text-2xl font-bold font-pjs text-[#003624] mb-4">{sub.title}</h2>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-slate-700 font-manrope leading-relaxed whitespace-pre-wrap">{sub.description}</p>
              </div>

              {sub.location && (
                <div className="flex items-center gap-2 mt-4 text-sm text-slate-500 font-bold">
                  <MapPin size={16} className="text-emerald-600" /> Location: {sub.location}
                </div>
              )}
            </div>

            {/* Referrals List */}
            {sub.referrals && sub.referrals.length > 0 && (
              <div className="mb-8 border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-xl">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-800 mb-3">Active Referrals</h4>
                <div className="space-y-3">
                  {sub.referrals.map(ref => (
                    <div key={ref.id}>
                      <p className="text-sm font-bold text-blue-900">{ref.referred_to} <span className="text-xs font-normal text-blue-600 ml-2">({ref.status})</span></p>
                      <p className="text-xs text-blue-700/80 mt-0.5">{ref.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Timeline */}
            <div className="mb-8">
              <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-6">Discussion & Notes</h4>
              
              <div className="space-y-6">
                {sub.responses.map(resp => (
                  <div key={resp.id} className={`p-5 rounded-2xl relative ${resp.is_internal_note ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                    {resp.is_internal_note && <div className="absolute top-4 right-4 text-amber-500 flex items-center gap-1 text-[10px] font-black uppercase"><Lock size={12} /> Internal</div>}
                    <p className="text-sm text-slate-800 font-manrope mb-3 pr-16">{resp.content}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${resp.is_internal_note ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {resp.director_name} • {new Date(resp.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
              <textarea 
                value={replyContent} 
                onChange={e=>setReplyContent(e.target.value)}
                placeholder="Type a response or internal note..." 
                className="w-full p-4 text-sm font-manrope outline-none resize-none h-24"
              ></textarea>
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isInternalNote} onChange={e=>setIsInternalNote(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1"><Lock size={12}/> Save as Internal Note (Hidden from Student)</span>
                </label>
                <button onClick={handleSendReply} disabled={isReplying || !replyContent.trim()} className="bg-[#003624] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-900 disabled:opacity-50">
                  {isReplying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Save
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>,
    document.body
  );
}