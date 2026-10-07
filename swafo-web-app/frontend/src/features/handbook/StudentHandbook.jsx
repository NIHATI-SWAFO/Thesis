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
            title: rule.title || `Section ${rule.rule_code}`,
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

  function getIconForCategory(cat) {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('cloth') || lower.includes('dress') || lower.includes('uniform')) return 'checkroom';
    if (lower.includes('dishonest') || lower.includes('cheat') || lower.includes('plagiar')) return 'school';
    if (lower.includes('violent') || lower.includes('brawl') || lower.includes('assault')) return 'warning';
    if (lower.includes('misconduct') || lower.includes('conduct')) return 'gavel';
    if (lower.includes('behavior') || lower.includes('loiter')) return 'record_voice_over';
    if (lower.includes('safety') || lower.includes('security')) return 'security';
    return 'policy';
  }

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
    <div className="max-w-[1100px] mx-auto space-y-6 max-md:space-y-4 animate-fade-in-up pb-12 max-md:pb-32">

      {/* ═══════════════════════ MAIN GREEN HEADER ═══════════════════════ */}
      <div className="relative overflow-hidden bg-[#0a6c4c] p-8 md:p-10 max-md:py-5 max-md:px-5 rounded-[2rem] shadow-[0_4px_20px_rgba(0,107,93,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-8 max-md:gap-4 group">

        {/* Minimal Right Edge Shine (Matching User Mockup) */}
        <div className="absolute top-0 right-0 w-[30%] h-full pointer-events-none bg-gradient-to-l from-[#20a07a] to-transparent opacity-80" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 mb-6 transition-all">
            <span className="text-[10px] font-pjs font-bold text-white tracking-[0.15em] uppercase">
              Official Document
            </span>
          </div>
          <h1 className="text-[2.2rem] md:text-[2.8rem] max-md:text-[24px] font-pjs font-bold text-white leading-tight tracking-tight mb-3 max-md:mb-1">
            Student Handbook 2025–2026
          </h1>
          <p className="text-white/80 font-manrope text-[14px] md:text-[15px] max-md:text-[13px] font-medium leading-relaxed max-w-xl">
            The comprehensive guide to all campus operations,
            <br className="hidden md:block" /> rights, and expectations.
          </p>
        </div>

        <a
          href="/DLSU-D-Student-Handbook-SY2023-2027.pdf"
          download
          className="relative z-10 shrink-0 self-start md:self-center outline-none max-md:w-full max-md:mt-2"
        >
          <button className="flex items-center justify-center max-md:w-full gap-2 bg-white text-[#0a6c4c] px-6 py-3 md:px-8 md:py-3.5 rounded-full font-pjs font-bold text-[14px] shadow-sm hover:bg-emerald-50 active:scale-95 transition-all outline-none">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download PDF
          </button>
        </a>
      </div>

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
              value={searchQuery || ""}
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
            className={`px-3 py-1 rounded-lg text-xs font-pjs font-bold tracking-wider transition-all cursor-pointer ${severityFilter === 'ALL' && selectedCategory === 'ALL'
              ? 'bg-[#003624] text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
          >
            All Policies ({totalRulesCount})
          </button>
          <button
            onClick={() => { setSeverityFilter('MINOR'); setSelectedCategory('ALL'); }}
            className={`px-3 py-1 rounded-lg text-xs font-pjs font-bold tracking-wider transition-all cursor-pointer ${severityFilter === 'MINOR'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
              }`}
          >
            Minor Offenses ({minorRulesCount})
          </button>
          <button
            onClick={() => { setSeverityFilter('MAJOR'); setSelectedCategory('ALL'); }}
            className={`px-3 py-1 rounded-lg text-xs font-pjs font-bold tracking-wider transition-all cursor-pointer ${severityFilter === 'MAJOR'
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
                className={`px-3 py-1.5 rounded-full text-xs font-pjs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                  ? 'bg-[#003624] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
              >
                <span>{cat.title}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
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
                className={`bg-white rounded-2xl sm:rounded-3xl border transition-all duration-200 overflow-hidden ${isOpen
                  ? 'border-emerald-200/80 shadow-md ring-1 ring-emerald-50'
                  : 'border-slate-100 shadow-sm hover:border-slate-200'
                  }`}
              >
                {/* Section Accordion Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-5 max-md:py-3 max-md:px-4 flex items-center justify-between text-left focus:outline-none bg-transparent"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isOpen
                      ? (section.isMajor ? 'bg-rose-700 text-white shadow-xs' : 'bg-[#003624] text-white shadow-xs')
                      : (section.isMajor ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-[#003624]')
                      }`}>
                      <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                    </div>
                    <h3 className={`text-[15px] max-md:text-[14px] font-pjs font-bold transition-colors ${isOpen ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]'
                      }`}>
                      {section.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-400 hidden sm:inline-block">
                      {isOpen ? 'Hide' : 'View'}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 ${isOpen ? 'bg-slate-100 rotate-180 text-emerald-800' : 'text-slate-400'
                      }`}>
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </div>
                  </div>
                </button>

                {/* Accordion Content area */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-[4rem] max-md:px-6 pb-8 max-md:pb-4 pt-2">
                      {/* Inner Green Line Container */}
                      <div className="border-l-[2.5px] border-[#2bd99b]/60 pl-6 max-md:pl-4 space-y-6 max-md:space-y-4">
                        {section.subItems.map((item, index) => (
                          <div key={index} className="flex flex-col gap-1.5">
                            <h4 className="text-[13px] max-md:text-[12px] font-pjs font-bold text-[#006b5d]">
                              <HighlightMatch text={item.title} query={searchQuery} />
                            </h4>
                            <p className="text-[13px] max-md:text-[12px] font-manrope font-medium text-portal-text-muted/80 leading-relaxed max-md:leading-snug">
                              <HighlightMatch text={item.content} query={searchQuery} />
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
                );
          })
        )}
              </section>

      {/* ═══════════════════════ FOOTER NOTICE ═══════════════════════ */ }
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

function HighlightMatch({ text, query }) {
  if (!text) return null;
  if (!query || !query.trim()) return <span>{text}</span>;

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={index} className="bg-emerald-100 text-emerald-900 rounded px-1 py-0.5 font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
