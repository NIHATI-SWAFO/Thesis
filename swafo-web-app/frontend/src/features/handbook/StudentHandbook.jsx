import React, { useState, useMemo } from 'react';

// Mock data strictly matching the requested sub-item structure
const HANDBOOK_SECTIONS = [
  {
    id: "sec-1",
    title: "Code of Conduct",
    icon: "gavel", // Using gavel or balance
    subItems: [
      {
        title: "Professionalism",
        content: "Maintaining a high standard of decorum in all academic and social interactions within the campus."
      },
      {
        title: "Accountability",
        content: "Students are responsible for their actions and the resulting impact on the campus community."
      },
      {
        title: "Conflict Resolution",
        content: "Formal procedures for resolving disputes through mediation and peer review boards."
      }
    ]
  },
  {
    id: "sec-2",
    title: "Academic Integrity",
    icon: "menu_book",
    subItems: [
      {
        title: "Plagiarism",
        content: "Submitting another person's work, ideas, or words as your own without proper attribution is strictly forbidden."
      },
      {
        title: "Cheating",
        content: "Unauthorized use of materials, information, or study aids in any academic exercise."
      }
    ]
  },
  {
    id: "sec-3",
    title: "Student Dress Code",
    icon: "checkroom",
    subItems: [
      {
        title: "Campus Attire",
        content: "Students are required to wear appropriate and modest attire while on campus grounds."
      },
      {
        title: "Laboratory Uniforms",
        content: "Specific departments require designated safety uniforms which must be strictly followed."
      }
    ]
  },
  {
    id: "sec-4",
    title: "Campus Safety",
    icon: "security",
    subItems: [
      {
        title: "Emergency Procedures",
        content: "Guidelines for evacuation, lockdowns, and reporting hazards to campus security."
      }
    ]
  },
  {
    id: "sec-5",
    title: "Restricted Areas",
    icon: "block",
    subItems: [
      {
        title: "Unauthorized Access",
        content: "Entering designated faculty-only zones, server rooms, or maintenance areas without clearance is a severe violation."
      }
    ]
  },
  {
    id: "sec-6",
    title: "Substance Policy",
    icon: "warning",
    subItems: [
      {
        title: "Zero Tolerance",
        content: "The possession, use, or distribution of illicit substances on campus grounds will result in immediate suspension."
      }
    ]
  },
  {
    id: "sec-7",
    title: "Curfew and Dormitory Rules",
    icon: "bed",
    subItems: [
      {
        title: "Visiting Hours",
        content: "Non-resident guests are only permitted in lounge areas until 10:00 PM."
      }
    ]
  }
];

export default function StudentHandbook() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState(new Set(['sec-1']));

  const toggleSection = (id) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return HANDBOOK_SECTIONS;
    
    const lowerQuery = searchQuery.toLowerCase();
    
    return HANDBOOK_SECTIONS.filter(sec => {
      // Check title
      if (sec.title.toLowerCase().includes(lowerQuery)) return true;
      // Check sub items
      return sec.subItems.some(sub => 
        sub.title.toLowerCase().includes(lowerQuery) || 
        sub.content.toLowerCase().includes(lowerQuery)
      );
    });
  }, [searchQuery]);

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 animate-fade-in-up pb-12">
      
      {/* ═══════════════════════ MAIN GREEN HEADER ═══════════════════════ */}
      <div className="relative overflow-hidden bg-[#0a6c4c] p-8 md:p-10 rounded-[2rem] shadow-[0_4px_20px_rgba(0,107,93,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-8 group">
        
        {/* Minimal Right Edge Shine (Matching User Mockup) */}
        <div className="absolute top-0 right-0 w-[30%] h-full pointer-events-none bg-gradient-to-l from-[#20a07a] to-transparent opacity-80" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 mb-6 transition-all">
            <span className="text-[10px] font-pjs font-bold text-white tracking-[0.15em] uppercase">
              Official Document
            </span>
          </div>
          <h1 className="text-[2.2rem] md:text-[2.8rem] font-pjs font-bold text-white leading-tight tracking-tight mb-3">
            Student Handbook 2025–2026
          </h1>
          <p className="text-white/80 font-manrope text-[14px] md:text-[15px] font-medium leading-relaxed max-w-xl">
            The comprehensive guide to all campus operations,
            <br className="hidden md:block"/> rights, and expectations.
          </p>
        </div>

        <button className="relative z-10 shrink-0 self-start md:self-center flex items-center justify-center gap-2 bg-white text-[#0a6c4c] px-6 py-3 md:px-8 md:py-3.5 rounded-full font-pjs font-bold text-[14px] shadow-sm hover:bg-emerald-50 active:scale-95 transition-all outline-none">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Download PDF
        </button>
      </div>

      {/* ═══════════════════════ SEARCH BAR ═══════════════════════ */}
      <div className="relative pt-4 pb-2">
        <div className="absolute inset-y-0 left-0 top-4 bottom-2 pl-6 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-[#006b5d]/50 text-[22px]">search</span>
        </div>
        <input
          type="text"
          placeholder="Search policies, rules, or guidelines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-black/5 placeholder:text-portal-text-muted/40 text-[#1a1a1a] text-[14px] font-manrope font-medium rounded-2xl py-4 flex pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-[#006b5d]/20 transition-all shadow-sm"
        />
      </div>

      {/* ═══════════════════════ ACCORDION LIST ═══════════════════════ */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[1.5rem] border border-black/5 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <h3 className="text-lg font-pjs font-bold text-[#1a1a1a] mb-1">No results found</h3>
            <p className="text-[14px] font-manrope text-portal-text-muted">We couldn't match "{searchQuery}" to any handbook policy.</p>
          </div>
        ) : (
          filteredSections.map((section) => {
            const isOpen = expandedSections.has(section.id);

            return (
              <div 
                key={section.id} 
                className={`transition-all duration-300 rounded-[1.25rem] overflow-hidden ${
                  isOpen 
                    ? 'bg-white shadow-[0_10px_40px_rgba(0,107,93,0.08)] border border-black/5' 
                    : 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-transparent hover:border-black/5'
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none bg-transparent"
                >
                  <div className="flex items-center gap-4">
                    {/* Dynamic Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isOpen 
                        ? 'bg-[#2bd99b] text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                    </div>
                    <h3 className={`text-[15px] font-pjs font-bold transition-colors ${
                      isOpen ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]'
                    }`}>
                      {section.title}
                    </h3>
                  </div>
                  
                  <span className={`material-symbols-outlined transition-transform duration-300 ${
                    isOpen ? 'text-[#006b5d] rotate-180' : 'text-slate-400'
                  }`}>
                    expand_more
                  </span>
                </button>
                
                {/* Accordion Content area */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-[4rem] pb-8 pt-2">
                      {/* Inner Green Line Container */}
                      <div className="border-l-[2.5px] border-[#2bd99b]/60 pl-6 space-y-6">
                        {section.subItems.map((item, index) => (
                          <div key={index} className="flex flex-col gap-1.5">
                            <h4 className="text-[13px] font-pjs font-bold text-[#006b5d]">
                              {item.title}
                            </h4>
                            <p className="text-[13px] font-manrope font-medium text-portal-text-muted/80 leading-relaxed">
                              {item.content}
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
      </div>

    </div>
  );
}
