import React, { useState } from 'react';
import { 
  History, 
  Map as MapIcon, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  User, 
  ChevronRight, 
  Download, 
  Filter,
  TrendingUp,
  MapPin,
  ClipboardList
} from 'lucide-react';

const PATROL_HISTORY_DATA = [
  {
    id: 'P-1204',
    location: 'ICTC Building',
    officer: 'Officer Daniel Padilla',
    duration: '45 mins',
    date: 'Oct 24, 2023',
    session: '08:00 AM Session',
    photos: 6,
    checkpointsCount: '12 / 12',
    timeRange: '08:00 AM - 08:45 AM',
    status: 'COMPLETED',
    checkpoints: [
      { id: 1, name: 'West Gate Entry', time: '08:05 AM', status: 'secure', note: 'Secure. No anomalies detected.' },
      { id: 2, name: 'Server Room Corridor', time: '08:12 AM', status: 'secure', note: 'Temperature normal. HVAC functioning.' },
      { id: 3, name: 'Administrative Hallway', time: '08:24 AM', status: 'secure', note: 'All offices locked. Cleaning crew present.' },
      { id: 4, name: 'Rear Exit Fire Escape', time: '08:35 AM', status: 'secure', note: 'Clear and accessible. Lighting operational.' }
    ]
  },
  {
    id: 'P-1205',
    location: 'Food Square',
    officer: 'Officer Liza Soberano',
    duration: '38 mins',
    date: 'Oct 24, 2023',
    session: '07:15 AM Session',
    photos: 4,
    checkpointsCount: '08 / 08',
    timeRange: '07:15 AM - 07:53 AM',
    status: 'COMPLETED',
    checkpoints: [
      { id: 1, name: 'Main Entrance', time: '07:18 AM', status: 'secure', note: 'Gates unlocked, area cleared.' },
      { id: 2, name: 'Dining Hall A', time: '07:25 AM', status: 'secure', note: 'Stalls closed, electricity off.' },
      { id: 3, name: 'Storage Area', time: '07:35 AM', status: 'secure', note: 'Locks checked and secured.' },
      { id: 4, name: 'Waste Disposal Pit', time: '07:50 AM', status: 'secure', note: 'Area tidy, collection pending.' }
    ]
  },
  {
    id: 'P-1206',
    location: 'GMH Building',
    officer: 'Officer Kaila Estrada',
    duration: '52 mins',
    date: 'Oct 24, 2023',
    session: '06:00 AM Session',
    photos: 12,
    checkpointsCount: '15 / 15',
    timeRange: '06:00 AM - 06:52 AM',
    status: 'COMPLETED',
    checkpoints: [
      { id: 1, name: 'Basement Parking', time: '06:05 AM', status: 'secure', note: 'Vehicles parked in slots.' },
      { id: 2, name: 'Ground Lobby', time: '06:15 AM', status: 'secure', note: 'Front desk manned, lobby clear.' },
      { id: 3, name: 'Library Entry', time: '06:30 AM', status: 'secure', note: 'Silent study area undisturbed.' },
      { id: 4, name: 'Roof Deck Exit', time: '06:45 AM', status: 'secure', note: 'Accessibility limits verified.' }
    ]
  }
];

