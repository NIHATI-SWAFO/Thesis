import React, { useState, useRef, useEffect } from 'react';

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! I'm your AI Curator. I can help you understand university policies, student handbooks, and academic guidelines. What can I help you with today?",
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Mock bot response
    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: "I'm processing your inquiry about \"" + input + "\". Currently, I can provide information based on the 2024-2025 Student Handbook. Is there a specific section you'd like me to look up?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  return (
    <div className="h-[calc(100vh-180px)] max-w-[1100px] mx-auto flex flex-col animate-fade-in-up">
      
      {/* ═══════════════════════ CHAT HEADER ═══════════════════════ */}
      <div className="bg-white p-6 rounded-t-[2rem] border-x border-t border-emerald-50/50 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#003624] flex items-center justify-center text-white shadow-lg relative">
            <span className="material-symbols-outlined text-[26px]">smart_toy</span>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#2bd99b] rounded-full border-[3px] border-white shadow-sm" />
          </div>
          <div>
            <h2 className="text-[18px] font-pjs font-bold text-[#1a1a1a]">AI Curator</h2>
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-manrope text-[#2bd99b] font-bold uppercase tracking-wider">Online</p>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <p className="text-[12px] font-manrope text-portal-text-muted/40 font-medium">Policy Expert</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 transition-all outline-none">
                <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <button className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 transition-all outline-none">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
        </div>
      </div>

      {/* ═══════════════════════ MESSAGES AREA ═══════════════════════ */}
      <div className="flex-1 bg-[#fcfdfd] border-x border-emerald-50/50 p-8 overflow-y-auto custom-scrollbar space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
          >
            <div className={`max-w-[70%] flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-5 rounded-[1.5rem] shadow-sm text-[14px] leading-relaxed font-manrope font-medium ${
                msg.type === 'user' 
                  ? 'bg-[#006b5d] text-white rounded-tr-none' 
                  : 'bg-white text-[#1a1a1a] border border-emerald-50/50 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] font-manrope text-slate-400 font-bold uppercase tracking-wider mt-2.5 px-1">{msg.time}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ═══════════════════════ INPUT AREA ═══════════════════════ */}
      <div className="bg-white p-6 rounded-b-[2rem] border-x border-b border-emerald-50/50 shadow-[0_-4px_30px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSend} className="relative flex items-center gap-4">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-[22px]">auto_fix_high</span>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about campus rules or academic guidelines..."
              className="w-full bg-[#f4f7f6] border-none rounded-2xl py-4 pl-14 pr-6 text-[14px] font-manrope font-semibold text-[#1a1a1a] focus:ring-2 focus:ring-[#003624]/10 transition-all outline-none placeholder:text-slate-300"
            />
          </div>
          <button 
            type="submit"
            disabled={!input.trim()}
            className="w-14 h-14 rounded-2xl bg-[#003624] text-white flex items-center justify-center shadow-lg hover:shadow-emerald-900/20 active:scale-90 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            <span className="material-symbols-outlined text-[24px]">send</span>
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-300 font-manrope font-bold uppercase tracking-[0.1em] mt-4">
            AI can make mistakes. Please verify important policies in the Handbook.
        </p>
      </div>

    </div>
  );
}
