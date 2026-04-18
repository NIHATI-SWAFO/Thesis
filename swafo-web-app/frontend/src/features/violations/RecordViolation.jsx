import React, { useState, useRef, useEffect } from 'react';

export default function RecordViolation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundStudent, setFoundStudent] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // ── State for form fields ──
  const [formData, setFormData] = useState({
    violationType: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    location: '',
    description: '',
    handbookSection: '',
  });

  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [handbookRules, setHandbookRules] = useState([]);
  const [smartSearchQuery, setSmartSearchQuery] = useState('');
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);
  const [smartSearchResults, setSmartSearchResults] = useState([]);
  const fileInputRef = useRef(null);

  // ── Fetch Handbook Rules on Mount ──
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/handbook/rules/');
        if (response.ok) {
          const data = await response.json();
          setHandbookRules(data);
        }
      } catch (error) {
        console.error("Failed to fetch handbook rules:", error);
      }
    };
    fetchRules();
  }, []);

  // ── Live API: Search Student ──
  const [searchResults, setSearchResults] = useState([]);

  // ── Live API: Search Student ──
  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setFoundStudent(null);
    setSearchResults([]);
    setAssessment(null);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/search/?q=${searchQuery}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          if (data.length === 1) {
            setFoundStudent(data[0]);
          } else {
            setSearchResults(data);
          }
        }
      } else {
        console.error("Student not found");
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // ── Live API: Smart Violation Search ──
  const handleSmartSearch = async (val) => {
    setSmartSearchQuery(val);
    if (val.length < 3) {
      setSmartSearchResults([]);
      return;
    }
    setSmartSearchLoading(true);
    
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/handbook/smart-search/?q=${encodeURIComponent(val)}`);
      if (resp.ok) {
        const data = await resp.json();
        setSmartSearchResults(data);
      }
    } catch (error) {
      console.error("Smart search failed:", error);
    } finally {
      setSmartSearchLoading(false);
    }
  };

  // ── Live API: Assess Violation Logic ──
  const handleGenerateRecommendation = async () => {
    if (!formData.violationType || !foundStudent) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/violations/assess/?student_id=${foundStudent.student_number}&rule_code=${formData.violationType}`
      );
      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
      }
    } catch (error) {
      console.error("Assessment failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Live API: Submit Case (Record Violation) ──
  const handleSubmit = async () => {
    if (!foundStudent || !assessment) return;
    setIsSubmitting(true);

    try {
      const selectedRule = handbookRules.find(r => r.rule_code === formData.violationType);
      
      const payload = {
        student: foundStudent.id,
        rule: selectedRule?.id,
        location: formData.location,
        description: formData.description,
        corrective_action: assessment.recommendation,
        status: 'OPEN'
      };

      const response = await fetch('http://127.0.0.1:8000/api/violations/record/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("CASE LOGGED SUCCESSFULLY: The violation has been indexed in the student's permanent record.");
        setFoundStudent(null);
        setAssessment(null);
        setSearchQuery('');
        setFormData({
          violationType: '',
          incidentDate: new Date().toISOString().split('T')[0],
          incidentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          location: '',
          description: '',
          handbookSection: '',
        });
        setEvidenceFiles([]);
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setEvidenceFiles(prev => [...prev, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setEvidenceFiles(prev => [...prev, ...files]);
  };

  return (
    <div className="max-w-[1200px] animate-fade-in-up pb-16 mx-auto px-6">
      {/* ═══════════ SEARCH SECTION ═══════════ */}
      <div className="bg-[#003624] rounded-[2.5rem] p-10 mb-10 text-white relative shadow-2xl">
         <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[300px]">person_search</span>
         </div>
         <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
               <h2 className="text-[24px] font-pjs font-bold mb-2">Identify Student</h2>
                <p className="text-[14px] text-emerald-100/60 font-medium mb-6">Enter the 9-digit student ID or Student Name to retrieve digital identity.</p>
                <div className="flex gap-4 relative">
                   <div className="flex-1 relative">
                     <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600">badge</span>
                     <input 
                       type="text" 
                       placeholder="Enter ID or Student Name..."
                       className="w-full bg-white/10 border border-white/20 rounded-2xl h-[60px] pl-14 pr-5 text-[15px] font-bold text-white placeholder-white/30 outline-none focus:bg-white/20 focus:border-emerald-400 transition-all"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                     />
                   </div>
                   <button onClick={handleSearch} disabled={isSearching} className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold h-[60px] px-8 rounded-2xl transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                     {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined">search</span>}
                     {isSearching ? 'SEARCHING...' : 'SEARCH'}
                   </button>

                   {/* Student Search Results Dropdown */}
                   {searchResults.length > 0 && (
                     <div className="absolute top-[65px] left-0 right-0 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-emerald-100 animate-fade-in mt-2">
                       <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 flex justify-between items-center">
                          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Found {searchResults.length} matches</span>
                          <button onClick={() => setSearchResults([])} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800">CLEAR</button>
                       </div>
                       <div className="max-h-[300px] overflow-y-auto">
                         {searchResults.map((student) => (
                           <button
                             key={student.id}
                             onClick={() => {
                               setFoundStudent(student);
                               setSearchResults([]);
                               setSearchQuery(student.student_number);
                             }}
                             className="w-full flex items-center gap-4 p-4 hover:bg-emerald-50 transition-colors text-left border-b border-gray-50 last:border-0"
                           >
                             <div className="w-10 h-10 rounded-full bg-[#003624] text-white flex items-center justify-center font-bold text-[12px]">
                               {student.user_details?.full_name?.charAt(0)}
                             </div>
                             <div>
                               <p className="text-[14px] font-bold text-[#003624]">{student.user_details?.full_name}</p>
                               <p className="text-[11px] font-medium text-gray-400">{student.student_number} • {student.course}</p>
                             </div>
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
             </div>
             <div className="w-full md:w-[400px]">
               {foundStudent ? (
                  <div className="bg-white rounded-3xl p-6 text-[#003624] flex gap-5 items-center animate-scale-in">
                     <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center relative overflow-hidden shrink-0">
                        <span className="material-symbols-outlined text-[40px] text-slate-300">person</span>
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500"></div>
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="text-[18px] font-pjs font-bold leading-tight uppercase">{foundStudent.user_details?.full_name}</h3>
                           <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
                        </div>
                        <p className="text-[12px] font-bold text-gray-400 mb-2">{foundStudent.student_number}</p>
                        <div className="flex gap-2">
                           <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md tracking-tighter">{foundStudent.course}</span>
                           <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md">{foundStudent.year_level}</span>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                      <span className="material-symbols-outlined text-white/20 text-[48px] mb-2">person_off</span>
                      <p className="text-[12px] text-white/40 font-bold uppercase tracking-widest">No Student Identified</p>
                  </div>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-3 gap-8 items-start">
        <div className="col-span-2">
          <div className="mb-8">
            <h1 className="text-[32px] font-pjs font-extrabold text-[#003624] tracking-tight mb-3">Case Details</h1>
            <p className="text-[14px] text-gray-500 font-manrope font-medium leading-[1.6] max-w-[560px]">
              Complete the situational context below. The Institutional Logic will recommend a sanction based on Section 27.
            </p>
          </div>

          <div className="bg-white border border-[#f1f5f9] rounded-2xl p-8 pb-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] mb-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#10b981]" />
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-[#10b981] text-[24px]">assignment</span>
              <h2 className="text-[18px] font-pjs font-bold text-[#0f172a]">Infraction Context</h2>
            </div>

            <label className="block text-[11px] font-pjs font-black text-[#003624] uppercase tracking-[0.15em] mb-3">
              Violation Type (Smart Search / AI Curator)
            </label>
            <div className="relative mb-6">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#10b981] text-[22px] animate-pulse">auto_awesome</span>
              <input 
                type="text"
                placeholder="Type violation (e.g. 'smoking', 'dress code', 'vandalism')..."
                value={smartSearchQuery}
                onChange={(e) => handleSmartSearch(e.target.value)}
                className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl h-[65px] pl-14 pr-6 text-[14px] font-manrope font-bold text-[#003624] placeholder-emerald-800/30 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
              />
              {smartSearchLoading && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                   <div className="w-5 h-5 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Smart Suggestions */}
            {smartSearchResults.length > 0 && (
              <div className="mb-8 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-400">
                <div className="flex items-center justify-between pl-2 mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recommended Logic Matches</p>
                  <button 
                    onClick={() => setSmartSearchResults([])}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                  >
                    Clear results
                  </button>
                </div>
                
                {smartSearchResults.map((res, index) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, violationType: res.rule_code }));
                      setSmartSearchQuery(`${res.rule_code} — ${res.description.substring(0, 50)}...`);
                      setSmartSearchResults([]);
                    }}
                    className={`w-full group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden ${
                      formData.violationType === res.rule_code 
                        ? 'bg-[#003624] border-[#003624] text-white shadow-[0_8px_30px_rgb(0,54,36,0.15)]' 
                        : 'bg-[#f8fafc]/50 border-[#f1f5f9] text-[#1e293b] hover:border-emerald-200 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    {/* Visual coding for Best Match */}
                    {index === 0 && res.score > 0.7 && formData.violationType !== res.rule_code && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                          High Relevance
                        </div>
                      </div>
                    )}

                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-95 ${
                      formData.violationType === res.rule_code ? 'bg-white/10 text-white' : 'bg-white border border-slate-100 text-[#003624]'
                    }`}>
                      <span className="text-[10px] font-black tracking-tighter">{res.rule_code}</span>
                    </div>

                    <div className="flex-1 pr-14">
                      <p className={`text-[13px] font-bold mb-0.5 leading-snug ${
                        formData.violationType === res.rule_code ? 'text-white' : 'text-[#0f172a]'
                      }`}>
                        {res.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          formData.violationType === res.rule_code ? 'text-emerald-200' : 'text-slate-400'
                        }`}>
                          Handbook Section 27
                        </span>
                      </div>
                    </div>

                    {/* Refined Match Indicator */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1">
                       <div className={`px-2.5 py-1 rounded-full text-[10px] font-black block shadow-sm ${
                         formData.violationType === res.rule_code 
                           ? 'bg-white/10 text-white' 
                           : 'bg-emerald-50 text-emerald-700'
                       }`}>
                         {Math.round(res.score * 100)}% Match
                       </div>
                       <div className={`w-12 h-1 rounded-full overflow-hidden ${
                         formData.violationType === res.rule_code ? 'bg-white/10' : 'bg-slate-100'
                       }`}>
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              formData.violationType === res.rule_code ? 'bg-emerald-300' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.round(res.score * 100)}%` }}
                          />
                       </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <label className="block text-[11px] font-pjs font-black text-[#003624] uppercase tracking-[0.15em] mb-3">Or Select Manually (Full List)</label>
            <div className="relative mb-8">
              <select name="violationType" value={formData.violationType} onChange={handleInputChange} className="w-full bg-gray-50 rounded-xl h-[60px] px-6 pr-12 text-[14px] font-manrope font-semibold text-[#0f172a] outline-none appearance-none cursor-pointer focus:bg-white border border-transparent focus:border-emerald-100 transition-all font-mono">
                <option value="">Select handbook category...</option>
                <optgroup label="Section 27.1 - Minor Offenses">
                  {handbookRules.filter(r => r.rule_code.startsWith('27.1')).map(rule => (
                    <option key={rule.id} value={rule.rule_code}>{rule.rule_code} — {rule.description.substring(0, 100)}...</option>
                  ))}
                </optgroup>
                <optgroup label="Section 27.2 - Major Offenses (Tier 2)">
                   {handbookRules.filter(r => r.rule_code.startsWith('27.2')).map(rule => (
                    <option key={rule.id} value={rule.rule_code}>{rule.rule_code} — {rule.description.substring(0, 100)}...</option>
                  ))}
                </optgroup>
                <optgroup label="Section 27.3 - Major Offenses (Standard)">
                  {handbookRules.filter(r => r.rule_code.startsWith('27.3')).map(rule => (
                    <option key={rule.id} value={rule.rule_code}>{rule.rule_code} — {rule.description.substring(0, 100)}...</option>
                  ))}
                </optgroup>
              </select>
              <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-[24px] pointer-events-none">unfold_more</span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-[11px] font-pjs font-black text-[#003624] uppercase tracking-[0.15em] mb-3">Incident Date</label>
                <input type="date" name="incidentDate" value={formData.incidentDate} onChange={handleInputChange} className="w-full bg-gray-50 border border-transparent focus:border-emerald-100 focus:bg-white rounded-xl h-[60px] px-6 text-[14px] font-manrope font-bold text-gray-700 outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-[11px] font-pjs font-black text-[#003624] uppercase tracking-[0.15em] mb-3">Incident Time</label>
                <input type="time" name="incidentTime" value={formData.incidentTime} onChange={handleInputChange} className="w-full bg-gray-50 border border-transparent focus:border-emerald-100 focus:bg-white rounded-xl h-[60px] px-6 text-[14px] font-manrope font-bold text-gray-700 outline-none transition-all"/>
              </div>
            </div>

            <label className="block text-[11px] font-pjs font-black text-[#003624] uppercase tracking-[0.15em] mb-3">Location / Building</label>
            <div className="relative mb-8">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">pin_drop</span>
              <input type="text" name="location" placeholder="e.g. JFH Building" value={formData.location} onChange={handleInputChange} className="w-full bg-gray-50 border border-transparent focus:border-emerald-100 focus:bg-white rounded-xl h-[60px] pl-14 pr-6 text-[14px] font-manrope font-bold text-gray-700 outline-none transition-all"/>
            </div>

            <label className="block text-[11px] font-pjs font-black text-[#003624] uppercase tracking-[0.15em] mb-3">Description</label>
            <textarea name="description" rows="5" placeholder="Detailed objective account..." value={formData.description} onChange={handleInputChange} className="w-full bg-gray-50 border border-transparent focus:border-emerald-100 focus:bg-white rounded-xl p-6 text-[14px] font-manrope font-semibold text-gray-600 outline-none resize-none leading-relaxed transition-all"/>
          </div>

          {/* Evidence Upload */}
          <div className="bg-[#f2fcf8] rounded-[2rem] p-8 border border-emerald-100 mb-6 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#10b981] text-[24px]">camera_enhance</span>
              <h2 className="text-[18px] font-pjs font-bold text-[#003624]">Digital Evidence</h2>
            </div>
            <div className="border-2 border-dashed border-emerald-200 rounded-[1.5rem] py-16 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#10b981] transition-all bg-white group shadow-sm" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.mp4" onChange={handleFileUpload} className="hidden"/>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#10b981] flex items-center justify-center mb-5 group-hover:scale-110 Transition-transform">
                <span className="material-symbols-outlined text-[28px] font-bold">upload_file</span>
              </div>
              <p className="text-[17px] font-pjs font-bold text-[#0f172a] mb-2">Upload Evidence Logs</p>
              <p className="text-[13px] text-gray-400 font-medium mb-6">Drop incident photos or PDF statements.</p>
              <span className="text-[10px] font-pjs font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-100/50 px-4 py-1.5 rounded-full">MAX PAYLOAD: 50MB</span>
            </div>
          </div>

          {/* Assessment Result */}
          {assessment && (
            <div className="bg-[#003624] rounded-[2rem] p-10 text-white shadow-2xl mb-6 animate-scale-in border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <span className="material-symbols-outlined text-[120px]">psychology</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-400 animate-pulse text-[22px]">auto_awesome</span>
                  </div>
                  <h3 className="text-[12px] font-pjs font-black uppercase tracking-[0.2em] text-emerald-400">Institutional Logic Suggestion</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[16px] font-manrope font-semibold leading-[1.7] text-white tracking-tight">
                    {assessment.rule_code?.startsWith('27.1') ? (
                      <>
                        This is the student's <span className="text-emerald-400 underline decoration-emerald-400/30 underline-offset-4">
                          {(() => {
                            const n = (assessment.total_minor_count || 0) + 1;
                            const s = ["th", "st", "nd", "rd"], v = n % 100;
                            return n + (s[(v - 20) % 10] || s[v] || s[0]);
                          })()} Minor Offense
                        </span> overall.
                      </>
                    ) : (
                      <>This is the <span className="text-emerald-400 underline decoration-emerald-400/30 underline-offset-4">{assessment.instance_number === 1 ? 'First' : assessment.instance_number === 2 ? 'Second' : 'Third+'} Instance</span> of this major rule.</>
                    )}
                  </p>
                  
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                     <p className="text-[12px] font-black text-white/40 uppercase tracking-widest mb-2">Recommended Corrective Action</p>
                     <p className="text-[18px] font-pjs font-extrabold text-[#10b981] leading-tight">
                       {assessment.recommendation || "Consult SWAFO Director"}
                     </p>
                  </div>

                  {assessment.policy_notes && assessment.policy_notes.length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 space-y-2">
                       {assessment.policy_notes.map((note, i) => (
                         <div key={i} className="flex gap-3 text-orange-400 text-[12px] font-bold leading-relaxed">
                            <span className="material-symbols-outlined text-[16px] shrink-0">info</span>
                            {note}
                         </div>
                       ))}
                    </div>
                  )}

                  {assessment.is_repeat_offender && (
                    <div className="flex items-center gap-3 text-emerald-400/60 text-[12px] font-medium py-1">
                       <span className="material-symbols-outlined text-[16px]">info</span>
                       Repeat offense: student has {assessment.instance_number - 1} prior record(s) for this specific code.
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-end items-center gap-6">
                  <button onClick={() => setAssessment(null)} className="text-[12px] font-bold text-white/40 hover:text-white transition-colors underline underline-offset-8">DISCARD DRAFT</button>
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-emerald-500 text-white px-8 py-3 rounded-xl text-[13px] font-pjs font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'LOGGING CASE...' : 'CONFIRM & LOG CASE'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-1 space-y-6 pt-[124px]">
          <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.03)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#10b981]">
                 <span className="material-symbols-outlined text-[26px]">gavel</span>
              </div>
              <h2 className="text-[18px] font-pjs font-bold text-[#003624] tracking-tight">Compliance Protocol</h2>
            </div>
            <ul className="space-y-6">
              {[
                { title: 'Section 27 Logic', text: 'Minor offenses escalate to Major on the 4th occurrence.' },
                { title: 'Sanction Tiers', text: 'Sanctions 1–6 are defined in the student handbook appendix.' },
                { title: 'Repeat Offenders', text: 'System flags cumulative history within the stay.' },
              ].map((tip, i) => (
                <li key={i} className="flex gap-4">
                  <span className="text-[14px] font-pjs font-black text-emerald-200 shrink-0 mt-0.5">0{i+1}</span>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900 mb-1">{tip.title}</p>
                    <p className="text-[11px] text-gray-400 font-medium leading-[1.6]">{tip.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#003624] rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <h3 className="text-[20px] font-pjs font-bold mb-4 leading-tight tracking-tight relative z-10">Institutional Policy Reference</h3>
            <p className="text-[13px] text-emerald-100/40 font-medium leading-[1.7] mb-8 relative z-10">Violations are based on the 2024 Handbook Section 27.</p>
            <button className="w-full bg-[#004d33] border border-white/5 hover:bg-[#005c3d] py-4 rounded-xl text-[12px] font-pjs font-bold transition-all flex items-center justify-center gap-3 tracking-widest text-[#10b981] group relative z-10">DOWNLOAD PDF <span className="material-symbols-outlined text-[20px] group-hover:translate-y-1 Transition-transform">download_for_offline</span></button>
          </div>
        </div>
      </div>

      {!assessment && foundStudent && formData.violationType && (
        <div className="mt-16 flex flex-col items-center">
          <button onClick={handleGenerateRecommendation} disabled={isGenerating} className={`w-full max-w-[800px] h-[72px] rounded-3xl flex items-center justify-center gap-4 font-pjs font-bold text-[18px] tracking-tight transition-all shadow-2xl bg-[#003624] text-white hover:bg-[#004d35] hover:translate-y-[-2px] active:scale-[0.98] shadow-emerald-950/20 disabled:opacity-50`}>
            {isGenerating ? 'CALCULATING...' : <><span className="material-symbols-outlined text-[24px] text-emerald-400">auto_awesome</span> ASSESS CASE & RECOMMEND PENALTY</>}
          </button>
        </div>
      )}
    </div>
  );
}
