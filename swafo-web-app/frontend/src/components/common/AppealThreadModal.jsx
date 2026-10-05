import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const getStatusBadge = (status) => {
  const statusText = status.toUpperCase();
  switch (statusText) {
    case 'PENDING':
    case 'REVIEWING':
      return <span className="px-3 py-1 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.1em] bg-amber-100 text-amber-700 ring-1 ring-amber-200">PENDING</span>;
    case 'AWAITING_INFO':
      return <span className="px-3 py-1 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.1em] bg-blue-100 text-blue-700 ring-1 ring-blue-200">REPLY</span>;
    case 'APPROVED':
      return <span className="px-3 py-1 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.1em] bg-emerald-100/60 text-[#006b5d] ring-1 ring-emerald-200">APPROVED</span>;
    case 'REJECTED':
      return <span className="px-3 py-1 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.1em] bg-rose-100 text-rose-700 ring-1 ring-rose-200">DENIED</span>;
    default:
      return <span className="px-3 py-1 rounded-full text-[10px] font-black font-pjs uppercase tracking-[0.1em] bg-slate-100 text-slate-700 ring-1 ring-slate-200">{statusText}</span>;
  }
};

export default function AppealThreadModal({ appeal, onClose, onAction, isUpdating, role = 'STUDENT' }) {
  const [remarks, setRemarks] = useState("");

  if (!appeal) return null;

  const timeline = [];
  
  // Node 1: Student Submission
  timeline.push({
    id: 'node-1',
    type: 'STUDENT',
    title: 'Appeal Submitted',
    content: appeal.description,
    timestamp: appeal.created_at,
    subject: appeal.subject
  });

  // Node 2/3: Officer Interaction (if exists)
  if (appeal.status !== 'PENDING' && appeal.reviewer_remarks) {
    const isFinal = ['APPROVED', 'REJECTED'].includes(appeal.status);
    timeline.push({
      id: 'node-2',
      type: isFinal ? 'FINAL_ACTION' : 'OFFICER_REPLY',
      title: isFinal ? (appeal.status === 'APPROVED' ? 'Appeal Approved' : 'Appeal Denied') : 'Officer Reply',
      content: appeal.reviewer_remarks,
      timestamp: appeal.updated_at,
      status: appeal.status
    });
  }

  const isRemarksEmpty = remarks.trim().length === 0;
  const canAction = role !== 'STUDENT' && ['PENDING', 'AWAITING_INFO'].includes(appeal.status);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-[#003624]/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-[2rem] w-full max-w-[600px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] relative" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="shrink-0 p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px] text-slate-400">forum</span>
            </div>
            <div>
              <h2 className="text-[20px] font-pjs font-extrabold text-[#003624] tracking-tight">{appeal.student_name}</h2>
              <p className="text-[12px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Ref: {appeal.violation_code}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            {getStatusBadge(appeal.status)}
          </div>
        </div>

        {/* Timeline Body */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 sm:p-8 bg-slate-50/50 max-h-[50vh]">
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
            
            {timeline.map((node, index) => (
              <div key={node.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                  node.type === 'STUDENT' ? 'bg-slate-200 text-slate-500' : 
                  node.type === 'OFFICER_REPLY' ? 'bg-blue-100 text-blue-600' : 
                  node.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {node.type === 'STUDENT' ? 'person' : node.type === 'OFFICER_REPLY' ? 'support_agent' : 'gavel'}
                  </span>
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex flex-col gap-1 mb-3">
                    <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                      {new Date(node.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <h3 className={`font-bold text-[14px] ${node.type === 'STUDENT' ? 'text-[#1a1a1a]' : node.status === 'APPROVED' ? 'text-emerald-700' : node.status === 'REJECTED' ? 'text-rose-700' : 'text-blue-700'}`}>
                      {node.title}
                    </h3>
                    {node.subject && <p className="text-[12px] font-bold text-slate-500 mt-1">Subj: {node.subject}</p>}
                  </div>
                  <p className="text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed font-medium bg-slate-100/50 p-4 rounded-lg break-all">
                    {node.content}
                  </p>
                </div>

              </div>
            ))}

          </div>
        </div>

        {/* Footer Actions (Only for Officers on open appeals) */}
        {canAction ? (
          <div className="shrink-0 p-6 sm:px-8 border-t border-slate-100 bg-white space-y-5">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#003624] flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[16px]">rate_review</span>
                Reviewer Remarks
              </label>
              <textarea 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Provide justification, response, or follow-up questions here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[13px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-y min-h-[100px]"
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  onClick={onClose} 
                  className="flex-1 py-3 border border-slate-300 text-slate-500 rounded-xl font-semibold text-[13px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  IGNORE
                </button>
                <button 
                  disabled={isUpdating} 
                  onClick={() => onAction('APPROVED', remarks)} 
                  className="flex-[1.5] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-[13px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isUpdating && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                  APPROVE
                </button>
              </div>
              <button 
                disabled={isUpdating || isRemarksEmpty} 
                onClick={() => onAction('AWAITING_INFO', remarks)} 
                className="w-full py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-semibold text-[13px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                SEND REPLY
              </button>
            </div>
          </div>
        ) : (
          <div className="shrink-0 p-6 border-t border-slate-100 bg-white">
             <button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-[13px] hover:bg-slate-200 transition-all">
               Close Thread
             </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}



