import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_ENDPOINTS } from '../../api/config';
import { useAuth } from '../../context/AuthContext';

export default function RecordViolation() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [foundStudent, setFoundStudent] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [pastViolations, setPastViolations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [formData, setFormData] = useState({
    violationType: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    location: '',
    description: '',
  });

  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [handbookRules, setHandbookRules] = useState([]);
  const [smartSearchQuery, setSmartSearchQuery] = useState('');
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);
  const [smartSearchResults, setSmartSearchResults] = useState([]);
  const [searchMode, setSearchMode] = useState('smart'); // 'smart' or 'manual'
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef(null);
  const fileInputRef = useRef(null);
  const resultRef = useRef(null);

  const [mobileStep, setMobileStep] = useState('scan'); // 'scan', 'manual', 'confirm', 'form'
  const [showScannerModal, setShowScannerModal] = useState(false);

  const simulateScan = async () => {
    setIsSearching(true);
    try {
      // For simulation, we just search for "202" to grab a random valid student from the DB
      const response = await fetch(`${API_ENDPOINTS.SEARCH_USERS}?q=202`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setFoundStudent(data[0]);
          fetchStudentHistory(data[0].user_details?.email);
          setMobileStep('confirm');
          setShowScannerModal(false);
        } else {
          alert('Simulation failed: No students found matching "202". Please enter manually.');
          setMobileStep('manual');
        }
      }
    } catch (e) {
      console.error(e);
      setMobileStep('manual');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.HANDBOOK_RULES);
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

  const fetchStudentHistory = async (studentEmail) => {
    if (!studentEmail) return;
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.VIOLATIONS_LIST}?email=${studentEmail}`);
      if (response.ok) {
        const data = await response.json();
        setPastViolations(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const [searchResults, setSearchResults] = useState([]);

  // Live Search Effect (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.SEARCH_USERS}?q=${searchQuery}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSmartSearch = async (val) => {
    setSmartSearchQuery(val);
    const query = val.trim();
    if (query.length < 3) {
      setSmartSearchResults([]);
      return;
    }
    setSmartSearchLoading(true);
    try {
      const resp = await fetch(`${API_ENDPOINTS.SMART_SEARCH}?q=${encodeURIComponent(query)}`);
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

  const handleGenerateRecommendation = async () => {
    if (!formData.violationType || !foundStudent) return;
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.VIOLATIONS_ASSESS}?student_id=${foundStudent.student_number}&rule_code=${formData.violationType}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } catch (error) {
      console.error("Assessment failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastLoggedId, setLastLoggedId] = useState(null);

  useEffect(() => {
    if (assessment?.is_duplicate) {
      setShowDuplicateWarning(true);
    }
  }, [assessment]);

  const handleSubmit = async () => {
    if (!foundStudent || !assessment) return;
    setIsSubmitting(true);
    try {
      const selectedRule = handbookRules.find(r => r.rule_code === formData.violationType);
      if (!selectedRule) {
        alert("ERROR: Rule not found.");
        setIsSubmitting(false);
        return;
      }
      const payload = {
        student: foundStudent.id,
        rule: selectedRule.id,
        location:      formData.location,      // legacy free-text
        location_name: formData.location,      // normalized key → auto-populates lat/lng
        description: formData.description,
        corrective_action: assessment.recommendation,
        officer_email: user?.email, 
        status: 'OPEN'
      };
      const response = await fetch(API_ENDPOINTS.VIOLATIONS_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        setLastLoggedId(result.id);
        setShowSuccess(true);
        fetchStudentHistory(foundStudent.user_details?.email);
      } else {
        const errorData = await response.json();
        alert(`FAILED: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setAssessment(null);
    setFormData({
      violationType: '',
      incidentDate: new Date().toISOString().split('T')[0],
      incidentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      location: '',
      description: '',
    });
    setSmartSearchQuery('');
    setEvidenceFiles([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Exact DLSUD_LOCATIONS keys from locations.py — used as API fallback ──
  const CAMPUS_LOCATIONS_FALLBACK = {
    "Gates & Entry Points": [
      "Gate 3",
      "Magdalo Gate",
    ],
    "Academic Buildings": [
      "CTH Building A",
      "CTH Building B",
      "Doctor Fe Del Mundo Hall",
      "Doña Marcela Agoncillo Hall",
      "Felipe Calderon Hall",
      "Francisco Barzaga Hall",
      "Gregoria De Jesus Hall",
      "ICTC Building",
      "Julian Felipe Hall",
      "Ladislao Diwa Hall",
      "LDH Kubo",
      "Maria Salome Llanera Hall",
      "Mariano Alvarez Hall",
      "Mariano Trias Hall",
      "MTH Covered Court",
      "Paulo Campos Hall",
      "Santiago Alvarez Hall",
      "Severino de las Alas Hall",
      "Vito Belarmino Hall",
    ],
    "High School Area": [
      "Basic Education Covered Court",
      "DLSU-D High School",
      "De La Salle University - Dasmariñas High School Complex",
      "High School Annex Building",
      "High School Chapel",
    ],
    "Facilities & Landmarks": [
      "Botanical Garden Park",
      "DLSU-D Grandstand",
      "GMH Quadrangle",
      "Guest House",
      "Ladies Dormitory Complex",
      "Motor Pool",
      "Residencia La Salle",
      "Ugnayang La Salle",
      "University Student Government",
    ],
    "Library & Cultural": [
      "Aklatang Emilio Aguinaldo",
      "Ayuntamiento",
      "Ayuntamiento De Gonzalez",
      "Museo De La Salle",
      "Rizal Library",
    ],
    "Chapel & Religious": [
      "Antonio and Victoria Cojuanco Memorial Chapel of Our Lady of the Holy Rosary",
      "La Porteria De San Benildo",
    ],
    "Health & Services": [
      "University Clinic",
    ],
    "Food & Canteen Area": [
      "Cafe Museo",
      "Food Square Extension",
      "University Food Square",
    ],
    "Parking": [
      "DLSU-D Faculty/Staff Parking",
      "DLSU-D Student/Faculty/Staff Parking",
      "High School Parking",
    ],
  };

  // API-backed location groups — falls back to hardcoded if API unavailable
  const [CAMPUS_LOCATIONS, setCampusLocations] = useState(CAMPUS_LOCATIONS_FALLBACK);

  useEffect(() => {
    fetch(`${API_ENDPOINTS.VIOLATIONS_LOCATIONS || 'http://127.0.0.1:8000/api/violations/locations'}?grouped=true`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.locations && typeof data.locations === 'object' && !Array.isArray(data.locations)) {
          setCampusLocations(data.locations);
        }
      })
      .catch(() => { /* silently use fallback */ });
  }, []);

  const filteredLocations = () => {
    const query = locationSearchQuery.toLowerCase();
    if (!query) return CAMPUS_LOCATIONS;
    
    const filtered = {};
    Object.keys(CAMPUS_LOCATIONS).forEach(cat => {
      const matches = CAMPUS_LOCATIONS[cat].filter(loc =>
        loc.toLowerCase().includes(query)
      );
      if (matches.length > 0) filtered[cat] = matches;
    });
    return filtered;
  };

  return (
    <>
    {/* DESKTOP LAYOUT */}
    <div className="hidden lg:block max-w-[1200px] animate-fade-in-up pb-16 mx-auto px-6 font-pjs">
      {/* HEADER SECTION - REFINED */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#003624] flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/20">
              <span className="material-symbols-outlined text-[24px] font-bold">assignment_add</span>
            </div>
            <h1 className="text-[36px] font-black text-[#003624] tracking-tight leading-none">Record Violation</h1>
          </div>
          <p className="text-[15px] text-slate-400 font-medium ml-1">Official Institutional Incident Logging & Escalation Portal</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session Authority</p>
              <p className="text-[13px] font-bold text-[#003624]">{user?.email || 'Unauthorized'}</p>
           </div>
        </div>
      </div>

      {/* STUDENT IDENTIFICATION - GLASS DESIGN */}
      <div className="bg-[#003624] rounded-[3rem] p-10 mb-10 text-white relative shadow-[0_30px_100px_rgba(0,54,36,0.25)]">
         <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[400px]">history_edu</span>
         </div>
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)]"></div>
         
         <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 w-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <span className="material-symbols-outlined text-[18px] text-emerald-400 font-bold">person_search</span>
                  </div>
                  <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-emerald-100/60">Target Student Lookup</h2>
                </div>
                <div className="flex gap-4 relative">
                   <div className="flex-1 relative group">
                     <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 group-focus-within:text-emerald-300 transition-all">search</span>
                     <input 
                       type="text" 
                       placeholder="Enter Student Number or Full Name..."
                       className="w-full bg-white/5 border-2 border-white/10 rounded-[2rem] h-[72px] pl-16 pr-6 text-[16px] font-bold text-white placeholder-white/20 outline-none focus:bg-white/10 focus:border-emerald-400 transition-all shadow-inner"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                     />
                   </div>
                   <button onClick={handleSearch} disabled={isSearching} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black h-[72px] px-10 rounded-[2rem] transition-all active:scale-95 flex items-center gap-3 shadow-[0_15px_35px_rgba(16,185,129,0.3)] disabled:opacity-50 tracking-widest text-[13px]">
                     {isSearching ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : 'FETCH PROFILE'}
                   </button>
                   <button onClick={() => setShowScannerModal(true)} className="bg-white/10 hover:bg-white/20 text-emerald-100 font-black h-[72px] px-8 rounded-[2rem] transition-all active:scale-95 flex items-center justify-center border border-white/20 shrink-0">
                     <span className="material-symbols-outlined">qr_code_scanner</span>
                   </button>
                   
                   {/* Search Results Dropdown - Premium */}
                   {searchResults.length > 0 && (
                     <div className="absolute top-[85px] left-0 right-0 bg-white rounded-[2rem] shadow-[0_30px_90px_rgba(0,0,0,0.3)] z-[100] overflow-hidden border border-emerald-100 mt-2 animate-in slide-in-from-top-4 duration-300">
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          {searchResults.map(s => (
                            <button key={s.id} onClick={() => { setFoundStudent(s); setSearchResults([]); fetchStudentHistory(s.user_details?.email); }} className="w-full flex items-center gap-5 p-6 hover:bg-emerald-50 transition-all text-left border-b border-slate-50 last:border-0 group">
                              <div className="w-14 h-14 rounded-2xl bg-[#003624] text-white flex items-center justify-center font-black text-[18px] group-hover:scale-110 transition-transform shadow-lg">{s.user_details?.full_name?.charAt(0)}</div>
                              <div className="flex-1">
                                <p className="text-[16px] font-black text-[#003624] leading-none mb-1">{s.user_details?.full_name}</p>
                                <p className="text-[12px] font-bold text-slate-400 tracking-tight">{s.student_number} • {s.course}</p>
                              </div>
                              <span className="material-symbols-outlined text-emerald-600 opacity-0 group-hover:opacity-100 transition-all">arrow_forward_ios</span>
                            </button>
                          ))}
                        </div>
                     </div>
                   )}
                </div>
            </div>

            {/* Profile Glance Card */}
            <div className="w-full lg:w-[360px] shrink-0">
               {foundStudent ? (
                  <div className="bg-white rounded-[2.5rem] p-6 text-[#003624] flex gap-5 items-center animate-in zoom-in-95 duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white">
                     <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 relative">
                        <span className="material-symbols-outlined text-[42px] text-slate-200">person</span>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white"></div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Identified Subject</p>
                        <h3 className="text-[16px] font-black leading-tight uppercase truncate mb-1">{foundStudent.user_details?.full_name}</h3>
                        <div className="flex flex-wrap gap-2">
                           <span className="text-[10px] font-black px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg uppercase border border-emerald-100">{foundStudent.student_number}</span>
                           <span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-600 rounded-lg uppercase">{foundStudent.course}</span>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="bg-white/5 border-2 border-white/10 border-dashed rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-white/10 text-[48px] mb-2 font-light">account_circle_off</span>
                    <p className="text-[11px] text-white/30 font-black uppercase tracking-[0.25em]">Pending Identification</p>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* MAIN CONTENT GRID - REFINED PROPORTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-10">
        
        {/* INFRACTION FORM - LEFT SIDE */}
        <div className="lg:col-span-7 space-y-8">
           <div className="bg-white rounded-[3rem] p-10 shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#003624]"></div>
              
              <div className="flex items-center gap-3 mb-10">
                <h2 className="text-[24px] font-black text-[#003624] tracking-tight">Incident Parameters</h2>
                <div className="h-px bg-slate-100 flex-1 ml-4"></div>
              </div>

              <div className="space-y-8">
                {/* Rule Search */}
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-[11px] font-black text-[#003624]/40 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">policy</span>
                      Handbook Rule Reference
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                      <button 
                        onClick={() => setSearchMode('smart')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${searchMode === 'smart' ? 'bg-[#003624] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Smart
                      </button>
                      <button 
                        onClick={() => setSearchMode('manual')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${searchMode === 'manual' ? 'bg-[#003624] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>

                  {searchMode === 'smart' ? (
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">auto_fix_high</span>
                      <input 
                        type="text" 
                        placeholder="Smart search (e.g. 'smoking', 'uniform', 'noise')..." 
                        value={smartSearchQuery} 
                        onChange={(e) => handleSmartSearch(e.target.value)} 
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl h-[64px] pl-14 pr-4 text-[15px] font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-100 focus:shadow-lg focus:shadow-emerald-950/5 transition-all" 
                      />
                      {smartSearchResults.length > 0 && (
                        <div className="absolute top-[75px] left-0 right-0 z-[110] bg-white rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                          <div className="max-h-[400px] overflow-y-auto custom-scrollbar-emerald">
                            {(Array.isArray(smartSearchResults) ? smartSearchResults : []).map(res => (
                              <button key={res.id} onClick={() => { setFormData(prev => ({ ...prev, violationType: res.rule_code })); setSmartSearchQuery(res.rule_code); setSmartSearchResults([]); }} className="w-full p-6 hover:bg-emerald-50 text-left border-b border-slate-50 last:border-0 group transition-all">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{res.rule_code}</span>
                                  <span className="text-[10px] font-bold text-slate-300 uppercase">{Math.round(res.score * 100)}% Match</span>
                                </div>
                                <p className="text-[14px] font-bold text-slate-700 leading-tight group-hover:text-[#003624] transition-colors">{res.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">list_alt</span>
                      <select 
                        name="violationType"
                        value={formData.violationType}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl h-[64px] pl-14 pr-4 text-[15px] font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-100 focus:shadow-lg focus:shadow-emerald-950/5 transition-all appearance-none"
                      >
                        <option value="">Select Handbook Rule...</option>
                        {handbookRules.map(rule => (
                          <option key={rule.id} value={rule.rule_code}>
                            [{rule.rule_code}] {rule.description.substring(0, 80)}...
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black text-[#003624]/40 uppercase tracking-[0.2em] mb-3">Incident Date</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[20px]">event</span>
                      <input type="date" name="incidentDate" value={formData.incidentDate} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl h-[60px] pl-12 pr-4 text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 ring-emerald-50 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-[#003624]/40 uppercase tracking-[0.2em] mb-3">Logging Time</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[20px]">alarm</span>
                      <input type="time" name="incidentTime" value={formData.incidentTime} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl h-[60px] pl-12 pr-4 text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 ring-emerald-50 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="relative" ref={locationRef}>
                  <label className="block text-[11px] font-black text-[#003624]/40 uppercase tracking-[0.2em] mb-3">Precise Location</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">share_location</span>
                    <input 
                      type="text" 
                      name="location" 
                      placeholder="Search campus building or gate..." 
                      value={locationSearchQuery || formData.location} 
                      onFocus={() => setShowLocationDropdown(true)}
                      onChange={(e) => {
                        setLocationSearchQuery(e.target.value);
                        setFormData(prev => ({ ...prev, location: e.target.value }));
                        setShowLocationDropdown(true);
                      }} 
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl h-[64px] pl-14 pr-4 text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-100 focus:shadow-lg focus:shadow-emerald-950/5 transition-all" 
                    />
                    {showLocationDropdown && (
                      <div className="absolute top-[75px] left-0 right-0 z-[120] bg-white rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar-emerald">
                          {Object.keys(filteredLocations()).length > 0 ? (
                            Object.entries(filteredLocations()).map(([campus, items]) => (
                              <div key={campus}>
                                <div className="bg-slate-50/50 px-6 py-2 border-y border-slate-100">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{campus}</p>
                                </div>
                                {items.map(loc => (
                                  <button 
                                    key={loc}
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, location: loc }));
                                      setLocationSearchQuery(loc);
                                      setShowLocationDropdown(false);
                                    }}
                                    className="w-full px-6 py-4 hover:bg-emerald-50 text-left text-[14px] font-bold text-slate-600 transition-all border-b border-slate-50 last:border-0"
                                  >
                                    {loc}
                                  </button>
                                ))}
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                               <p className="text-[13px] font-bold text-slate-400 italic mb-2">Location not in directory</p>
                               <button 
                                 onClick={() => setShowLocationDropdown(false)}
                                 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-lg"
                               >
                                 Use Manual Entry: "{locationSearchQuery}"
                               </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[#003624]/40 uppercase tracking-[0.2em] mb-3">Contextual Remarks</label>
                  <textarea name="description" rows="4" placeholder="Objectively describe the observed behavior and situational factors..." value={formData.description} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-[15px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 ring-emerald-50 transition-all resize-none leading-relaxed" />
                </div>

                {/* Evidence & Media Upload */}
                <div>
                  <label className="block text-[11px] font-black text-[#003624]/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">attachment</span>
                    Incident Evidence & Media
                  </label>
                  <div className="space-y-4">
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={(e) => setEvidenceFiles(prev => [...prev, ...Array.from(e.target.files)])}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                        <span className="material-symbols-outlined">add_a_photo</span>
                      </div>
                      <span className="text-[12px] font-bold text-slate-400 group-hover:text-emerald-600">Attach Evidence Files (Photos, Docs)</span>
                    </button>

                    {evidenceFiles.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {evidenceFiles.map((file, idx) => (
                          <div key={idx} className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-3 animate-in zoom-in-95">
                            <span className="material-symbols-outlined text-[18px] text-emerald-600">image</span>
                            <span className="text-[11px] font-black text-emerald-800 truncate max-w-[150px] uppercase tracking-tight">{file.name}</span>
                            <button 
                              onClick={() => setEvidenceFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {!assessment && (
                  <button onClick={handleGenerateRecommendation} disabled={isGenerating || !foundStudent || !formData.violationType} className="w-full h-[72px] bg-[#003624] text-white rounded-[2rem] font-black text-[15px] hover:bg-[#004d35] transition-all flex items-center justify-center gap-4 shadow-[0_20px_60px_rgba(0,54,36,0.2)] active:scale-[0.98] disabled:opacity-30 tracking-[0.1em]">
                    {isGenerating ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[24px] text-emerald-400">psychology</span> RUN ASSESSMENT ENGINE</>}
                  </button>
                )}
              </div>
           </div>
        </div>

        {/* HISTORY TIMELINE - RIGHT SIDE */}
        <div className="lg:col-span-5 flex flex-col gap-8">
           
           {/* Summary Bento Box */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-full bg-emerald-50 opacity-30 skew-x-[-20deg] translate-x-12"></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conduct Standing</p>
                <div className="flex items-center gap-3">
                   <h4 className="text-[28px] font-black text-[#003624] leading-none">{pastViolations.length}</h4>
                   <span className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Logged Incidents</span>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${pastViolations.length > 3 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                 {pastViolations.length > 3 ? 'High Risk' : 'Standard'}
              </div>
           </div>

           {/* Real Timeline */}
           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col h-full max-h-[700px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-20">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                       <span className="material-symbols-outlined font-bold">timeline</span>
                    </div>
                    <h3 className="text-[18px] font-black text-[#003624] tracking-tight">Institutional Record</h3>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar-emerald space-y-6 pr-4 relative z-0">
                 {foundStudent ? (
                   historyLoading ? (
                     <div className="py-20 text-center flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-3 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Querying History...</p>
                     </div>
                   ) : pastViolations.length > 0 ? (
                     pastViolations.map((v, idx) => (
                       <div key={v.id} className="relative pl-8 group">
                          {/* Timeline Line */}
                          {idx !== pastViolations.length - 1 && <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-slate-100 group-hover:bg-emerald-100 transition-colors"></div>}
                          {/* Timeline Dot */}
                          <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center group-hover:border-emerald-400 transition-all shadow-sm z-10">
                             <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-emerald-500 transition-all"></div>
                          </div>
                          
                          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-lg group-hover:shadow-emerald-950/5 group-hover:border-emerald-100 transition-all">
                             <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${v.rule_details?.category?.includes('Minor') ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                   {v.rule_details?.rule_code}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                             </div>
                             <h5 className="text-[14px] font-bold text-slate-800 leading-snug mb-3 group-hover:text-[#003624] transition-colors">{v.rule_details?.description}</h5>
                             <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400 italic">
                                <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">location_on</span>{v.location}</div>
                             </div>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="py-20 text-center flex flex-col items-center gap-4 opacity-40">
                        <span className="material-symbols-outlined text-[48px] font-light">verified</span>
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest leading-none">Clean Record • Exemplary Conduct</p>
                     </div>
                   )
                 ) : (
                   <div className="py-24 text-center flex flex-col items-center gap-6">
                      <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center border border-slate-100">
                         <span className="material-symbols-outlined text-[28px] text-slate-200">contact_support</span>
                      </div>
                      <p className="text-[13px] font-medium text-slate-400 max-w-[200px] leading-relaxed italic">Select a student profile to load institutional context.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* ASSESSMENT RESULT - PREMIUM OVERLAY */}
      {assessment && (
        <div ref={resultRef} className="bg-[#003624] rounded-[4rem] p-12 text-white shadow-[0_50px_120px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom-12 duration-700 border-4 border-white/5 relative overflow-hidden mb-12">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-[2] pointer-events-none">
             <span className="material-symbols-outlined text-[150px]">gavel</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(16,185,129,0.05),transparent)] animate-spin-slow"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <span className="material-symbols-outlined text-emerald-400 text-[32px] animate-pulse">verified_user</span>
              </div>
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1 leading-none">Final Assessment Engine Output</h3>
                <p className="text-[16px] font-medium text-emerald-100/40">Verified against University Disciplinary Policy v2.4</p>
              </div>
            </div>

            {/* DUPLICATE WARNING BANNER */}
            {assessment.is_duplicate && (
              <div className="mb-10 p-8 bg-orange-500/20 border-2 border-orange-500/50 rounded-[2.5rem] flex items-center gap-8 animate-in slide-in-from-left-8 duration-500">
                <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-900/40 shrink-0">
                  <span className="material-symbols-outlined text-[28px] fill-1">warning</span>
                </div>
                <div className="flex-1">
                   <h4 className="text-[18px] font-black text-orange-200 uppercase tracking-tight mb-1 leading-none">Duplicate Incident Detected</h4>
                   <p className="text-[14px] text-orange-100/70 font-medium leading-relaxed">This specific violation has already been logged for this student within the current observation period. Please verify if this is a separate occurrence before proceeding.</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-between group hover:bg-white/10 transition-all">
                 <div>
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Escalation Logic Result</p>
                    <p className="text-[24px] font-black text-white leading-tight mb-2 tracking-tight">
                       {assessment.rule_code?.startsWith('27.1') ? `Violation #${(assessment.total_minor_count || 0) + 1}` : `Instance #${assessment.instance_number}`}
                    </p>
                    <p className="text-[14px] font-bold text-emerald-100/50 uppercase tracking-widest">
                       {assessment.rule_code?.startsWith('27.1') ? 'MINOR CATEGORY ESCALATION' : 'MAJOR CATEGORY VIOLATION'}
                    </p>
                 </div>
              </div>
              <div className="bg-emerald-500 rounded-[2.5rem] p-10 shadow-[0_20px_60px_rgba(16,185,129,0.4)] flex flex-col justify-between group hover:scale-[1.02] transition-all">
                 <div>
                    <p className="text-[11px] font-black text-emerald-950/40 uppercase tracking-[0.2em] mb-4">Mandated Sanction</p>
                    <p className="text-[32px] font-black text-[#003624] leading-tight tracking-tighter">
                       {assessment.recommendation}
                    </p>
                 </div>
                 <div className="mt-6 flex items-center gap-2 text-[#003624]/60">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                    <span className="text-[11px] font-black uppercase tracking-widest">Handbook Page {assessment.rule_code?.substring(0, 4) || 'Ref'}</span>
                 </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-end items-center gap-8 pt-10 border-t border-white/10">
              <button onClick={() => setAssessment(null)} className="text-[14px] font-black text-white/30 hover:text-white transition-all tracking-[0.2em] uppercase active:scale-95">Discard Entry</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="w-full md:w-auto bg-white text-[#003624] px-14 py-5 rounded-[2rem] text-[16px] font-black hover:bg-emerald-50 transition-all shadow-[0_15px_40px_rgba(255,255,255,0.1)] active:scale-[0.98] tracking-widest">
                {isSubmitting ? 'ENCRYPTING & LOGGING...' : 'COMMIT TO INSTITUTIONAL RECORD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS DIALOG - PORTAL */}
      {showSuccess && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-[#003624]/70 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[4rem] w-full max-w-[540px] p-10 md:p-14 text-center shadow-[0_50px_150px_rgba(0,0,0,0.5)] border border-white/20 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            
            <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-inner">
               <span className="material-symbols-outlined text-[48px] font-bold animate-bounce-slow">verified</span>
            </div>
            
            <h2 className="text-[28px] md:text-[32px] font-black text-[#003624] mb-3 tracking-tighter leading-none">Incident Securely Logged</h2>
            <p className="text-[10px] md:text-[12px] font-black text-emerald-600/60 uppercase tracking-[0.3em] mb-10">Permanent Reference: SW-{lastLoggedId?.toString().padStart(4, '0')}</p>
            
            <div className="bg-slate-50 rounded-[2.5rem] p-6 md:p-8 mb-12 text-left border border-slate-100 shadow-inner group">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Actioned Sanction</p>
               <p className="text-[18px] md:text-[22px] font-black text-[#003624] leading-tight group-hover:text-emerald-700 transition-colors">{assessment?.recommendation}</p>
               <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500">task_alt</span>
                  <span className="text-[11px] font-bold text-slate-500">Automated Parent/Guardian Notification Queued</span>
               </div>
            </div>
            
            <button onClick={handleCloseSuccess} className="w-full h-[76px] bg-[#003624] text-white rounded-[2rem] font-black text-[13px] md:text-[15px] uppercase tracking-[0.2em] hover:bg-[#004d35] transition-all shadow-[0_15px_40px_rgba(0,54,36,0.3)] active:scale-[0.98]">Dismiss & Start New Session</button>
          </div>
        </div>, document.body
      )}

      {/* DESKTOP SCANNER MODAL */}
      {showScannerModal && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md">
           <div className="bg-white w-[500px] rounded-[3rem] p-10 flex flex-col items-center relative animate-in zoom-in-95">
              <button onClick={() => setShowScannerModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500">
                 <span className="material-symbols-outlined">close</span>
              </button>
              <h2 className="text-[24px] font-black text-[#003624] mb-2">Scan Student ID Barcode</h2>
              <p className="text-[13px] text-slate-500 mb-8">Align the barcode within the frame</p>
              
              <div className="relative w-full aspect-video bg-slate-800 rounded-3xl overflow-hidden mb-8 shadow-inner flex items-center justify-center">
                 <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center mix-blend-luminosity"></div>
                 <span className="material-symbols-outlined text-[48px] text-white/40 z-10">qr_code_scanner</span>
                 <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-[140px] border-2 border-emerald-400/50 rounded-2xl z-10 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,1)] animate-scan"></div>
                 </div>
              </div>

              <button onClick={simulateScan} className="bg-[#003624] text-white font-black px-8 py-5 rounded-2xl flex items-center gap-3 w-full justify-center hover:bg-[#004d35] transition-all">
                 <span className="material-symbols-outlined">photo_camera</span> SIMULATE SCAN (TEST ONLY)
              </button>
           </div>
        </div>, document.body
      )}

    </div>

    {/* MOBILE LAYOUT (WIZARD) */}
    <div className="block lg:hidden min-h-screen bg-slate-50 font-pjs pb-24">
      {/* STEP 1: SCANNER */}
      {mobileStep === 'scan' && (
        <div className="flex flex-col items-center pt-16 px-6">
           <p className="text-[10px] font-black text-emerald-600 tracking-[0.2em] uppercase mb-2">Detection Active</p>
           <h2 className="text-[28px] font-black text-[#003624] leading-tight mb-2 text-center">Scan Student ID<br/>Barcode</h2>
           <p className="text-[13px] text-slate-500 font-medium mb-10 text-center">Align the barcode within the emerald frame</p>
           
           <div className="relative w-full max-w-[320px] aspect-[4/5] bg-slate-800 rounded-[2.5rem] overflow-hidden mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
             <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center mix-blend-luminosity"></div>
             <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[140px] border-4 border-emerald-400 rounded-3xl z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,1)] animate-scan"></div>
             </div>
           </div>

           <button onClick={simulateScan} className="w-16 h-16 rounded-full bg-[#003624] flex items-center justify-center text-white shadow-xl shadow-emerald-900/20 active:scale-95 transition-all mb-12">
             <span className="material-symbols-outlined text-[28px]">photo_camera</span>
           </button>

           <div className="flex flex-col items-center w-full">
             <button onClick={() => setMobileStep('manual')} className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shadow-sm active:scale-95 transition-all mb-3">
               <span className="material-symbols-outlined text-[28px]">keyboard</span>
             </button>
             <p className="text-[12px] font-bold text-[#003624]">Enter Student ID Manually</p>
           </div>
        </div>
      )}

      {/* STEP 1.5: MANUAL ENTRY */}
      {mobileStep === 'manual' && (
         <div className="flex flex-col items-center pt-16 px-6">
           <button onClick={() => setMobileStep('scan')} className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
             <span className="material-symbols-outlined">arrow_back</span>
           </button>
           <h2 className="text-[28px] font-black text-[#003624] mb-8 text-center mt-6">Manual Lookup</h2>
           <div className="w-full relative mb-6">
             <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
             <input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&handleSearch()} placeholder="Student ID or Name..." className="w-full h-16 bg-white rounded-2xl pl-14 pr-6 text-[16px] font-bold outline-none border border-slate-200 focus:border-emerald-500 shadow-sm" />
           </div>
           <button onClick={handleSearch} disabled={isSearching} className="w-full h-16 bg-[#003624] text-white font-black rounded-2xl flex items-center justify-center tracking-widest text-[14px] active:scale-95 transition-all">
             {isSearching ? 'SEARCHING...' : 'FETCH PROFILE'}
           </button>

           {searchResults.length > 0 && (
             <div className="w-full mt-8 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                {searchResults.map(s => (
                  <button key={s.id} onClick={() => { setFoundStudent(s); fetchStudentHistory(s.user_details?.email); setSearchResults([]); setMobileStep('confirm'); }} className="w-full flex items-center gap-4 p-5 border-b border-slate-50 text-left active:bg-slate-50">
                    <div className="w-12 h-12 bg-[#003624] text-white rounded-xl flex items-center justify-center font-black text-[18px] shrink-0">{s.user_details?.full_name?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#003624] truncate text-[15px]">{s.user_details?.full_name}</p>
                      <p className="text-[12px] font-bold text-slate-400 truncate">{s.student_number} • {s.course}</p>
                    </div>
                  </button>
                ))}
             </div>
           )}
         </div>
      )}

      {/* STEP 2: CONFIRM PROFILE */}
      {mobileStep === 'confirm' && foundStudent && (
        <div className="flex flex-col items-center pt-24 px-6 relative">
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-[2rem] border-4 border-emerald-400 bg-slate-100 overflow-hidden shadow-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[64px] text-slate-300">person</span>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#003624] text-white text-[9px] font-black px-4 py-1.5 rounded-xl tracking-widest uppercase shadow-md">
              ACTIVE
            </div>
          </div>
          
          <h2 className="text-[26px] font-black text-[#003624] leading-tight text-center mb-1 px-4">{foundStudent.user_details?.full_name}</h2>
          <p className="text-[15px] font-black text-[#003624] mb-8">{foundStudent.student_number}</p>

          <div className="flex flex-col items-center gap-3 mb-8 w-full max-w-[280px]">
            <div className="w-full bg-emerald-100/60 text-[#003624] py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">account_balance</span> {foundStudent.college || 'CICS'}
            </div>
            <div className="w-full bg-emerald-100/60 text-[#003624] py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">school</span> {foundStudent.course}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mb-12">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Year Level</p>
              <p className="text-[18px] font-black text-[#003624]">3rd Year</p>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Standing</p>
              <p className={`text-[16px] font-black text-center leading-tight ${pastViolations.length > 3 ? 'text-red-600' : 'text-[#003624]'}`}>{pastViolations.length > 3 ? 'High Risk' : 'Good Standing'}</p>
            </div>
          </div>

          <button onClick={() => setMobileStep('form')} className="w-full h-[68px] bg-[#003624] text-white font-black rounded-full flex items-center justify-center gap-3 tracking-widest text-[14px] mb-6 shadow-[0_10px_30px_rgba(0,54,36,0.3)] active:scale-95 transition-all">
            CONFIRM STUDENT <span className="material-symbols-outlined">check_circle</span>
          </button>
          
          <button onClick={() => {setFoundStudent(null); setMobileStep('scan');}} className="flex items-center gap-2 text-[13px] font-black text-[#003624] uppercase tracking-widest active:scale-95 transition-all opacity-80">
             <span className="material-symbols-outlined text-[18px]">refresh</span> Re-scan
          </button>
        </div>
      )}

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

                      <input type="date" name="incidentDate" value={formData.incidentDate} onChange={handleInputChange} className="w-full bg-slate-50 h-[60px] rounded-2xl pl-12 pr-4 text-[13px] font-bold text-slate-700 outline-none shadow-sm focus:bg-white focus:border-2 border-emerald-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Time of Occurrence</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">schedule</span>
                      <input type="time" name="incidentTime" value={formData.incidentTime} onChange={handleInputChange} className="w-full bg-slate-50 h-[60px] rounded-2xl pl-12 pr-4 text-[13px] font-bold text-slate-700 outline-none shadow-sm focus:bg-white focus:border-2 border-emerald-400" />
                    </div>
                  </div>

                  <div className="relative" ref={locationRef}>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Specific Location</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">location_on</span>
                      <input 
                        type="text" 
                        name="location" 
                        value={locationSearchQuery || formData.location} 
                        onFocus={() => setShowLocationDropdown(true)}
                        onChange={(e) => {
                          setLocationSearchQuery(e.target.value);
                          setFormData(prev => ({ ...prev, location: e.target.value }));
                          setShowLocationDropdown(true);
                        }} 
                        placeholder="Search campus facility..." 
                        className="w-full bg-slate-50 h-[60px] rounded-2xl pl-12 pr-4 text-[13px] font-bold text-slate-700 outline-none shadow-sm focus:bg-white focus:border-2 border-emerald-400 transition-all" 
                      />
                      {showLocationDropdown && (
                        <div className="absolute top-[65px] left-0 right-0 z-[120] bg-white rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar-emerald">
                            {Object.keys(filteredLocations()).length > 0 ? (
                              Object.entries(filteredLocations()).map(([campus, items]) => (
                                <div key={campus}>
                                  <div className="bg-slate-50/50 px-6 py-2 border-y border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{campus}</p>
                                  </div>
                                  {items.map(loc => (
                                    <button 
                                      key={loc}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, location: loc }));
                                        setLocationSearchQuery(loc);
                                        setShowLocationDropdown(false);
                                      }}
                                      className="w-full px-6 py-4 hover:bg-emerald-50 text-left text-[13px] font-bold text-slate-600 transition-all border-b border-slate-50 last:border-0"
                                    >
                                      {loc}
                                    </button>
                                  ))}
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center">
                                 <p className="text-[12px] font-bold text-slate-400 italic mb-2">Location not in directory</p>
                                 <button 
                                   type="button"
                                   onClick={() => setShowLocationDropdown(false)}
                                   className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-lg"
                                 >
                                   Use Manual Entry
                                 </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contextual Remarks</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" placeholder="Provide detailed narrative of the situation..." className="w-full bg-slate-50 rounded-3xl p-5 text-[13px] font-bold text-slate-700 outline-none resize-none shadow-sm focus:bg-white focus:border-2 border-emerald-400"></textarea>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Evidence Capture</label>
                    <button onClick={()=>fileInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-200 rounded-3xl py-8 px-4 flex flex-col items-center gap-2 bg-slate-50/50 hover:bg-slate-50 transition-all">
                       <span className="material-symbols-outlined text-[32px] text-slate-400">cloud_upload</span>
                       <span className="text-[12px] font-black text-[#003624]">Click to upload or drag photos</span>
                       <span className="text-[9px] font-bold text-slate-400">PNG, JPG up to 10MB each</span>
                    </button>
                    {evidenceFiles.length > 0 && (
                      <p className="text-[11px] font-bold text-[#003624] mt-3 text-center">{evidenceFiles.length} evidence file(s) attached</p>
                    )}
                  </div>
               </div>
             </div>
          </div>
          
          <div className="fixed bottom-0 left-0 w-full p-6 bg-slate-50/90 backdrop-blur-md border-t border-slate-200 z-40">
             <button onClick={handleGenerateRecommendation} disabled={isGenerating || !formData.violationType} className="w-full h-14 bg-[#003624] text-white rounded-full font-black text-[13px] uppercase tracking-widest flex items-center justify-center shadow-[0_10px_25px_rgba(0,54,36,0.3)] active:scale-95 disabled:opacity-50 transition-all">
               {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'RUN ASSESSMENT ENGINE'}
             </button>
          </div>
        </div>
      )}

      {/* MOBILE ASSESSMENT MODAL (BOTTOM SHEET) */}
      {assessment && !showSuccess && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-[#003624]/80 backdrop-blur-sm">
          <div className="bg-[#003624] rounded-t-[3rem] w-full max-h-[90vh] overflow-y-auto pt-4 pb-10 px-6 animate-in slide-in-from-bottom-20 duration-500 relative border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
            <div className="w-16 h-1 bg-white/20 rounded-full mx-auto mb-8"></div>
            
            <h3 className="text-[14px] font-black text-white text-center uppercase tracking-widest mb-1">Final Assessment Engine Output</h3>
            <p className="text-[10px] text-emerald-400 text-center mb-8 font-medium">Verified against University Disciplinary Policy v2.4</p>

            <div className="bg-white rounded-[2rem] p-6 mb-4 relative overflow-hidden shadow-xl border-l-8 border-emerald-400">
               <div className="absolute top-6 left-6 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
               </div>
               <div className="flex flex-col items-center">
                 <span className="bg-emerald-300 text-emerald-950 text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest mb-4">Escalation Priority</span>
                 <p className="text-[18px] font-black text-[#003624] mb-1">Escalation Result</p>
                 <p className="text-[15px] font-black text-emerald-600 mb-4">
                    {assessment.rule_code?.startsWith('27.1') ? `Violation #${(assessment.total_minor_count || 0) + 1}` : `Instance #${assessment.instance_number}`}
                 </p>
                 <p className="text-[11px] font-medium text-slate-500 text-center leading-relaxed max-w-[250px]">System detected a compliance breach. Protocol mandates immediate record creation with a 48-hour appeal window for the candidate.</p>
               </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 mb-8 border-l-8 border-red-500 shadow-xl">
               <div className="flex flex-col items-center">
                 <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <span className="material-symbols-outlined text-[24px]">gavel</span>
                 </div>
                 <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest mb-3">Auto-Sanction</span>
                 <p className="text-[18px] font-black text-[#003624] mb-1">Mandated Sanction</p>
                 <p className="text-[16px] font-black text-red-600 mb-6">{assessment.recommendation}</p>
                 <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 text-[#003624] text-[11px] font-black border border-slate-100">
                    <span className="material-symbols-outlined text-[16px]">menu_book</span>
                    Handbook Page {assessment.rule_code?.substring(0,4) || 'Ref'}
                 </div>
               </div>
            </div>

            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-14 bg-white text-[#003624] font-black rounded-full mb-4 text-[14px] active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center">
              {isSubmitting ? <div className="w-5 h-5 border-2 border-[#003624]/30 border-t-[#003624] rounded-full animate-spin" /> : 'Commit to Institutional Record'}
            </button>
            <button onClick={() => setAssessment(null)} className="w-full h-14 text-white font-bold rounded-full text-[14px] active:scale-95 transition-all hover:bg-white/5 border border-transparent hover:border-white/10">
              Discard Entry
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
