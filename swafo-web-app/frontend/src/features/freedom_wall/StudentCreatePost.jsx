import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../api/config';
import { ShieldCheck, MessageSquare, ArrowLeft, Send, Loader2, Info } from 'lucide-react';

export default function StudentCreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    is_anonymous: false
  });

  const CATEGORIES = [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    
    setIsSubmitting(true);
    try {
      const formPayload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formPayload.append(key, value);
      });
      // We must specify a location because the serializer requires it
      formPayload.append('location', 'Community Feed');
      // We must specify submission_type because the serializer requires it
      formPayload.append('submission_type', 'share_experience');
      // Set category to Other
      formPayload.append('category', 'Other');

      const res = await fetch(API_ENDPOINTS.FW_COMMUNITY_CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formPayload
      });

      if (res.ok) {
        navigate('/student/freedom-wall');
      } else {
        const errorData = await res.json();
        console.error("Submission error:", errorData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-10 font-pjs animate-in fade-in duration-500">
      <button 
        onClick={() => navigate('/student/freedom-wall')}
        className="flex items-center gap-2 text-slate-500 hover:text-[#003624] font-bold text-sm mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Community Feed
      </button>

      <div className="bg-white rounded-[2rem] p-8 border border-emerald-50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <MessageSquare size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#003624]">Make a Post</h1>
              <p className="text-slate-500 text-sm font-medium">Share your thoughts with the SWAFO community.</p>
            </div>
          </div>
          
          <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-8">
            <Info size={20} className="text-blue-500 shrink-0" />
            <p className="text-[13px] text-blue-800/80 font-medium leading-relaxed">
              Posts made here will be visible on the public Community Feed immediately. If you need to report a sensitive issue to the Director directly, please use the <button onClick={() => navigate('/student/freedom-wall/submit')} className="font-bold underline hover:text-blue-900">Submit a Report</button> form instead.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-2">Post Title</label>
              <input 
                type="text" 
                required
                placeholder="What's on your mind?"
                value={formData.title || ""}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-5 py-4 text-[15px] font-bold text-[#003624] outline-none focus:ring-2 focus:ring-[#2bd99b] focus:bg-white transition-all placeholder:text-slate-300"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-2">Description</label>
              <textarea 
                required
                placeholder="Share the details..."
                value={formData.description || ""}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-5 py-4 text-[15px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#2bd99b] focus:bg-white transition-all min-h-[160px] resize-none placeholder:text-slate-300"
              ></textarea>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex items-start gap-4 cursor-pointer" onClick={() => setFormData({...formData, is_anonymous: !formData.is_anonymous})}>
              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors ${formData.is_anonymous ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-transparent'}`}>
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700">Post Anonymously</h4>
                <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed">
                  Hide your name from other students. Only the SWAFO Director will be able to see your identity for verification purposes.
                </p>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !formData.title || !formData.category || !formData.description}
              className="w-full bg-[#003624] text-white py-4 rounded-xl font-bold text-[15px] hover:bg-[#004d33] transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Send size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /> Publish to Community Feed
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
