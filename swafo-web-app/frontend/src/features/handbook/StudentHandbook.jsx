import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../../api/config';

export default function StudentHandbook({ role = 'student' }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL'); // 'ALL' | 'MINOR' | 'MAJOR'
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [copiedItem, setCopiedItem] = useState(null);

  useEffect(() => {
    fetch(API_ENDPOINTS.HANDBOOK_RULES)
      .then(res => res.json())
      .then(data => {
        const results = Array.isArray(data) ? data : (data.results || []);
        
        const grouped = results.reduce((acc, rule) => {
          const category = rule.category || "General Policies";
          if (!acc[category]) {
            acc[category] = {
              id: `cat-${category.replace(/\s+/g, '-').toLowerCase()}`,
              title: category,
              icon: getIconForCategory(category),
              isMajor: category.toLowerCase().includes('major'),
              subItems: []
            };
          }
          acc[category].subItems.push({
            id: rule.id,
            rule_code: rule.rule_code,
            content: rule.description,
            p1: rule.penalty_1st,
            p2: rule.penalty_2nd,
            p3: rule.penalty_3rd,
            p4: rule.penalty_4th,
            p5: rule.penalty_5th,
          });
          return acc;
        }, {});
        
        const sectionList = Object.values(grouped);
        setSections(sectionList);
        if (sectionList.length > 0) {
          // Default expand all sections for immediate visibility
          setExpandedSections(new Set(sectionList.map(s => s.id)));
        }
      })
      .catch(err => console.error("Handbook fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const getIconForCategory = (cat) => {
    const lower = cat.toLowerCase();
    if (lower.includes('cloth') || lower.includes('dress') || lower.includes('uniform')) return 'checkroom';
    if (lower.includes('dishonest') || lower.includes('cheat') || lower.includes('plagiar')) return 'school';
    if (lower.includes('violent') || lower.includes('brawl') || lower.includes('assault')) return 'warning';
    if (lower.includes('misconduct') || lower.includes('conduct')) return 'gavel';
    if (lower.includes('behavior') || lower.includes('loiter')) return 'record_voice_over';
    if (lower.includes('safety') || lower.includes('security')) return 'security';
    return 'policy';
  };

  const toggleSection = (id) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  // Auto-expand sections when user types a search query
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setExpandedSections(new Set(sections.map(s => s.id)));
    }
  }, [searchQuery, sections]);

  // Overall metric counts
  const totalRulesCount = useMemo(() => {
    return sections.reduce((acc, s) => acc + s.subItems.length, 0);
  }, [sections]);

  const minorRulesCount = useMemo(() => {
    return sections.filter(s => !s.isMajor).reduce((acc, s) => acc + s.subItems.length, 0);
  }, [sections]);

  const majorRulesCount = useMemo(() => {
    return sections.filter(s => s.isMajor).reduce((acc, s) => acc + s.subItems.length, 0);
  }, [sections]);

  // Categories list with counts
  const categoriesWithCounts = useMemo(() => {
    return sections.map(s => ({
      title: s.title,
      count: s.subItems.length,
      isMajor: s.isMajor
    }));
  }, [sections]);

  // Filtered Sections
  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return sections
      .filter(sec => {
        // Severity Filter
        if (severityFilter === 'MINOR' && sec.isMajor) return false;
        if (severityFilter === 'MAJOR' && !sec.isMajor) return false;
        
        // Category Filter
        if (selectedCategory !== 'ALL' && sec.title !== selectedCategory) {
          return false;
        }
        return true;
      })
      .map(sec => {
        if (!query) return sec;
        
        const titleMatch = sec.title.toLowerCase().includes(query);
        const matchingItems = sec.subItems.filter(item =>
          item.rule_code.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          (item.p1 && item.p1.toLowerCase().includes(query)) ||
          (item.p2 && item.p2.toLowerCase().includes(query)) ||
          (item.p3 && item.p3.toLowerCase().includes(query)) ||
          (item.p4 && item.p4.toLowerCase().includes(query))
        );
        
        if (titleMatch) return sec;
        if (matchingItems.length > 0) {
          return { ...sec, subItems: matchingItems };
        }
        return null;
      })
      .filter(Boolean);
  }, [searchQuery, selectedCategory, severityFilter, sections]);

  const handleCopyCitation = (item) => {
    const textToCopy = `Section ${item.rule_code}: ${item.content}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedItem(item.rule_code);
      setTimeout(() => setCopiedItem(null), 2000);
    });
  };

  const handlePrintPdf = () => {
    // Expand all before triggering print
    expandAll();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-[#003624] rounded-full animate-spin mb-4" />
        <p className="font-pjs font-bold text-sm text-[#003624]">Loading Campus Handbook...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving official policy provisions from institutional registry</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-fade-in-up pb-20 print:p-0 print:space-y-4">
      
      {/* Print Specific Overrides */}
      <style>{`
        @media print {
          nav, aside, header, .no-print, button, .bottom-nav-portal {
            display: none !important;
          }
          body, main, #root {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-full-content {
            display: block !important;
          }
          .shadow-sm, .shadow-md, .shadow-lg {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      {/* ═══════════════════════ MAIN HERO BANNER ═══════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#003624] via-[#004d33] to-[#01261a] p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-lg shadow-emerald-950/20 text-white no-print">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 mb-3 sm:mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-pjs font-bold uppercase tracking-wider text-emerald-200">
                {role === 'admin' ? 'SWAFO Institutional Policy Codex' : 'Official DLSU-D Institutional Registry'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-pjs font-extrabold text-white leading-tight tracking-tight mb-2">
              {role === 'admin' ? 'Campus Policy Codex & Sanction Master' : 'Student Handbook 2025–2026'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 font-manrope font-normal leading-relaxed">
              Official university codex on student rights, campus safety, academic honesty, dress code regulations, and the progressive disciplinary sanction matrix.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button 
              onClick={handlePrintPdf}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-white text-[#003624] hover:bg-emerald-50 font-pjs font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print / Save PDF
            </button>
            {role === 'admin' ? (
              <Link 
                to="/admin/cases"
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 font-pjs font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 no-underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                Case Oversight
              </Link>
            ) : (
              <Link 
                to="/student/chatbot"
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 font-pjs font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 no-underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Ask AI Curator
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ STATS & QUICK METRICS ═══════════════════════ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 no-print">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#003624] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">menu_book</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-pjs">Total Rules</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-pjs">{totalRulesCount} Codified</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">info</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-pjs">Minor Policies</p>
            <p className="text-lg sm:text-xl font-extrabold text-amber-700 font-pjs">{minorRulesCount} Sections</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-pjs">Major Offenses</p>
            <p className="text-lg sm:text-xl font-extrabold text-rose-700 font-pjs">{majorRulesCount} Sections</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">verified</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-pjs">Academic Year</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 font-pjs">2025–2026</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SEARCH & CONTROLS ═══════════════════════ */}
      <section className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm space-y-4 no-print">
        
        {/* Top Control Bar: Search + Expand/Collapse */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by rule code (e.g. 27.1.2.1), dress code, misconduct, suspension..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 font-manrope transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 rounded-lg text-xs font-pjs font-bold text-slate-600 hover:text-[#003624] hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">unfold_more</span>
              Expand All
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-lg text-xs font-pjs font-bold text-slate-600 hover:text-[#003624] hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">unfold_less</span>
              Collapse All
            </button>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 font-pjs mr-1 hidden sm:inline-block">
            Scope:
          </span>
          <button
            onClick={() => { setSeverityFilter('ALL'); setSelectedCategory('ALL'); }}
            className={`px-3 py-1 rounded-lg text-xs font-pjs font-bold tracking-wider transition-all cursor-pointer ${
              severityFilter === 'ALL' && selectedCategory === 'ALL'
                ? 'bg-[#003624] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All Policies ({totalRulesCount})
          </button>
          <button
            onClick={() => { setSeverityFilter('MINOR'); setSelectedCategory('ALL'); }}
            className={`px-3 py-1 rounded-lg text-xs font-pjs font-bold tracking-wider transition-all cursor-pointer ${
              severityFilter === 'MINOR'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
            }`}
          >
            Minor Offenses ({minorRulesCount})
          </button>
          <button
            onClick={() => { setSeverityFilter('MAJOR'); setSelectedCategory('ALL'); }}
            className={`px-3 py-1 rounded-lg text-xs font-pjs font-bold tracking-wider transition-all cursor-pointer ${
              severityFilter === 'MAJOR'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
            }`}
          >
            Major Violations ({majorRulesCount})
          </button>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 font-pjs mr-1 shrink-0 hidden sm:inline-block">
            Categories:
          </span>
          {categoriesWithCounts.map((cat) => {
            const isSelected = selectedCategory === cat.title;
            return (
              <button
                key={cat.title}
                onClick={() => {
                  setSelectedCategory(isSelected ? 'ALL' : cat.title);
                  // Sync severity filter
                  if (!isSelected) {
                    setSeverityFilter(cat.isMajor ? 'MAJOR' : 'MINOR');
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-pjs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-[#003624] text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{cat.title}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════ ACCORDION POLICY LIST ═══════════════════════ */}
      <section className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="py-14 sm:py-20 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[32px]">menu_book</span>
            </div>
            <h3 className="font-pjs font-bold text-base text-slate-800 mb-1">No Matching Handbook Policies</h3>
            <p className="text-xs text-slate-400 font-manrope max-w-sm mx-auto">
              We couldn't find any policy matching "{searchQuery}". Try using different terms or ask the AI Policy Curator.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setSeverityFilter('ALL'); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reset Filters
              </button>
              {role !== 'admin' && (
                <Link 
                  to="/student/chatbot"
                  className="px-4 py-2 bg-[#003624] text-white rounded-xl text-xs font-bold transition-all no-underline cursor-pointer"
                >
                  Ask AI Assistant
                </Link>
              )}
            </div>
          </div>
        ) : (
          filteredSections.map((section) => {
            const isOpen = expandedSections.has(section.id);

            return (
              <div 
                key={section.id} 
                className={`bg-white rounded-2xl sm:rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'border-emerald-200/80 shadow-md ring-1 ring-emerald-50' 
                    : 'border-slate-100 shadow-sm hover:border-slate-200'
                }`}
              >
                {/* Section Accordion Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer bg-white"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isOpen 
                        ? (section.isMajor ? 'bg-rose-700 text-white shadow-xs' : 'bg-[#003624] text-white shadow-xs')
                        : (section.isMajor ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-[#003624]')
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-pjs font-bold text-slate-900 leading-snug truncate">
                          {section.title}
                        </h3>
                        {section.isMajor ? (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/60">
                            Major Severity
                          </span>
                        ) : (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60">
                            Minor Policy
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-manrope">
                        {section.subItems.length} official regulation{section.subItems.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-400 hidden sm:inline-block">
                      {isOpen ? 'Hide' : 'View'}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 ${
                      isOpen ? 'bg-slate-100 rotate-180 text-emerald-800' : 'text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </div>
                  </div>
                </button>
                
                {/* Accordion Content Area */}
                {isOpen && (
                  <div className="px-4 sm:px-8 pb-6 pt-2 border-t border-slate-100 bg-slate-50/40">
                    <div className="divide-y divide-slate-100">
                      {section.subItems.map((item) => (
                        <div key={item.id || item.rule_code} className="py-4 first:pt-2 last:pb-0 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#003624]/5 border border-[#003624]/10 text-xs font-mono font-bold text-[#003624]">
                                <span className="material-symbols-outlined text-[13px]">tag</span>
                                Section {item.rule_code}
                              </span>

                              {section.isMajor ? (
                                <span className="sm:hidden px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/60">
                                  Major
                                </span>
                              ) : (
                                <span className="sm:hidden px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60">
                                  Minor
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleCopyCitation(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-pjs font-bold text-slate-500 hover:text-[#003624] hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                              title="Copy rule citation to clipboard"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {copiedItem === item.rule_code ? 'check' : 'content_copy'}
                              </span>
                              <span>{copiedItem === item.rule_code ? 'Copied!' : 'Copy Citation'}</span>
                            </button>
                          </div>

                          <p className="text-xs sm:text-sm font-manrope font-medium text-slate-800 leading-relaxed">
                            {item.content}
                          </p>

                          {/* Sanction Matrix Ladder */}
                          {(item.p1 || item.p2 || item.p3 || item.p4 || item.p5) && (
                            <div className="pt-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-pjs mb-1.5">
                                Disciplinary Sanction Escalation Matrix:
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-manrope">
                                {item.p1 && (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                    <span className="text-[9.5px] font-extrabold uppercase text-slate-400">1st:</span>
                                    <span className="font-semibold">{item.p1}</span>
                                  </div>
                                )}
                                {item.p2 && (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                    <span className="text-[9.5px] font-extrabold uppercase text-slate-400">2nd:</span>
                                    <span className="font-semibold">{item.p2}</span>
                                  </div>
                                )}
                                {item.p3 && (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                    <span className="text-[9.5px] font-extrabold uppercase text-slate-400">3rd:</span>
                                    <span className="font-semibold">{item.p3}</span>
                                  </div>
                                )}
                                {item.p4 && (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50/80 border border-rose-200 text-rose-800 shadow-2xs">
                                    <span className="text-[9.5px] font-extrabold uppercase text-rose-600">Escalation:</span>
                                    <span className="font-bold">{item.p4}</span>
                                  </div>
                                )}
                                {item.p5 && (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 shadow-2xs">
                                    <span className="text-[9.5px] font-extrabold uppercase text-rose-700">Final:</span>
                                    <span className="font-extrabold">{item.p5}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* ═══════════════════════ FOOTER NOTICE ═══════════════════════ */}
      <footer className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-2 no-print">
        <p className="text-xs font-pjs font-bold text-slate-700">
          De La Salle University - Dasmariñas • Student Welfare and Formation Office (SWAFO)
        </p>
        <p className="text-[11px] text-slate-400 font-manrope max-w-xl mx-auto">
          All provisions contained herein are officially sanctioned by the University Discipline Board. For policy inquiries or clarifications, reach out directly through the Student Grievance & Appeal portal or consultation channels.
        </p>
      </footer>

    </div>
  );
}
