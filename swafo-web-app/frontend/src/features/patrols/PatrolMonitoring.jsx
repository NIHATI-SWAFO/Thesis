import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../api/config';
import { 
  Shield, 
  Play, 
  CheckCircle2, 
  Image as ImageIcon, 
  Clock, 
  ArrowRight, 
  Radio, 
  MapPin, 
  AlertTriangle, 
  ChevronRight,
  TrendingUp,
  Camera,
  Compass
} from 'lucide-react';

export default function PatrolMonitoring() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [history, setHistory] = useState([]);
  const [kpis, setKpis] = useState({ 
    totalPatrols: 0, 
    completedToday: 0, 
    photos: 0, 
    avgDuration: 0,
    weeklyPatrols: 0, 
    totalEvidence: 0, 
    areasCoveredPercent: 0 
  });
  const [violationsStats, setViolationsStats] = useState({ 
    total_reports: 0, 
    uniform: 0, 
    curfew: 0, 
    id_pass: 0, 
    smoking: 0 
  });
  const [assignment, setAssignment] = useState(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);

  const officerName = user?.name || user?.full_name || 'SWAFO Officer';

  const getOfficerEvidenceThumb = (patrol) => {
    const photos = Array.isArray(patrol?.capturedPhotos) ? patrol.capturedPhotos : [];
    const officerPhotos = photos.filter(p => {
      const url = p?.url || p;
      if (!url || typeof url !== 'string') return Boolean(url);
      return !url.includes('/images/buildings/') && !url.includes('/media/buildings/');
    });
    if (officerPhotos.length > 0) {
      const first = officerPhotos[0];
      return first.url || (typeof first === 'string' ? first : null);
    }
    return null;
  };

  const fetchAssignment = async () => {
    try {
      setLoadingAssignment(true);
      const officerEmail = user?.email;
      const officerId = user?.id;
      const param = officerId ? `?officer_id=${officerId}` : officerEmail ? `?officer_email=${encodeURIComponent(officerEmail)}` : '';
      
      const res = await fetch(`${API_ENDPOINTS.PATROLS_ASSIGNMENTS_MY}${param}`);
      if (res.ok) {
        const data = await res.json();
        setAssignment(data);
      } else {
        const allRes = await fetch(API_ENDPOINTS.PATROLS_ASSIGNMENTS_CURRENT);
        if (allRes.ok) {
          const allData = await allRes.json();
          const found = Array.isArray(allData) && allData.find(a => 
            (officerId && a.officer === officerId) || 
            (officerEmail && a.officer_email === officerEmail) ||
            (officerName && a.officer_name === officerName)
          );
          if (found) setAssignment(found);
        }
      }
    } catch (e) {
      console.error("Failed to fetch assignment", e);
    } finally {
      setLoadingAssignment(false);
    }
  };

  const fetchViolations = async () => {
    try {
      const resp = await fetch(`${API_ENDPOINTS.VIOLATIONS_STATISTICS}?today=true`);
      if (resp.ok) {
        const data = await resp.json();
        setViolationsStats({
          total_reports: data.total_reports || 0,
          uniform: data.categories?.uniform || 0,
          curfew: data.categories?.curfew || 0,
          id_pass: data.categories?.id_pass || 0,
          smoking: data.categories?.smoking || 0
        });
      }
    } catch (e) {
      console.error("Failed to fetch violations stats", e);
    }
  };

  const fetchData = async () => {
    try {
      const resp = await fetch(API_ENDPOINTS.PATROLS_HISTORY);
      const serverData = resp.ok ? await resp.json() : [];

      const localData = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      const merged = [...localData];
      serverData.forEach(sPatrol => {
        if (!merged.find(m => String(m.id) === String(sPatrol.id))) {
          merged.push(sPatrol);
        }
      });

      setHistory(merged.slice(0, 8));

      const now = new Date();
      const todayStr = now.toDateString();
      const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

      const totalPatrols = merged.filter(p => p.status === 'COMPLETED').length;

      const completedToday = merged.filter(p => {
        const endTime = p.end_time || p.actual_end;
        return p.status === 'COMPLETED' && endTime && new Date(endTime).toDateString() === todayStr;
      }).length;

      const photos = merged.reduce((sum, p) => {
        const dbCount = typeof p.photos_count === 'number' ? p.photos_count : 0;
        const localCount = Array.isArray(p.capturedPhotos) ? p.capturedPhotos.length : 0;
        return sum + Math.max(dbCount, localCount);
      }, 0);

      const completedWithTimes = merged.filter(p => {
        const start = p.start_time || p.actual_start;
        const end = p.end_time || p.actual_end;
        return p.status === 'COMPLETED' && start && end;
      });
      
      let avgDuration = 0;
      if (completedWithTimes.length > 0) {
        const totalMs = completedWithTimes.reduce((sum, p) => {
          const start = new Date(p.start_time || p.actual_start);
          const end = new Date(p.end_time || p.actual_end);
          return sum + Math.max(0, end - start);
        }, 0);
        avgDuration = Math.max(0, Math.round(totalMs / completedWithTimes.length / 60000));
      }

      const weeklyPatrols = merged.filter(p => {
        const start = p.start_time || p.actual_start;
        return p.status === 'COMPLETED' && start && new Date(start) >= oneWeekAgo;
      }).length;

      setKpis({
        totalPatrols,
        completedToday,
        photos,
        avgDuration,
        weeklyPatrols,
        totalEvidence: photos,
        areasCoveredPercent: Math.min(100, Math.round((totalPatrols * 12) % 100) || 75),
      });

    } catch (e) {
      console.error('fetchData error:', e);
      const localData = JSON.parse(localStorage.getItem('swafo_local_history') || '[]');
      setHistory(localData.slice(0, 8));
    }
  };

  useEffect(() => {
    fetchData();
    fetchViolations();
    fetchAssignment();

    const interval = setInterval(() => {
      fetchData();
      fetchViolations();
      fetchAssignment();
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  const savedState = JSON.parse(sessionStorage.getItem('swafo_live_patrol_state') || 'null');
  const isPatrolActive = savedState?.isPatrolActive === true;

  const handleStartNewPatrol = () => {
    if (isPatrolActive) {
      navigate('/officer/patrols/live');
      return;
    }
    sessionStorage.removeItem('swafo_live_patrol_state');
    localStorage.removeItem('swafo_active_session');
    navigate('/officer/patrols/select');
  };

  const handleViewArchive = (patrol) => {
    sessionStorage.setItem('swafo_viewing_patrol', JSON.stringify(patrol));
    navigate(`/officer/patrol-history/${patrol.id || 'local'}`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 font-manrope animate-fade-in px-1 sm:px-4">
      {/* ══════════════════════════════ HEADER ══════════════════════════════ */}
      <div className="mb-5 sm:mb-8">
        <h1 className="font-pjs font-extrabold text-2xl sm:text-[34px] text-gray-900 leading-tight tracking-tight">
          Patrol Monitoring
        </h1>
        <p className="text-xs sm:text-[14px] text-gray-500 font-medium mt-1">
          Active zones, officer assignments, and field surveillance logs.
        </p>
      </div>

      {/* ══════════════════════════════ 4-KPI METRICS ROW (2x2 on Mobile, 4-Col on Desktop) ══════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        {/* Total Patrols */}
        <div className="bg-[#003624] rounded-2xl sm:rounded-[1.75rem] p-4 sm:p-5 text-white shadow-md flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[9px] sm:text-[10px] font-black text-emerald-200/70 tracking-[0.14em] uppercase">
              Total Patrols
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Compass size={16} />
            </div>
          </div>
          <div>
            <p className="font-pjs font-black text-2xl sm:text-[34px] leading-none mb-1 tracking-tight">
              {kpis.totalPatrols.toString().padStart(2, '0')}
            </p>
            <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-200/80 tracking-tight">
              Completed Records
            </p>
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white rounded-2xl sm:rounded-[1.75rem] p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-[0.14em] uppercase">
              Today's Shifts
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <p className="font-pjs font-black text-2xl sm:text-[34px] text-gray-900 leading-none mb-1 tracking-tight">
              {kpis.completedToday}
            </p>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-tight">
              Finished Today
            </p>
          </div>
        </div>

        {/* Photos Captured */}
        <div className="bg-white rounded-2xl sm:rounded-[1.75rem] p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-[0.14em] uppercase">
              Evidence Log
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera size={16} />
            </div>
          </div>
          <div>
            <p className="font-pjs font-black text-2xl sm:text-[34px] text-gray-900 leading-none mb-1 tracking-tight">
              {kpis.photos}
            </p>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-tight">
              Photos Uploaded
            </p>
          </div>
        </div>

        {/* Avg Duration */}
        <div className="bg-white rounded-2xl sm:rounded-[1.75rem] p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-[0.14em] uppercase">
              Avg Duration
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <p className="font-pjs font-black text-2xl sm:text-[34px] text-gray-900 leading-none mb-1 tracking-tight">
                {kpis.avgDuration}
              </p>
              <span className="text-xs font-bold text-gray-400">mins</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-tight">
              Per Sector Sweep
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════ OFFICER ASSIGNED ZONE BANNER ══════════════════════════════ */}
      <div className="bg-gradient-to-br from-[#0c2f1f] via-[#113a26] to-[#003624] rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 text-white shadow-xl relative overflow-hidden mb-6 sm:mb-8 border border-emerald-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              <span className="text-[9.5px] font-black uppercase tracking-widest text-[#39E58C] bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                CURRENT PATROL ASSIGNMENT
              </span>
              <span className="text-[11px] font-bold text-white/70">
                {assignment?.is_manual ? 'Designated by Director' : 'Active Duty Schedule'}
              </span>
            </div>

            <h2 className="font-pjs font-extrabold text-xl sm:text-2xl lg:text-[26px] text-white leading-tight mb-1.5 tracking-tight truncate">
              {assignment ? assignment.zone : (loadingAssignment ? 'Retrieving Officer Assignment...' : 'Zone 8: Gate 3 & Sports Area')}
            </h2>
            
            <p className="text-xs sm:text-[13px] text-white/80 font-medium mb-3.5">
              Assigned Officer: <span className="font-bold text-white">{officerName}</span>
            </p>

            {assignment?.locations && assignment.locations.length > 0 ? (
              <div>
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1.5">Designated Sectors</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {assignment.locations.map((loc, i) => (
                    <span key={i} className="text-[10px] sm:text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-lg text-white backdrop-blur-sm inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#39E58C]" />
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {['Gate 3 Entry', 'Botanical Garden', 'Ugnayang La Salle', 'Sports Field'].map((loc, i) => (
                  <span key={i} className="text-[10px] sm:text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-lg text-white backdrop-blur-sm inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#39E58C]" />
                    {loc}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <button
              onClick={handleStartNewPatrol}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#39E58C] hover:bg-[#2fd37f] text-[#0c2f1f] font-pjs font-extrabold text-xs sm:text-[14px] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Play size={16} className="fill-current" />
              <span>{isPatrolActive ? 'Resume Active Patrol' : 'Start New Patrol'}</span>
            </button>
            <p className="hidden sm:block text-[10px] font-semibold text-white/50 text-right">
              GPS Verified • Active Geofence
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════ MAIN 2-COLUMN GRID ══════════════════════════════ */}
      <div className="grid grid-cols-12 gap-5 sm:gap-8">
        
        {/* LEFT / PRIMARY SECTION: Violation Summary + Recent Patrols */}
        <div className="col-span-12 lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* Violation Summary */}
          <div className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-xs border border-gray-100">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="font-pjs font-extrabold text-base sm:text-xl text-gray-900 tracking-tight">
                  Violation Summary
                </h2>
                <p className="text-[11px] text-gray-400 font-medium">
                  Field incident reports logged during patrols today
                </p>
              </div>
              <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                TODAY'S SHIFT
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex flex-col items-center justify-center sm:border-r border-gray-100 sm:pr-8 shrink-0">
                <span className="text-4xl sm:text-[50px] font-pjs font-black text-rose-600 leading-none mb-1">
                  {violationsStats.total_reports.toString().padStart(2, '0')}
                </span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
                  Total Reports
                </span>
              </div>

              <div className="flex-1 w-full grid grid-cols-2 gap-3 sm:gap-4">
                <div className={`p-3 rounded-xl border border-gray-100 bg-slate-50/60 flex items-center justify-between ${violationsStats.uniform === 0 ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${violationsStats.uniform > 0 ? 'bg-[#003624]' : 'bg-gray-300'}`} />
                    <span className="text-xs font-bold text-gray-700">Uniform</span>
                  </div>
                  <span className="font-pjs font-extrabold text-sm text-gray-900">{violationsStats.uniform}</span>
                </div>

                <div className={`p-3 rounded-xl border border-gray-100 bg-slate-50/60 flex items-center justify-between ${violationsStats.curfew === 0 ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${violationsStats.curfew > 0 ? 'bg-rose-500' : 'bg-gray-300'}`} />
                    <span className="text-xs font-bold text-gray-700">Curfew</span>
                  </div>
                  <span className="font-pjs font-extrabold text-sm text-gray-900">{violationsStats.curfew}</span>
                </div>

                <div className={`p-3 rounded-xl border border-gray-100 bg-slate-50/60 flex items-center justify-between ${violationsStats.id_pass === 0 ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${violationsStats.id_pass > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                    <span className="text-xs font-bold text-gray-700">ID / Pass</span>
                  </div>
                  <span className="font-pjs font-extrabold text-sm text-gray-900">{violationsStats.id_pass}</span>
                </div>

                <div className={`p-3 rounded-xl border border-gray-100 bg-slate-50/60 flex items-center justify-between ${violationsStats.smoking === 0 ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${violationsStats.smoking > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <span className="text-xs font-bold text-gray-700">Smoking</span>
                  </div>
                  <span className="font-pjs font-extrabold text-sm text-gray-900">{violationsStats.smoking}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Patrol Activity */}
          <div className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-xs border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="font-pjs font-extrabold text-base sm:text-xl text-gray-900 tracking-tight">
                  Recent Patrol Activity
                </h2>
                <p className="text-[11px] text-gray-400 font-medium">
                  Verified patrol sessions completed across campus
                </p>
              </div>
              <button 
                onClick={() => navigate('/officer/patrol-history')}
                className="text-xs font-bold text-[#003624] hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <span>View All History</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="space-y-3">
              {history.length > 0 ? (
                history.map((patrol, idx) => {
                  const evidenceThumb = getOfficerEvidenceThumb(patrol);
                  const officerPhotosCount = Array.isArray(patrol?.capturedPhotos)
                    ? patrol.capturedPhotos.filter(p => {
                        const u = p?.url || p;
                        return typeof u === 'string' ? (!u.includes('/images/buildings/') && !u.includes('/media/buildings/')) : Boolean(u);
                      }).length
                    : (patrol.photos_count || 0);

                  const timeStr = patrol.actual_end || patrol.end_time 
                    ? new Date(patrol.actual_end || patrol.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : 'Recent';

                  return (
                    <div 
                      key={patrol.id || idx} 
                      onClick={() => handleViewArchive(patrol)} 
                      className="bg-slate-50/70 hover:bg-emerald-50/40 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-2xs flex items-center gap-3.5 sm:gap-4 border border-gray-100 active:scale-[0.99] transition-all cursor-pointer group"
                    >
                      {evidenceThumb ? (
                        <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden border border-gray-200/80 bg-gray-100 shadow-xs group-hover:scale-105 transition-transform">
                          <img src={evidenceThumb} alt="Patrol evidence" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-white rounded-xl shrink-0 flex items-center justify-center text-gray-400 border border-gray-200/80 shadow-xs group-hover:scale-105 transition-transform">
                          <Compass size={20} className="text-[#003624]" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-pjs font-bold text-sm sm:text-[15px] text-gray-900 truncate tracking-tight mb-0.5 group-hover:text-[#003624] transition-colors">
                          {patrol.location || 'Institutional Campus Sector'}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-400 text-[11px] font-semibold">
                          <span className="truncate max-w-[130px] sm:max-w-none">
                            {patrol.officer_details?.full_name || patrol.officer_name || officerName}
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0" />
                          <span className="shrink-0">{patrol.duration_display || `${patrol.duration || '40'}m`}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="bg-emerald-100/70 px-2 py-0.5 rounded-md mb-1 inline-block">
                          <span className="text-[10px] font-black text-emerald-800">📷 {officerPhotosCount}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          {timeStr}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-gray-400 text-xs font-semibold">
                  No patrols recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Quick Insights + Briefing */}
        <div className="col-span-12 lg:col-span-4 space-y-5 sm:space-y-6">
          
          {/* Quick Insights Card */}
          <div className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-xs border border-gray-100">
            <h3 className="font-pjs font-extrabold text-sm sm:text-base text-gray-900 mb-5 tracking-tight">
              Operational Insights
            </h3>
            
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-gray-100">
                <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Weekly Completed</p>
                  <p className="font-pjs font-black text-lg text-gray-900">{kpis.weeklyPatrols} Shifts</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-gray-100">
                <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center shrink-0">
                  <ImageIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Total Evidence Files</p>
                  <p className="font-pjs font-black text-lg text-gray-900">{kpis.totalEvidence} Photos</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-gray-100">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Campus Sector Coverage</p>
                  <p className="font-pjs font-black text-lg text-gray-900">{kpis.areasCoveredPercent}% Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Briefing Card */}
          <div className="bg-emerald-50/70 rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2 text-[#003624]">
              <Shield size={18} />
              <h3 className="font-pjs font-bold text-sm tracking-tight">Security Briefing</h3>
            </div>
            <p className="text-xs text-emerald-900/80 font-medium leading-relaxed italic">
              "Maintain vigilant perimeter observation near ICTC and Student Center between shift changes. Verify student uniforms and ID taps at Gate 3."
            </p>
            <div className="mt-3 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-[10.5px] font-bold text-emerald-800">
              <span>SWAFO Central Station</span>
              <span>Daily Directive</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