export default function PatrolHistory() {
  const [selectedPatrol, setSelectedPatrol] = useState(PATROL_HISTORY_DATA[0]);

  return (
    <div className="max-w-[1400px] mx-auto pb-24 px-8 animate-fade-in font-manrope">
      
      {/* ══════════════════════════════ KPI ROW ══════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 mb-16 pt-10">
        
        {/* Total Patrols - PERFECT PIXEL FIDELITY */}
        <div className="bg-[#004d33] rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,45,30,0.12)] relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-700 group-hover:bg-white/10"></div>
          
          <span className="text-[12px] font-pjs font-bold text-white tracking-[0.05em] relative z-10 block mb-5 uppercase opacity-80">TOTAL PATROLS</span>
          <div className="flex flex-col relative z-10">
            <span className="text-[48px] font-pjs font-bold text-white tracking-tighter leading-none mb-8">560</span>
            <div className="flex items-center gap-2 text-[14px] font-bold text-white">
              <TrendingUp size={16} />
              <span>+12% this month</span>
            </div>
          </div>
        </div>

        <KPIBox label="PHOTOS CAPTURED" value="1,246" subValue="Avg 4.2 per patrol" icon={ImageIcon} />
        <KPIBox label="AVG DURATION" value="56 min" subValue="Stable performance" icon={Clock} />
        <KPIBox label="PATROL AREAS" value="18" subValue="Across 3 campuses" icon={MapPin} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ══════════════════════════════ LEFT COLUMN: RECENT PATROLS ══════════════════════════════ */}
        <div className="lg:col-span-7">
          <div className="flex justify-between items-center mb-10 px-2">
            <h2 className="text-[24px] font-pjs font-bold text-[#111827] tracking-tight">Recent Patrols</h2>
            <div className="flex items-center gap-3">
              <button className="px-5 py-2.5 bg-[#f3f4f6] rounded-xl text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-all">
                Export CSV
              </button>
              <button className="px-5 py-2.5 bg-[#f3f4f6] rounded-xl text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-all">
                Filter
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {PATROL_HISTORY_DATA.map((patrol) => (
              <div 
                key={patrol.id}
                onClick={() => setSelectedPatrol(patrol)}
                className={`bg-white rounded-[1.6rem] p-9 border transition-all duration-400 cursor-pointer group relative overflow-hidden ${
                  selectedPatrol.id === patrol.id 
                    ? 'border-transparent shadow-[0_20px_50px_rgba(0,155,105,0.06)] ring-1 ring-[#009b69]/20' 
                    : 'border-transparent shadow-[0_2px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:bg-gray-50/30'
                }`}
              >
                {/* THIN ACCENT LINE - EXACTLY 2PX */}
                <div className={`absolute top-0 left-0 w-[2.5px] h-full bg-[#004d33] transition-transform duration-300 ${selectedPatrol.id === patrol.id ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-40'}`}></div>
                
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-[22px] font-pjs font-bold text-[#111827] tracking-tight mb-2 leading-none">{patrol.location}</h3>
                    <div className="flex items-center gap-5 mt-4">
                      <span className="flex items-center gap-2 text-[14px] font-medium text-[#6b7280]">
                        <User size={16} className="opacity-40" /> {patrol.officer}
                      </span>
                      <span className="flex items-center gap-2 text-[14px] font-medium text-[#6b7280]">
                        <History size={16} className="opacity-40" /> {patrol.duration} duration
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-[#7cfabb] text-[#003624] text-[10px] font-black rounded-full tracking-widest uppercase shadow-sm">
                    {patrol.status}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 relative flex justify-between items-end">
                  <div className="flex gap-12">
                    <StatInfo label="PHOTOS" value={patrol.photos < 10 ? `0${patrol.photos}` : patrol.photos} />
                    <StatInfo label="CHECKPOINTS" value={patrol.checkpointsCount} />
                    <StatInfo label="TIME RANGE" value={patrol.timeRange} />
                  </div>
                  
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    selectedPatrol.id === patrol.id ? 'bg-[#f0fdf4] text-[#009b69] shadow-sm' : 'bg-[#f9fafb] text-gray-300'
                  }`}>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════ RIGHT COLUMN: PATROL DETAILS ══════════════════════════════ */}
        <div className="lg:col-span-5">
           <div className="bg-white rounded-[2.5rem] p-12 border border-[#f3f4f6] shadow-[0_10px_60px_rgba(0,0,0,0.02)] sticky top-10">
              <span className="text-[11px] font-pjs font-bold text-[#009b69] tracking-[0.3em] uppercase mb-6 block leading-none">PATROL DETAILS</span>
              <h2 className="text-[32px] font-pjs font-bold text-[#111827] tracking-tight mb-4 leading-tight">{selectedPatrol.location} Inspection</h2>
              <div className="flex items-center gap-3 text-[15px] font-medium text-gray-400 mb-12">
                <span>{selectedPatrol.date}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                <span>{selectedPatrol.session}</span>
              </div>

              <div className="mb-12">
                <div className="flex justify-between items-center mb-10">
                  <h4 className="text-[16px] font-bold text-[#111827]">Patrol Checkpoints</h4>
                  <span className="px-3 py-1 bg-[#84ffc8]/20 text-[#009b69] text-[9px] font-bold rounded-md tracking-wider uppercase">100% SECURE</span>
                </div>

                <div className="flex flex-col gap-9 relative pl-6 border-l-[2px] border-slate-100 ml-4">
                  {selectedPatrol.checkpoints.map((cp, i) => (
                    <div key={cp.id} className="relative group/cp">
                      <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover/cp:scale-110">
                        <div className="w-4.5 h-4.5 rounded-full bg-[#10b981] flex items-center justify-center">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      </div>
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="text-[15px] font-bold text-gray-700">{cp.name}</h5>
                        <span className="text-[12px] font-medium text-gray-400 leading-none">{cp.time}</span>
                      </div>
                      <p className="text-[13px] font-medium text-gray-400 leading-snug">{cp.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-10 border-t border-gray-100">
                <h4 className="text-[14px] font-bold text-gray-400 mb-8 uppercase tracking-[0.15em] leading-none">Route Navigation</h4>
                <div className="relative rounded-[2rem] overflow-hidden group shadow-inner border border-gray-50 bg-[#f9fafb]">
                  <img 
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" 
                    alt="Floor Plan" 
                    className="w-full h-[220px] object-cover opacity-60 grayscale-[0.3] transition-all duration-700 group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center pt-8">
                    <button className="px-7 py-3 bg-[#004d33] text-white rounded-[1.2rem] text-[13px] font-bold shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all outline-none ring-offset-4 ring-[#004d33]/20 focus:ring-2">
                      VIEW FULL MAP
                    </button>
                  </div>
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function KPIBox({ label, value, subValue, icon: Icon }) {
  return (
    <div className="bg-white rounded-[2rem] p-9 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-gray-50 group hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-400">
      <div className="flex justify-between items-start mb-9">
        <span className="text-[12px] font-pjs font-bold text-gray-400 tracking-[0.05em] leading-none uppercase">{label}</span>
        <div className="p-2 rounded-xl bg-gray-50 text-emerald-600 transition-colors group-hover:bg-emerald-50">
          <Icon size={20} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[40px] font-pjs font-bold text-[#111827] tracking-tighter leading-none mb-3 group-hover:translate-x-1 transition-transform">{value}</span>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></div>
           <span className="text-[13px] font-medium text-gray-400 leading-none">{subValue}</span>
        </div>
      </div>
    </div>
  );
}

function StatInfo({ label, value }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-pjs font-medium text-gray-300 tracking-[0.1em] leading-none uppercase">{label}</span>
      <span className="text-[18px] font-bold text-[#111827] tracking-tight">{value}</span>
    </div>
  );
}
