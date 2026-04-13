import React, { useState } from 'react';

export default function ChatBot() {
  const [input, setInput] = useState('');

  return (
    <div className="h-[calc(100vh-144px)] flex flex-col lg:flex-row gap-8 lg:gap-12 animate-fade-in-up max-w-[1400px] mx-auto w-full -mt-2">
      
      {/* ═══════════════════════ LEFT COLUMN: CHAT AREA ═══════════════════════ */}
      <div className="flex-1 flex flex-col h-[calc(100vh-144px)] relative">
        
        {/* Chat History / Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 pr-2 lg:pr-4">
          
          {/* Welcome Header */}
          <div className="flex flex-col items-center text-center mt-8 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e6fbf1] mb-6">
              <span className="material-symbols-outlined text-[15px] text-[#059669]">verified</span>
              <span className="text-[11px] font-pjs font-bold text-[#059669] tracking-widest uppercase">
                Official Chatbot Assistant
              </span>
            </div>
            <h1 className="text-[2.8rem] lg:text-[3.2rem] font-pjs font-bold text-[#1c2b26] leading-tight mb-2 tracking-tight">
              Hello, Michael.
            </h1>
            <p className="text-[1.1rem] lg:text-[1.2rem] font-manrope text-[#606d67]">
              How can I assist with your inquiries today?
            </p>
          </div>

          {/* Messages Container */}
          <div className="space-y-8 max-w-3xl mx-auto w-full">
            
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-[#0b4d3c] text-white p-5 lg:p-6 rounded-[1.25rem] rounded-tr-sm max-w-[85%] shadow-md">
                <p className="text-[14px] lg:text-[15px] font-manrope font-medium leading-relaxed">
                  Can you explain the current policy regarding dormitory visiting hours for external guests?
                </p>
              </div>
            </div>

            {/* Bot Message */}
            <div className="flex justify-start">
              <div className="bg-white rounded-[1.25rem] border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden max-w-[95%] relative flex">
                
                {/* Left Green Accent Border */}
                <div className="w-2 bg-[#059669] shrink-0" />
                
                <div className="p-6 lg:p-8 flex-1">
                  
                  {/* Bot Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-[#e6fbf1] flex items-center justify-center text-[#059669]">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    </div>
                    <span className="text-[11px] font-pjs font-bold text-[#0b4d3c] uppercase tracking-widest">
                      Chatbot • Response
                    </span>
                  </div>

                  {/* Bot Content */}
                  <div className="space-y-4 text-[14px] lg:text-[15px] font-manrope text-[#404943] leading-relaxed mb-6">
                    <p>
                      According to the <strong className="text-[#1c2b26]">2025 University Handbook (Section IV, Part C)</strong>, the visiting hours for external guests in campus dormitories are as follows:
                    </p>
                    <p>
                      <strong className="text-[#1c2b26]">Monday – Thursday:</strong> 10:00 AM to 10:00 PM
                    </p>
                    <p>
                      <strong className="text-[#1c2b26]">Friday – Sunday:</strong> 10:00 AM to 12:00 AM (Midnight)
                    </p>
                    <p>
                      <strong className="text-[#1c2b26]">Overnight Guests:</strong> Must be registered at least 24 hours in advance via the Housing Portal and are limited to 3 nights per semester.
                    </p>
                  </div>

                  {/* Source Box */}
                  <div className="bg-[#f8fbf9] rounded-xl p-4 flex items-center gap-3 mb-6 border border-black/5">
                    <span className="material-symbols-outlined text-[#059669] text-[20px]">menu_book</span>
                    <p className="text-[13px] font-manrope font-medium text-portal-text-muted/70">
                      Source: Handbook_Section_IV_Final.pdf • Page 42
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-6 pt-2">
                    <button className="flex items-center gap-2 text-[#059669] hover:text-[#0b4d3c] transition-colors text-[13px] font-pjs font-bold">
                      <span className="material-symbols-outlined text-[18px]">content_copy</span> Copy
                    </button>
                    <button className="flex items-center gap-2 text-[#059669] hover:text-[#0b4d3c] transition-colors text-[13px] font-pjs font-bold">
                      <span className="material-symbols-outlined text-[18px]">share</span> Share
                    </button>
                    <button className="flex items-center gap-2 text-[#059669] hover:text-[#0b4d3c] transition-colors text-[13px] font-pjs font-bold">
                      <span className="material-symbols-outlined text-[18px]">thumb_up</span> Helpful
                    </button>
                  </div>

                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* ═══════════════════════ INPUT AREA (FIXED BOTTOM) ═══════════════════════ */}
        <div className="absolute bottom-0 left-0 right-0 pt-8 pb-2 bg-gradient-to-t from-portal-bg via-portal-bg to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.05)] border border-black/5 p-2 flex items-center gap-3 mb-4 relative z-10">
              <button className="w-12 h-12 flex items-center justify-center text-[#94a3b8] hover:text-[#0b4d3c] transition-colors rounded-full hover:bg-slate-50 shrink-0">
                <span className="material-symbols-outlined text-[20px] font-light">attach_file</span>
              </button>
              
              <input 
                type="text"
                placeholder="Ask about academic policies, rules, or campus guidelines..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent border-none text-[15px] font-manrope font-medium text-[#1a1a1a] focus:outline-none placeholder:text-[#94a3b8]"
              />
              
              <button className="w-12 h-12 rounded-full bg-[#0b4d3c] text-white flex items-center justify-center shadow-md hover:bg-[#003624] transition-all shrink-0">
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-center px-4">
              <div className="flex items-center gap-1.5 text-[10px] font-pjs font-bold text-[#94a3b8] uppercase tracking-widest">
                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                AI CAN MAKE MISTAKES
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-pjs font-bold text-[#94a3b8] uppercase tracking-widest">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                SECURE CONTEXT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ RIGHT COLUMN: SIDEBAR ═══════════════════════ */}
      <div className="hidden lg:flex w-[320px] xl:w-[360px] shrink-0 border-l border-black/5 pl-8 xl:pl-10 flex-col justify-between h-full py-4 relative z-10">
        
        {/* Top: Suggested */}
        <div className="overflow-y-auto custom-scrollbar pr-2 pb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-full border-2 border-[#059669] flex items-center justify-center text-[#059669]">
              <span className="material-symbols-outlined text-[24px]">lightbulb</span>
            </div>
            <h3 className="text-[20px] font-pjs font-bold text-[#059669] tracking-widest uppercase">SUGGESTED</h3>
          </div>
          
          <div className="space-y-3">
            {[
              "What is the dress code policy?",
              "What are the curfew hours for dormitories?",
              "What happens if I violate a university rule?",
              "Where can I find the complete handbook?",
              "What are restricted areas on campus?"
            ].map((q, i) => (
              <button 
                key={i} 
                className="w-full text-left bg-[#0b4d3c] hover:bg-[#003624] text-white px-5 py-4 rounded-[1rem] text-[13px] font-manrope font-medium transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom: How it Works */}
        <div className="mt-auto pt-8 border-t border-black/5">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#059669] text-[20px]">info</span>
            <h4 className="text-[12px] font-pjs font-bold text-[#059669] tracking-widest uppercase">
              How it works
            </h4>
          </div>
          
          <ul className="space-y-5">
            <li className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
              <p className="text-[12px] font-manrope text-[#526059] leading-relaxed">
                Ask specific questions about academic or residential policies.
              </p>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
              <p className="text-[12px] font-manrope text-[#526059] leading-relaxed">
                Get citations linked directly to the official University Handbook.
              </p>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-2 shrink-0" />
              <p className="text-[12px] font-manrope text-[#526059] leading-relaxed">
                The assistant learns from current university amendments.
              </p>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
