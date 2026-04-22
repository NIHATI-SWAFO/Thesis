import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_STUDENTS = [
  { id: '2021-10023', name: 'John Doe', college: 'College of Arts and Sciences', dept: 'Psychology', year: '4th', violations: 0, status: 'Clean' },
  { id: '2022-10542', name: 'Jane Smith', college: 'College of Business Administration', dept: 'Marketing', year: '3rd', violations: 1, status: 'Active' },
  { id: '2021-11204', name: 'Michael Brown', college: 'College of Computing Studies', dept: 'IT', year: '4th', violations: 3, status: 'Repeat' },
  { id: '2023-10015', name: 'Emily White', college: 'College of Engineering', dept: 'Civil', year: '2nd', violations: 0, status: 'Clean' },
  { id: '2022-10987', name: 'Robert Wilson', college: 'College of Arts and Sciences', dept: 'History', year: '3rd', violations: 2, status: 'Active' },
  { id: '2024-10001', name: 'Sarah Davis', college: 'College of Education', dept: 'Secondary Ed', year: '1st', violations: 0, status: 'Clean' },
  { id: '2023-11002', name: 'David Martinez', college: 'College of Business Administration', dept: 'Accountancy', year: '2nd', violations: 1, status: 'Active' },
  { id: '2021-10555', name: 'Lisa Taylor', college: 'College of Computing Studies', dept: 'CS', year: '4th', violations: 4, status: 'Repeat' },
  { id: '2022-10888', name: 'James Anderson', college: 'College of Engineering', dept: 'Electrical', year: '3rd', violations: 0, status: 'Clean' },
  { id: '2023-09123', name: 'Rhine Castro', college: 'College of Arts and Sciences', dept: 'Communication', year: '2nd', violations: 2, status: 'Active' },
];

