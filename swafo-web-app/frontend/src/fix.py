import re
with open('features/violations/StudentViolations.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import json
content_split = content.split('      {showModal && createPortal(')
base_content = content_split[0]

modal_content = """      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleCloseModal}></div>
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-emerald-900/10 animate-in zoom-in-95 duration-300 overflow-hidden">
            
            {!isAppealing ? (
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[32px] font-bold">gavel</span>
                </div>
                <h2 className="text-[24px] font-pjs font-extrabold text-[#003624] mb-2 tracking-tight">Case Details</h2>
                <p className="text-[14px] text-slate-500 font-manrope leading-relaxed mb-8 max-w-[340px]">
                  This record is currently in the <span className="font-bold text-[#003624]">Institutional Workflow</span>. You may request an appeal or monitor for updates.
                </p>
                <div className="w-full space-y-3">
                  <button 
                    onClick={() => setIsAppealing(true)} 
                    className="w-full h-[65px] bg-[#003624] text-white rounded-2xl font-pjs font-black text-[13px] uppercase tracking-[0.2em] hover:bg-[#004d33] transition-all shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
                  >
                    Initiate Appeal (In-App)
                  </button>
                  <button onClick={handleCloseModal} className="w-full h-[65px] border-2 border-slate-100 text-slate-600 rounded-2xl font-pjs font-bold text-[13px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-[0.98]">Close Details</button>
                </div>
              </div>
            ) : appealSuccess ? (
              <div className="flex flex-col items-center text-center relative z-10 py-4">
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[40px]">check_circle</span>
                </div>
                <h2 className="text-[24px] font-pjs font-extrabold text-[#003624] mb-2">Appeal Submitted</h2>
                <p className="text-[14px] text-slate-500 font-manrope mb-8">
                  Your appeal has been securely forwarded to the SWAFO authorities.
                </p>
                <button onClick={handleCloseModal} className="w-full h-[60px] bg-[#003624] text-white rounded-2xl font-pjs font-black text-[13px] uppercase tracking-widest hover:bg-[#004d33] transition-all">Done</button>
              </div>
            ) : (
              <div className="flex flex-col relative z-10">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <button onClick={() => setIsAppealing(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <div>
                    <h2 className="text-[18px] font-pjs font-extrabold text-[#003624]">Submit Appeal</h2>
                    <p className="text-[12px] text-slate-500 font-manrope">Reference: {selectedViolation?.id}</p>
                  </div>
                </div>
                
                <form onSubmit={handleAppealSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Briefly state your reason..."
                      value={appealData.subject}
                      onChange={e => setAppealData({...appealData, subject: e.target.value})}
                      className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-[#003624] outline-none focus:ring-2 focus:ring-[#2bd99b] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                    <select disabled className="w-full bg-slate-100 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-500 outline-none appearance-none cursor-not-allowed">
                      <option>Violation Appeal</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detailed Description</label>
                    <textarea 
                      required
                      placeholder="Provide your justification here..."
                      value={appealData.description}
                      onChange={e => setAppealData({...appealData, description: e.target.value})}
                      rows="4"
                      className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#2bd99b] transition-all resize-none"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmittingAppeal}
                    className="w-full h-[60px] mt-4 bg-[#006b5d] text-white rounded-2xl font-pjs font-black text-[13px] uppercase tracking-widest hover:bg-[#004d33] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSubmittingAppeal ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">send</span>}
                    Submit Securely
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
"""

with open('features/violations/StudentViolations.jsx', 'w', encoding='utf-8') as f:
    f.write(base_content + modal_content)
