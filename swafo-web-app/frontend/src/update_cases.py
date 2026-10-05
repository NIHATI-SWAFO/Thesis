import re
with open('features/cases/CaseManagement.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

old_str = """            <div className="flex flex-col gap-8">
              {violations.slice(0, 3).map((v, i) => {
                const severity = getPriority(v);
                const timeStr = new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = new Date(v.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <ActivityItem
                    key={v.id}
                    icon={severity === 'Major' ? 'priority_high' : 'add_circle'}
                    color={severity === 'Major' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}
                    title={v.student_details?.user_details?.full_name || 'New Case'}
                    sub={<span className="flex items-center gap-1.5 truncate">
                      {(v.rule_details?.category || 'General').replace(/^(Major|Minor|General)\\s*[?"\\-]\\s*/i, '')}
                      <span className="opacity-40">?</span>
                      <span className="whitespace-nowrap">{v.status.replace('_', ' ')}</span>
                    </span>}
                    time={`${dateStr}, ${timeStr}`}
                  />
                );
              })}
              {violations.length === 0 && (
                <p className="text-[13px] text-slate-400 font-medium italic text-center py-4">No recent activity found.</p>
              )}
            </div>"""

new_str = """            <div className="flex flex-col gap-8">
              {recentActivities.map((act, i) => {
                if (act.type === 'violation') {
                  const v = act.data;
                  const severity = getPriority(v);
                  const timeStr = new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = new Date(v.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  return (
                    <ActivityItem
                      key={`v-${v.id}`}
                      icon={severity === 'Major' ? 'priority_high' : 'add_circle'}
                      color={severity === 'Major' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}
                      title={v.student_details?.user_details?.full_name || 'New Case'}
                      sub={<span className="flex items-center gap-1.5 truncate">
                        {(v.rule_details?.category || 'General').replace(/^(Major|Minor|General)\\s*[-?"]\\s*/i, '')}
                        <span className="opacity-40">&bull;</span>
                        <span className="whitespace-nowrap">{v.status.replace('_', ' ')}</span>
                      </span>}
                      time={`${dateStr}, ${timeStr}`}
                      onClick={() => setSelectedCase(v)}
                    />
                  );
                } else {
                  const a = act.data;
                  const timeStr = new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = new Date(a.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  return (
                    <ActivityItem
                      key={`a-${a.id}`}
                      icon="history_edu"
                      color="bg-emerald-50 text-emerald-600"
                      title={a.student_name}
                      sub={<span className="flex items-center gap-1.5 truncate">
                        Appeal Submitted
                      </span>}
                      time={`${dateStr}, ${timeStr}`}
                      onClick={() => setSelectedAppeal(a)}
                    />
                  );
                }
              })}
              {recentActivities.length === 0 && (
                <p className="text-[13px] text-slate-400 font-medium italic text-center py-4">No recent activity found.</p>
              )}
            </div>"""

# Replace block using regex finding start and end
start_idx = c.find('<div className="flex flex-col gap-8">\n              {violations.slice(0, 3)')
if start_idx != -1:
    end_idx = c.find('</div>', start_idx) + 6
    c = c[:start_idx] + new_str + c[end_idx:]

c = c.replace(
    'document.body\n      )}\n    </div>\n  );\n}',
    'document.body\n      )}\n      {selectedAppeal && <AppealReviewModal appealData={selectedAppeal} onClose={() => setSelectedAppeal(null)} />}\n    </div>\n  );\n}'
)

modal_def = """
function AppealReviewModal({ appealData, onClose }) {
  if (!appealData) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-[#003624]/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] w-full max-w-[600px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-white/20 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-8 md:p-10">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#009b69] flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px] font-bold">description</span>
          </div>
          <h2 className="text-[24px] font-pjs font-extrabold text-[#003624] mb-2 tracking-tight">Appeal Review</h2>
          
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mt-6 mb-6 space-y-4 text-left">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Student</p>
              <p className="font-bold text-[#1a1a1a]">{appealData.student_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Violation Reference</p>
              <p className="font-bold text-[#009b69]">{appealData.violation_code}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Subject</p>
              <p className="font-bold text-[#1a1a1a]">{appealData.subject}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Description</p>
              <p className="font-medium text-slate-600 whitespace-pre-wrap text-[14px] leading-relaxed">{appealData.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-full h-[60px] bg-[#003624] text-white rounded-2xl font-pjs font-black text-[13px] uppercase tracking-[0.2em] hover:bg-[#004d33] transition-all shadow-lg">Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
"""

if "function AppealReviewModal" not in c:
    c = c + modal_def

with open('features/cases/CaseManagement.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
