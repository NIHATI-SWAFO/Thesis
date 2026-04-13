import React, { useState, useMemo } from 'react';

// Mock data for the handbook sections
const HANDBOOK_SECTIONS = [
  {
    id: "sec-1",
    title: "1. Core Values and Code of Conduct",
    content: "The University is committed to fostering an environment of academic excellence, integrity, and respect. Students are expected to uphold these core values in all their interactions within and outside the campus. This includes maintaining proper decorum, respecting the rights of others, and adhering to all institutional policies. Any form of harassment, discrimination, or disruptive behavior is strictly prohibited and subject to disciplinary action."
  },
  {
    id: "sec-2",
    title: "2. Academic Integrity Policy",
    content: "Academic integrity is the foundation of the University's educational mission. Plagiarism, cheating, fabrication, and facilitating academic dishonesty are serious offenses. Students caught engaging in these activities will face severe penalties, ranging from a failing grade in the course to suspension or expulsion from the University. All submitted work must be the student's original creation unless properly cited."
  },
  {
    id: "sec-3",
    title: "3. Dress Code and Campus Attire",
    content: "Students are required to wear appropriate and modest attire while on campus. Clothing that is excessively revealing, displays offensive language or imagery, or is deemed distracting to the learning environment is not permitted. Specific departments or laboratories may have additional dress requirements for safety reasons, which must be strictly followed."
  },
  {
    id: "sec-4",
    title: "4. Attendance and Punctuality",
    content: "Regular attendance is crucial for academic success. Students are expected to attend all scheduled classes, laboratory sessions, and required university events. A student who accumulates unexcused absences exceeding 20% of the total class hours may be dropped from the course. Valid excuses (e.g., medical reasons) require documentation."
  },
  {
    id: "sec-5",
    title: "5. Campus Facilities and Resources",
    content: "Campus facilities, including the library, laboratories, and recreational areas, are provided for the benefit of all students. Users are expected to handle equipment with care, follow usage guidelines, and respect the operating hours. Unauthorized access to restricted areas or intentional damage to university property will result in disciplinary action and financial liability."
  },
  {
    id: "sec-6",
    title: "6. Disciplinary Procedures",
    content: "Violations of the Student Code of Conduct are handled by the Student Disciplinary Board. Procedures include a formal complaint, investigation, hearing, and the imposition of sanctions if found guilty. Students have the right to due process, including the right to be informed of the charges and the right to appeal decisions within a specified timeframe."
  }
];

export default function StudentHandbook() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState(new Set(['sec-1'])); // Default open first section

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
    return HANDBOOK_SECTIONS.filter(
      sec => sec.title.toLowerCase().includes(lowerQuery) || 
             sec.content.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  return (
    <div className="max-w-[1100px] mx-auto space-y-10 animate-fade-in-up pb-12">
      
      {/* ═══════════════════════ MAIN GREEN HEADER ═══════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#006b5d] to-[#009b83] p-10 rounded-[2rem] shadow-[0_15px_40px_rgba(0,107,93,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-8 border border-white/10 group">
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-[40%] h-full pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-700">
          <svg className="absolute w-full h-full" viewBox="0 0 400 400" fill="none">
             <circle cx="350" cy="50" r="200" stroke="white" strokeWidth="40" />
             <circle cx="350" cy="50" r="300" stroke="white" strokeWidth="20" />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm mb-6 shadow-sm">
            <span className="text-[10px] font-pjs font-bold text-white tracking-[0.2em] uppercase">
              Official Document
            </span>
          </div>
          <h1 className="text-[2.5rem] md:text-[3rem] font-pjs font-bold text-white leading-tight tracking-tight mb-3 drop-shadow-md">
            Student Handbook 2025–2026
          </h1>
          <p className="text-white/80 font-manrope text-[15px] font-medium leading-relaxed max-w-xl">
            The comprehensive guide to all campus operations, rights, and expectations.
          </p>
        </div>

        <button className="relative z-10 shrink-0 self-start md:self-center flex items-center gap-2.5 bg-white text-[#006b5d] px-8 py-4 rounded-full font-pjs font-bold text-[14px] shadow-xl hover:bg-[#ecf6f3] active:scale-95 transition-all outline-none">
          <span className="material-symbols-outlined text-[20px]">download</span>
          Download PDF
        </button>
      </div>

      {/* ═══════════════════════ SEARCH AND CONTENT ═══════════════════════ */}
      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-emerald-50/80 p-8">
        
        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[#006b5d]/50 text-[24px]">search</span>
          </div>
          <input
            type="text"
            placeholder="Search policies, rules, or guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f2fcf8]/50 border border-emerald-100 placeholder:text-emerald-800/30 text-[#1a1a1a] text-[15px] font-manrope font-medium rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-[#006b5d]/20 transition-all shadow-inner"
          />
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {filteredSections.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">search_off</span>
              </div>
              <h3 className="text-lg font-pjs font-bold text-[#1a1a1a] mb-1">No results found</h3>
              <p className="text-[14px] font-manrope text-portal-text-muted">We couldn't match "{searchQuery}" to any handbook policy.</p>
            </div>
          ) : (
            filteredSections.map((section) => {
              const isOpen = expandedSections.has(section.id);
              
              // Optional: Highlight search terms logic could go here, but keeping it simple for now.

              return (
                <div 
                  key={section.id} 
                  className={`border transition-all duration-300 rounded-2xl overflow-hidden ${
                    isOpen 
                      ? 'border-[#006b5d]/30 bg-white shadow-[0_8px_20px_rgba(0,107,93,0.06)]' 
                      : 'border-emerald-50 bg-[#fbfdfc] hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  >
                    <h3 className={`text-[16px] font-pjs font-bold transition-colors ${isOpen ? 'text-[#006b5d]' : 'text-[#1a1a1a]'}`}>
                      {section.title}
                    </h3>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'bg-[#006b5d] text-white rotate-180' : 'bg-emerald-50 text-[#006b5d]'}`}>
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </div>
                  </button>
                  
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 pb-6 pt-2">
                        <div className="h-[1px] w-full bg-emerald-50 mb-4"></div>
                        <p className="text-[14px] font-manrope text-portal-text-muted leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
