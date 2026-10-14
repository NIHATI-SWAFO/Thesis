import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../api/config";
import { ShieldCheck, MessageSquare, Clock, Send, Loader2, CheckCircle2 } from "lucide-react";

export default function StudentFreedomWallDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "General Feedback",
    description: "",
    is_anonymous: false
  });

  const CATEGORIES = [
    "General Feedback",
    "School Concern",
    "Officer Report",
    "Professor",
    "Subject",
    "Administration",
    "Student Services",
    "Facilities",
    "Safety",
    "Welfare",
    "Policies",
    "Other"
  ];

  useEffect(() => {
    if (user?.token) {
      fetchMySubmissions();
    } else {
      setLoading(false);
    }
  }, [user?.token]);

  const fetchMySubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.FW_MY_SUBMISSIONS, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (!res.ok) { console.warn("Failed to fetch submissions:", res.status); return; }
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("category", formData.category);
      payload.append("description", formData.description);
      payload.append("is_anonymous", formData.is_anonymous);
      payload.append("submission_type", "report_something");
      payload.append("location", "SWAFO Connect Portal");
      payload.append("student_reported_priority", "Moderate");

      const res = await fetch(API_ENDPOINTS.FW_STUDENT_SUBMIT, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user?.token}` },
        body: payload
      });

      if (res.ok) {
        setFormData({ title: "", category: "General Feedback", description: "", is_anonymous: false });
        fetchMySubmissions();
      } else {
        console.error("Failed to submit");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Submitted": return "bg-blue-50 text-blue-600 border-blue-200";
      case "Acknowledged": return "bg-purple-50 text-purple-600 border-purple-200";
      case "Under Review":
      case "For Investigation": return "bg-orange-50 text-orange-600 border-orange-200";
      case "Action Taken":
      case "Resolved": return "bg-emerald-50 text-emerald-600 border-emerald-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="max-w-[1580px] mx-auto font-pjs animate-in fade-in duration-500 pb-12">
      {/* PREMIUM HERO BANNER */}
      <div className="relative w-full max-w-[1580px] mx-auto rounded-[2.5rem] bg-[#003624] overflow-hidden mb-8 shadow-2xl shadow-emerald-900/20">
        <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#10b981]/10 blur-[80px]"></div>

        <div className="relative z-10 px-8 py-10 md:px-12 md:py-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
              <MessageSquare size={12} /> Student Voice Module
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-pjs font-extrabold text-white tracking-tight mb-3 leading-tight">
              SWAFO Connect
            </h1>
            <p className="text-emerald-100/80 text-base md:text-lg font-medium leading-relaxed max-w-lg mb-6">
              Your voice matters. Share your concerns, suggestions, feedback, or ideas with SWAFO securely and privately.
            </p>
          </div>

          <div className="hidden lg:flex max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-6 items-start gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-emerald-100 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-pjs font-bold text-white text-base mb-1">Private & Secure</h4>
              <p className="text-sm text-emerald-100/80 font-medium leading-relaxed">
                Your submission is strictly private and accessible only by authorized SWAFO Directors. Provide accurate details so we can assist you properly.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* MAIN AREA */}
        <div className="lg:col-span-8 space-y-6">

          {/* INLINE SUBMISSION FORM */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-emerald-50">
            <h3 className="text-base font-extrabold text-[#003624] mb-3 flex items-center gap-2">
              <MessageSquare size={18} className="text-[#2bd99b]" /> Submit a Concern or Feedback
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">Title / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Subject or summary of your concern..."
                  value={formData.title || ""}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-[#003624] outline-none focus:ring-2 focus:ring-[#2bd99b] focus:bg-white transition-all placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">Category</label>
                <select
                  value={formData.category || "General Feedback"}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#2bd99b] focus:bg-white transition-all"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">Details</label>
                <textarea
                  required
                  placeholder="Provide detailed information regarding your report or feedback..."
                  value={formData.description || ""}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#2bd99b] focus:bg-white transition-all min-h-[110px] resize-none placeholder:text-slate-300"
                ></textarea>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.is_anonymous ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-transparent group-hover:bg-slate-300'}`}>
                    <ShieldCheck size={12} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 select-none">Submit Anonymously</span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.is_anonymous}
                    onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
                  className="flex items-center gap-2 bg-[#003624] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#004d33] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{isSubmitting ? "Submitting..." : "Send to SWAFO"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* MY SUBMISSIONS LIST */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#003624] mb-4 flex items-center gap-2">
              <Clock size={18} className="text-[#2bd99b]" /> My Submissions
            </h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 size={24} className="animate-spin mb-3 text-emerald-500" />
                <p className="text-sm font-bold">Loading your submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-[1.5rem] border border-emerald-50 shadow-sm flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-lg font-extrabold text-[#003624] mb-1">No submissions yet</h3>
                <p className="text-[14px] font-medium text-slate-500">You haven't submitted any feedback or reports.</p>
              </div>
            ) : (
              submissions.map(sub => (
                <div key={sub.id} className="bg-white rounded-[1.5rem] p-6 border border-emerald-50 shadow-sm transition-all hover:shadow-md group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{sub.reference_number || `REF-${sub.id}`}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(sub.status)}`}>
                        {sub.status || 'Submitted'}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{sub.created_at ? new Date(sub.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-[#003624] mb-2">{sub.title}</h4>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed mb-4">{sub.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">{sub.category}</span>
                    {sub.is_anonymous && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <ShieldCheck size={14} /> Submitted Anonymously
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[1.5rem] p-6 border border-emerald-50 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <ShieldCheck size={16} className="text-emerald-500" /> Privacy Guarantee
            </h3>
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 mb-4">
              <p className="text-[13px] font-medium text-emerald-800 leading-relaxed">
                All submissions are strictly confidential. If you submit anonymously, your identity is entirely stripped from the system and cannot be viewed by any officer or director.
              </p>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={16} className="text-[#2bd99b] shrink-0 mt-0.5" />
                <p className="text-[13px] font-medium text-slate-600">Your concerns are routed directly to authorized SWAFO personnel only.</p>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={16} className="text-[#2bd99b] shrink-0 mt-0.5" />
                <p className="text-[13px] font-medium text-slate-600">No student can view your submissions.</p>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={16} className="text-[#2bd99b] shrink-0 mt-0.5" />
                <p className="text-[13px] font-medium text-slate-600">Anonymous toggle guarantees complete identity protection.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
