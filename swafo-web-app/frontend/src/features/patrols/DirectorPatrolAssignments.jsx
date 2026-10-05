import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import API_BASE_URL from '../../api/config';

export default function DirectorPatrolAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);

  const ZONES = [
    "Zone 1: Magdalo Gate & Entry",
    "Zone 2: South Admin & Academic",
    "Zone 3: Library, Chapel & Cultural",
    "Zone 4: Food Court & Dormitory",
    "Zone 5: Central Academic (West)",
    "Zone 6: MTH & GMH Quad Area",
    "Zone 7: High School Complex",
    "Zone 8: Gate 3 & Sports Area"
  ];

  const formatOfficerName = (name) => {
    if (!name) return 'SWAFO Officer';
    if (name.includes(',')) {
      const parts = name.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        return `${parts[1]} ${parts[0]}`;
      }
    }
    return name;
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [mappingSearch, setMappingSearch] = useState('');
  const [movingLocation, setMovingLocation] = useState(null);
  const [savingMappingId, setSavingMappingId] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [resettingMappings, setResettingMappings] = useState(false);

  const getHeaders = () => {
    try {
      const user = JSON.parse(localStorage.getItem('swafo_mock_user') || '{}');
      if (user && user.token) {
        return { 'Authorization': "Bearer " + user.token, 'Content-Type': 'application/json' };
      }
    } catch (e) {}
    return { 'Content-Type': 'application/json' };
  };

  // Robust fetch helper that auto-recovers from expired or invalid JWT tokens
  const fetchWithAuth = async (url, options = {}) => {
    const headers = getHeaders();
    let response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
    
    // If token is invalid, expired, or forbidden (Django returns 401 or 403 with token_not_valid)
    if (response.status === 401 || response.status === 403) {
      try {
        const stored = JSON.parse(localStorage.getItem('swafo_mock_user') || '{}');
        if (stored?.token) {
          delete stored.token;
          localStorage.setItem('swafo_mock_user', JSON.stringify(stored));
        }
      } catch (e) {}

      const cleanHeaders = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      delete cleanHeaders['Authorization'];
      response = await fetch(url, { ...options, headers: cleanHeaders });
    }
    return response;
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchWithAuth(API_BASE_URL + '/api/patrols/assignments/current/');
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'API failed');
      setAssignments(Array.isArray(data) ? data : (data.results || []));
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMappings = async () => {
    try {
      setLoadingMappings(true);
      const response = await fetchWithAuth(API_BASE_URL + '/api/patrols/zone-mappings/');
      const data = await response.json();
      if (response.ok) {
        setMappings(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) {
      console.error("Failed to load mappings", err);
    } finally {
      setLoadingMappings(false);
    }
  };

  const handleUpdateMappingZone = async (mappingId, newZone) => {
    setMappings(prev => prev.map(m => m.id === mappingId ? { ...m, zone_name: newZone } : m));
    setSavingMappingId(mappingId);
    try {
      const response = await fetchWithAuth(API_BASE_URL + '/api/patrols/zone-mappings/' + mappingId + '/', {
        method: 'PATCH',
        body: JSON.stringify({ zone_name: newZone })
      });
      if (!response.ok) throw new Error('Failed to update mapping');
      const shortZone = newZone.split(':')[0];
      setSaveSuccessMsg(`Updated to ${shortZone}`);
      setTimeout(() => setSaveSuccessMsg(''), 2500);
    } catch (err) {
      console.error(err);
      fetchMappings();
    } finally {
      setSavingMappingId(null);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm("Are you sure you want to reset all 8 zones and 52 locations back to the campus defaults?")) {
      return;
    }
    try {
      setResettingMappings(true);
      const response = await fetchWithAuth(API_BASE_URL + '/api/patrols/zone-mappings/reset_defaults/', {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setMappings(Array.isArray(data) ? data : (data.results || []));
        setSaveSuccessMsg("Reset all zones to defaults!");
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResettingMappings(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const openMappingModal = () => {
    setShowMappingModal(true);
    fetchMappings();
  };

  const executeAutoAssign = async () => {
    setShowModal(false);
    try {
      setAssigning(true);
      await fetchWithAuth(API_BASE_URL + '/api/patrols/assignments/auto_assign/', {
        method: 'POST'
      });
      await fetchAssignments();
    } catch (err) {
      console.error(err);
      setError('Failed to auto-assign officers.');
    } finally {
      setAssigning(false);
    }
  };

  const handleManualZoneChange = async (assignmentId, newZone) => {
    setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, zone: newZone, is_manual: true } : a));
    try {
      await fetchWithAuth(API_BASE_URL + '/api/patrols/assignments/' + assignmentId + '/', {
        method: 'PATCH',
        body: JSON.stringify({ zone: newZone, is_manual: true })
      });
    } catch (err) {
      fetchAssignments();
    }
  };

  // Group mappings by Zone for the table format
  const getGroupedMappings = () => {
    const groups = {};
    ZONES.forEach(z => groups[z] = []);
    mappings.forEach(m => {
      if (groups[m.zone_name]) {
        groups[m.zone_name].push(m);
      } else {
        groups[m.zone_name] = [m];
      }
    });
    return groups;
  };

  const groupedMappings = getGroupedMappings();

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16 relative">
      
      {/* Quick Location Transfer Modal */}
      {movingLocation && createPortal(
        <div className="fixed inset-0 z-[10000] w-screen h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-[0_25px_70px_rgba(0,0,0,0.35)] border border-gray-100 animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-100">
              <span className="material-symbols-outlined text-2xl">drive_file_move</span>
            </div>
            <h3 className="font-pjs font-black text-xl text-[#003624]">Reassign Campus Location</h3>
            <p className="text-slate-500 text-xs font-semibold mt-1 mb-5">
              Select the new Patrol Zone for <span className="text-[#003624] font-black">{movingLocation.location_name}</span>:
            </p>
            <div className="space-y-1.5 mb-6 max-h-64 overflow-y-auto pr-1">
              {ZONES.map((z, idx) => (
                <button
                  key={z}
                  onClick={() => {
                    handleUpdateMappingZone(movingLocation.id, z);
                    setMovingLocation(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    movingLocation.zone_name === z
                      ? 'bg-[#003624] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-[#003624]'
                  }`}
                >
                  <span>Zone {idx + 1}: {z.replace(/^Zone \d+: /, '')}</span>
                  {movingLocation.zone_name === z && (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setMovingLocation(null)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Zone Mapping Customization Modal */}
      {showMappingModal && createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-[0_25px_70px_rgba(0,0,0,0.35)] w-full max-w-6xl xl:max-w-7xl max-h-[92vh] h-[92vh] sm:max-h-[78vh] sm:h-[78vh] flex flex-col transform scale-100 animate-slide-up border border-gray-100 overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 md:px-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white flex-shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#003624] flex-shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-xl sm:text-2xl font-black">map</span>
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-pjs font-black text-[#003624] tracking-tight leading-snug">
                    Zone Customization Editor
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-[13px] font-semibold mt-0.5 sm:mt-1">
                    Review and customize designated campus locations for each Patrol Zone.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 justify-end w-full md:w-auto">
                {saveSuccessMsg && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-in shadow-xs">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {saveSuccessMsg}
                  </span>
                )}
                <button 
                  onClick={handleResetDefaults}
                  disabled={resettingMappings}
                  title="Reset all zones to official campus defaults"
                  className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[16px] ${resettingMappings ? 'animate-spin' : ''}`}>
                    restart_alt
                  </span>
                  <span className="hidden sm:inline">Reset Defaults</span>
                  <span className="sm:hidden">Reset</span>
                </button>
                <button 
                  onClick={() => setShowMappingModal(false)} 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Modal Sub-header / Toolbar */}
            <div className="bg-slate-50/80 px-4 sm:px-6 md:px-8 py-3 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 flex-shrink-0">
              {/* Search Box */}
              <div className="relative w-full sm:max-w-md">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={mappingSearch || ""}
                  onChange={(e) => setMappingSearch(e.target.value)}
                  placeholder="Search building name (e.g. Library, Gate, Hall)..."
                  className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-10 pr-8 py-2 sm:py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-xs"
                />
                {mappingSearch && (
                  <button onClick={() => setMappingSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                    ✕
                  </button>
                )}
              </div>

              {/* Edit Mode Toggle */}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs ${
                  isEditMode
                    ? 'bg-[#003624] text-white shadow-md shadow-[#003624]/20'
                    : 'bg-white text-[#003624] border border-emerald-200 hover:bg-emerald-50/60'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isEditMode ? 'check_circle' : 'edit_square'}
                </span>
                {isEditMode ? 'Done Editing' : 'Edit Zones'}
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-0 min-h-0">
              {loadingMappings ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                  <div className="w-9 h-9 border-4 border-[#003624] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Campus Locations...</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <table className="hidden md:table w-full text-left border-collapse text-sm">
                    <thead className="sticky top-0 bg-slate-50 z-10">
                      <tr className="border-b border-gray-100">
                        <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest w-36 whitespace-nowrap">Zone</th>
                        <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest w-64 md:w-72 whitespace-nowrap">Zone Name</th>
                        <th className="py-4 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          Locations (Physically Nearby) {isEditMode && <span className="text-emerald-700 font-bold lowercase">— click ⇄ or dropdown to reassign</span>}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ZONES.map((zoneString, index) => {
                        const zoneId = 'Zone ' + (index + 1);
                        const zoneName = zoneString.replace(zoneId + ': ', '');
                        const allLocsInZone = groupedMappings[zoneString] || [];
                        const locsInZone = mappingSearch
                          ? allLocsInZone.filter(l => l.location_name.toLowerCase().includes(mappingSearch.toLowerCase()))
                          : allLocsInZone;
                        
                        return (
                          <tr key={zoneString} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-5 px-6 align-top whitespace-nowrap w-36">
                              <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-[#003624] text-white whitespace-nowrap shadow-xs">
                                {zoneId}
                              </span>
                            </td>
                            <td className="py-5 px-6 align-top pr-6 w-64 md:w-72">
                              <p className="font-pjs font-bold text-[#003624] text-[15px] leading-snug">
                                {zoneName}
                              </p>
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 whitespace-nowrap">
                                {allLocsInZone.length} {allLocsInZone.length === 1 ? 'Location' : 'Locations'}
                              </p>
                            </td>
                            <td className="py-5 px-6 align-top">
                              <div className="flex flex-wrap items-center gap-2.5">
                                {locsInZone.length > 0 ? (
                                  locsInZone.map(l => (
                                    <span 
                                      key={l.id} 
                                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold bg-slate-50 text-slate-700 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-[#003624] transition-all shadow-xs"
                                    >
                                      <span className="material-symbols-outlined text-[15px] text-emerald-600">apartment</span>
                                      <span>{l.location_name}</span>
                                      {isEditMode && (
                                        <button
                                          onClick={() => setMovingLocation(l)}
                                          title={`Move ${l.location_name} to another zone`}
                                          className="ml-0.5 w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 transition-colors"
                                        >
                                          <span className="material-symbols-outlined text-[15px]">swap_horiz</span>
                                        </button>
                                      )}
                                    </span>
                                  ))
                                ) : (
                                  <span className="italic text-slate-400 text-xs py-1">
                                    {mappingSearch ? 'No locations match search in this zone' : 'No locations currently assigned...'}
                                  </span>
                                )}

                                {/* Transfer building into this zone dropdown (Edit Mode) */}
                                {isEditMode && (
                                  <div className="relative inline-block my-1">
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleUpdateMappingZone(Number(e.target.value), zoneString);
                                          e.target.value = "";
                                        }
                                      }}
                                      className="appearance-none bg-white border border-dashed border-emerald-400 hover:border-emerald-600 text-emerald-800 hover:bg-emerald-50/50 text-[11px] font-black rounded-xl px-3.5 py-1.5 pr-7 outline-none cursor-pointer transition-all shadow-xs"
                                    >
                                      <option value="">+ Move Building Here...</option>
                                      {mappings
                                        .filter(m => m.zone_name !== zoneString)
                                        .sort((a, b) => a.location_name.localeCompare(b.location_name))
                                        .map(m => (
                                          <option key={m.id} value={m.id}>
                                            {m.location_name} (from {m.zone_name.split(':')[0]})
                                          </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none text-sm">
                                      add
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Mobile Zone List (< md) */}
                  <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
                    {ZONES.map((zoneString, index) => {
                      const zoneId = 'Zone ' + (index + 1);
                      const zoneName = zoneString.replace(zoneId + ': ', '');
                      const allLocsInZone = groupedMappings[zoneString] || [];
                      const locsInZone = mappingSearch
                        ? allLocsInZone.filter(l => l.location_name.toLowerCase().includes(mappingSearch.toLowerCase()))
                        : allLocsInZone;

                      return (
                        <div key={zoneString} className="bg-slate-50/60 rounded-2xl p-3.5 border border-slate-200/60 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#003624] text-white">
                                {zoneId}
                              </span>
                              <h4 className="font-pjs font-bold text-[#003624] text-[14px]">
                                {zoneName}
                              </h4>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                              {allLocsInZone.length} {allLocsInZone.length === 1 ? 'Loc' : 'Locs'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {locsInZone.length > 0 ? (
                              locsInZone.map(l => (
                                <span 
                                  key={l.id} 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-xs"
                                >
                                  <span className="material-symbols-outlined text-[13px] text-emerald-600">apartment</span>
                                  <span>{l.location_name}</span>
                                  {isEditMode && (
                                    <button
                                      onClick={() => setMovingLocation(l)}
                                      className="ml-0.5 w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-emerald-700"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                                    </button>
                                  )}
                                </span>
                              ))
                            ) : (
                              <span className="italic text-slate-400 text-xs">No locations</span>
                            )}

                            {isEditMode && (
                              <div className="relative inline-block w-full mt-1">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleUpdateMappingZone(Number(e.target.value), zoneString);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="w-full appearance-none bg-white border border-dashed border-emerald-400 text-emerald-800 text-[11px] font-black rounded-xl px-3 py-2 pr-7 outline-none"
                                >
                                  <option value="">+ Move Building Here...</option>
                                  {mappings
                                    .filter(m => m.zone_name !== zoneString)
                                    .sort((a, b) => a.location_name.localeCompare(b.location_name))
                                    .map(m => (
                                      <option key={m.id} value={m.id}>
                                        {m.location_name} (from {m.zone_name.split(':')[0]})
                                      </option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none text-sm">
                                  add
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50/70 px-4 sm:px-6 md:px-8 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold text-center sm:text-left">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>{mappings.length} Campus Buildings across 8 Zones</span>
              </div>
              <button
                onClick={() => setShowMappingModal(false)}
                className="w-full sm:w-auto bg-[#003624] hover:bg-[#004f36] text-white px-7 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-[#003624]/20 hover:-translate-y-0.5"
              >
                Close Editor
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* Auto Assign Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-[0_25px_70px_rgba(0,0,0,0.35)] w-full max-w-md p-6 sm:p-8 border border-gray-100 transform scale-100 animate-slide-up">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl font-black">sync</span>
            </div>
            <h2 className="text-2xl font-pjs font-black text-center text-[#003624] mb-3">Re-Assign All Zones?</h2>
            <p className="text-center text-slate-500 font-medium leading-relaxed mb-8 text-sm sm:text-base">
              This will instantly shuffle and assign all active SWAFO Officers to new zones for the current month. You can manually adjust them afterwards.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-full font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors text-sm">Cancel</button>
              <button onClick={executeAutoAssign} className="flex-1 py-3.5 rounded-full font-bold text-white bg-[#003624] hover:bg-[#004f36] shadow-lg shadow-[#003624]/20 transition-colors flex justify-center items-center gap-2 text-sm">
                Yes, Auto-Assign
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-pjs font-black text-[#003624] tracking-tight leading-tight sm:leading-none mb-1 sm:mb-2">Patrol Assignments</h1>
          <p className="text-[11px] sm:text-[12px] font-black text-slate-400 uppercase tracking-widest">
            Manage designated patrol zones for all active SWAFO Officers.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={openMappingModal}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 sm:px-6 py-3 rounded-full flex items-center justify-center gap-2 text-[12px] sm:text-[13px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              Edit Zone Map
            </button>
            <button
              onClick={() => setShowModal(true)}
              disabled={assigning}
              className="bg-[#003624] hover:bg-[#004f36] text-white px-5 sm:px-6 py-3 rounded-full flex items-center justify-center gap-2 text-[12px] sm:text-[13px] font-black uppercase tracking-widest transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-[#003624]/20 disabled:opacity-50 disabled:hover:translate-y-0 w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[18px]">
                {assigning ? 'sync' : 'shuffle'}
              </span>
              {assigning ? 'GENERATING...' : 'AUTO-ASSIGN MONTH'}
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl flex items-center gap-3">
          <span className="material-symbols-outlined font-black">error</span>
          <span className="text-[13px] font-bold">{error}</span>
        </div>
      )}

      {/* Main Table / Mobile Card Container */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-[#003624] border-t-transparent rounded-full animate-spin"></div>
             <p className="font-pjs font-bold text-[#003624]">Loading Active Assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <span className="material-symbols-outlined text-slate-300 text-[40px]">assignment_late</span>
            </div>
            <h3 className="text-xl font-pjs font-black text-[#003624] mb-2">No Officer Assignments Found</h3>
            <p className="text-slate-500 text-[13px] font-medium max-w-md leading-relaxed mb-6">
              It looks like assignments haven't been generated for this month yet. Click the "Auto-Assign Month" button to populate the roster.
            </p>
            <button onClick={() => setShowModal(true)} className="bg-emerald-50 text-emerald-700 font-bold px-6 py-3 rounded-full hover:bg-emerald-100 transition-colors">
                Generate Base Roster
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table (Screen >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-5 px-7 text-[11px] font-black text-slate-400 uppercase tracking-widest">SWAFO Officer</th>
                    <th className="py-5 px-7 text-[11px] font-black text-slate-400 uppercase tracking-widest">Designated Zone (Manual Override)</th>
                    <th className="py-5 px-7 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Assignment Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-5 px-7 w-1/3">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black font-pjs text-lg group-hover:scale-110 transition-transform">
                            {formatOfficerName(assignment.officer_name).charAt(0)}
                          </div>
                          <div>
                             <p className="font-pjs font-bold text-[#003624] text-[15px] leading-tight">
                               {formatOfficerName(assignment.officer_name)}
                             </p>
                             <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                               SWAFO Officer
                             </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-7">
                        <div className="relative w-full max-w-sm">
                          <select 
                            value={assignment.zone || ''}
                            onChange={(e) => handleManualZoneChange(assignment.id, e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-[#003624] font-bold text-[14px] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                          >
                            {ZONES.map(z => (
                              <option key={z} value={z}>{z.replace(/^Zone \d+: /, '')}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                        </div>
                      </td>
                      <td className="py-5 px-7 text-right">
                        {assignment.is_manual ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
                              <span className="material-symbols-outlined text-[14px]">edit_note</span>
                              Manual
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                              Auto
                            </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (Screen < md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-4 space-y-3.5 hover:bg-slate-50/40 transition-colors">
                  {/* Top Row: Officer Identity + Assignment Type Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black font-pjs text-base shrink-0">
                        {formatOfficerName(assignment.officer_name).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-pjs font-bold text-[#003624] text-[15px] leading-tight truncate">
                          {formatOfficerName(assignment.officer_name)}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                          SWAFO Officer
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {assignment.is_manual ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                          <span className="material-symbols-outlined text-[13px]">edit_note</span>
                          Manual
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <span className="material-symbols-outlined text-[13px]">smart_toy</span>
                          Auto
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Full-width Zone Selector */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Designated Zone (Manual Override)
                    </label>
                    <div className="relative w-full">
                      <select 
                        value={assignment.zone || ''}
                        onChange={(e) => handleManualZoneChange(assignment.id, e.target.value)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-[#003624] font-bold text-[13px] rounded-xl pl-3.5 pr-10 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                      >
                        {ZONES.map(z => (
                          <option key={z} value={z}>{z.replace(/^Zone \d+: /, '')}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


