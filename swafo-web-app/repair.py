import os

path = 'frontend/src/features/violations/RecordViolation.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

insertion = """
      {/* STEP 3: INCIDENT FORM */}
      {mobileStep === 'form' && foundStudent && (
        <div className="pb-32">
          {/* Top Sticky Profile Header */}
          <div className="bg-[#003624] pt-16 pb-12 px-6 rounded-b-[3rem] text-white relative shadow-xl z-10">
             <button onClick={() => setMobileStep('confirm')} className="absolute top-6 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
               <span className="material-symbols-outlined text-white">arrow_back</span>
             </button>
             <div className="flex flex-col items-center">
                <div className="w-[72px] h-[72px] rounded-[1.2rem] bg-slate-100 border-2 border-emerald-400 flex items-center justify-center mb-4 overflow-hidden shadow-lg">
                  <span className="material-symbols-outlined text-[36px] text-slate-300">person</span>
                </div>
                <p className="text-[9px] font-black text-emerald-400 tracking-[0.2em] uppercase mb-1">Target Student</p>
                <h2 className="text-[24px] font-black leading-tight mb-2 text-center px-4">{foundStudent.user_details?.full_name}</h2>
                <div className="flex items-center gap-3 text-[11px] font-medium text-emerald-100/70 mb-6">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">school</span> {foundStudent.course}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> Year 3</span>
                </div>
                
                <div className="bg-emerald-600/50 border border-emerald-500/30 rounded-2xl px-6 py-3 flex flex-col items-center w-40 shadow-inner">
                  <span className="text-[28px] font-black leading-none mb-1 text-white">{pastViolations.length}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-200">Active Violations</span>
                </div>
             </div>
          </div>

          <div className="px-6 -mt-6 relative z-20 pb-32">
             <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
               <div className="flex flex-col gap-5 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                      <span className="material-symbols-outlined font-black">tune</span>
                    </div>
                    <h3 className="text-[20px] font-black text-[#003624] leading-tight">Incident Parameters</h3>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 w-full">
                      <button type="button" onClick={() => setSearchMode('smart')} className={`flex-1 py-3.5 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${searchMode === 'smart' ? 'bg-[#003624] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Smart Scan</button>
                      <button type="button" onClick={() => setSearchMode('manual')} className={`flex-1 py-3.5 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${searchMode === 'manual' ? 'bg-[#003624] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Manual</button>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Handbook Rule Violation</label>
                    {searchMode === 'smart' ? (
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                          <input type="text" placeholder="Search violation code or keyword..." value={smartSearchQuery} onChange={(e)=>handleSmartSearch(e.target.value)} className="w-full bg-slate-50 h-[60px] rounded-2xl pl-12 pr-4 text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-2 border-emerald-400 transition-all shadow-sm" />
                          {smartSearchResults.length > 0 && (
                            <div className="absolute top-[70px] left-0 right-0 z-[60] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 max-h-[300px] overflow-y-auto animate-in slide-in-from-top-2">
                              {(Array.isArray(smartSearchResults) ? smartSearchResults : []).map(res => (
                                <button key={res.id} type="button" onClick={() => { setFormData(prev => ({...prev, violationType: res.rule_code})); setSmartSearchQuery(res.rule_code); setSmartSearchResults([]); }} className="w-full p-5 text-left border-b border-slate-50 text-[13px] font-bold text-slate-700 active:bg-slate-50">
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md inline-block mb-1">{res.rule_code}</span>
                                  <p className="leading-snug">{res.description}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                    ) : (
                        <div className="relative">
                          <select name="violationType" value={formData.violationType} onChange={handleInputChange} className="w-full bg-slate-50 h-[60px] rounded-2xl px-4 text-[13px] font-bold text-slate-700 outline-none appearance-none shadow-sm focus:bg-white focus:border-2 border-emerald-400 transition-all">
                            <option value="">Select Handbook Rule...</option>
                            {(Array.isArray(handbookRules) ? handbookRules : []).map(r => <option key={r.id} value={r.rule_code}>[{r.rule_code}] {r.description ? r.description.substring(0, 40) : 'No description'}...</option>)}
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                        </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date of Incident</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">calendar_today</span>
"""

target_idx = -1
for i in range(910, 930):
    if lines[i].strip() == ")}":
        target_idx = i
        break

if target_idx != -1:
    lines.insert(target_idx + 1, insertion + '\n')
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully repaired file")
else:
    print("Could not find insertion point!")