export default function StudentRecords({ role = 'officer' }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/users/list/')
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching students:", err);
        setLoading(false);
      });
  }, []);

  const [statusFilter, setStatusFilter] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const name = student.user_details?.full_name || '';
      const id = student.student_number || '';
      const course = student.course || '';
      const studentStatus = student.is_repeat_offender ? 'Repeat' : student.violation_count > 0 ? 'Active' : 'Clean';
      
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           id.includes(searchQuery) ||
                           course.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || 
                           (statusFilter === 'Compliant' && studentStatus === 'Clean') ||
                           (statusFilter === 'Under Review' && studentStatus === 'Active') ||
                           (statusFilter === 'Non-Compliant' && studentStatus === 'Repeat');

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, students, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: students.length,
      withViolations: students.filter(s => s.violation_count > 0).length,
      repeatOffenders: students.filter(s => s.is_repeat_offender).length,
      cleanRecord: students.filter(s => s.violation_count === 0).length
    };
  }, [students]);

  const currentData = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Student ID,Name,Course,Violations,Status"].concat(
        students.map(s => {
          const sStatus = s.is_repeat_offender ? 'Non-Compliant' : s.violation_count > 0 ? 'Under Review' : 'Compliant';
          return `${s.student_number},${s.user_details?.full_name},${s.course},${s.violation_count},${sStatus}`;
        })
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SWAFO_Student_Records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#003624] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-pjs font-bold text-[#003624]">Fetching Compliance Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto animate-fade-in-up pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-[32px] font-pjs font-extrabold text-[#003624] tracking-tight mb-2">Student Records</h1>
          <p className="text-[14px] text-gray-500 font-manrope font-medium">View all student violation records and academic compliance status.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportData}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-xl text-[13px] font-pjs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Data
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-6 py-3 bg-[#003624] text-white rounded-xl text-[13px] font-pjs font-bold shadow-lg shadow-emerald-950/20 hover:bg-[#004d35] transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              {statusFilter === 'All' ? 'Filter View' : statusFilter}
            </button>
            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 w-[220px] bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-3">Compliance Status</p>
                {['All', 'Compliant', 'Under Review', 'Non-Compliant'].map(f => (
                  <button 
                    key={f}
                    onClick={() => { setStatusFilter(f); setIsFilterOpen(false); setCurrentPage(1); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[13px] font-bold transition-colors ${statusFilter === f ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="TOTAL STUDENTS" value={stats.total} icon="people" color="bg-[#e0f2f1]" textColor="text-[#00695c]" />
        <StatCard label="WITH VIOLATIONS" value={stats.withViolations} icon="warning" color="bg-[#fff3e0]" textColor="text-[#ef6c00]" />
        <StatCard label="REPEAT OFFENDERS" value={stats.repeatOffenders} icon="error" color="bg-[#ffebee]" textColor="text-[#c62828]" />
        <StatCard label="CLEAN RECORD" value={stats.cleanRecord} icon="verified" color="bg-[#f1f8e9]" textColor="text-[#2e7d32]" />
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,54,36,0.03)] border border-[#f1f5f9] overflow-hidden">
        <div className="p-10 border-b border-slate-50">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
            <div>
              <h2 className="text-[26px] font-pjs font-black text-[#003624] tracking-tight mb-2">All Students</h2>
              <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Compliant (0 Pending)
                </span>
                <span className="w-px h-3 bg-slate-200"></span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Under Review (1 Active)
                </span>
                <span className="w-px h-3 bg-slate-200"></span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Non-Compliant (2+ Total)
                </span>
              </div>
            </div>

            <div className="relative w-full xl:w-[460px]">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-[22px]">search</span>
              <input 
                type="text" 
                placeholder="Search by name, student ID, or college..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="bg-[#f8fafc] text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                  <th className="py-4 px-6 rounded-l-xl">Student ID</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">College & Department</th>
                  <th className="py-4 px-6">Violations</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((student) => {
                      const name = student.user_details?.full_name || 'N/A';
                      const id = student.student_number;
                      // Logic: Repeat if flagged, Active if they have UNRESOLVED violations, otherwise Clean.
                      const hasUnresolved = (student.violation_count || 0) > 0 && student.has_pending_violations; 
                      const status = student.is_repeat_offender ? 'Repeat' : hasUnresolved ? 'Active' : 'Clean';
                      
                      return (
                        <tr key={student.id} className="group hover:bg-[#f8fcf9] transition-all cursor-pointer">
                          <td className="py-5 px-6 bg-white border-y border-l border-gray-50 rounded-l-2xl shadow-sm group-hover:border-emerald-100">
                            <span className="text-[13px] font-manrope font-bold text-gray-500">{id}</span>
                          </td>
                          <td className="py-5 px-6 bg-white border-y border-gray-50 shadow-sm group-hover:border-emerald-100">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black shadow-inner border ${
                                status === 'Repeat' ? 'bg-red-100 text-red-600 border-red-200' : 
                                status === 'Active' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                              }`}>
                                {name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-[15px] font-pjs font-bold text-[#003624]">{name}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6 bg-white border-y border-gray-50 shadow-sm group-hover:border-emerald-100">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-manrope font-bold text-gray-700">{student.course}</span>
                              <span className="text-[11px] font-manrope font-medium text-gray-400">{student.year_level} Year</span>
                            </div>
                          </td>
                          <td className="py-5 px-6 bg-white border-y border-gray-50 shadow-sm group-hover:border-emerald-100">
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-black border ${
                              student.violation_count >= 2 ? 'bg-rose-100 text-rose-600 border-rose-200' :
                              student.violation_count > 0 ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                            }`}>
                              {student.violation_count}
                            </div>
                          </td>
                          <td className="py-5 px-6 bg-white border-y border-gray-50 shadow-sm group-hover:border-emerald-100">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border ${
                              status === 'Repeat' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                              status === 'Active' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                              'bg-emerald-600 text-white border-emerald-600 shadow-emerald-900/10'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                status === 'Repeat' ? 'bg-rose-500 animate-pulse' :
                                status === 'Active' ? 'bg-slate-400' :
                                'bg-white'
                              }`}></span>
                              {status === 'Repeat' ? 'NON-COMPLIANT' : status === 'Active' ? 'UNDER REVIEW' : 'COMPLIANT'}
                            </span>
                          </td>
                          <td className="py-5 px-6 bg-white border-y border-r border-gray-50 rounded-r-2xl shadow-sm text-right group-hover:border-emerald-100">
                            <button 
                              onClick={() => navigate(`/${role}/students/${id}`)}
                              className="text-[12px] font-pjs font-black text-[#005e43] px-5 py-2 hover:bg-emerald-50 rounded-xl transition-all"
                            >
                              VIEW PROFILE
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                      <span className="material-symbols-outlined text-[48px] text-gray-200 mb-2">search_off</span>
                      <p className="text-[14px] text-gray-400 font-medium font-manrope">No student records match your current search parameters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[12px] font-pjs font-bold text-gray-400 uppercase tracking-widest">
              SHOWING {currentData.length} OF {filteredStudents.length} RESULTS
            </span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black transition-all shadow-sm ${currentPage === i + 1 ? 'bg-[#003624] text-white' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, textColor }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,54,36,0.02)] border border-[#f1f5f9] flex flex-col relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,54,36,0.06)] transition-all">
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} rounded-full -mr-12 -mt-12 opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center ${textColor} shadow-sm border border-white/50`}>
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <span className="text-[32px] font-pjs font-black text-[#0f172a] leading-none mb-1">{value}</span>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-[0.2em]">{label}</p>
      </div>
    </div>
  );
}
