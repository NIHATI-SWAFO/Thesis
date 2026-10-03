import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../api/config';
import { MessageSquare, Send, ShieldCheck, CheckCircle2, Loader2, Lightbulb, MessageCircle, AlertTriangle, Heart, Lock, History, ChevronRight, Check, X, MapPin, AlignLeft, Flag, FileText, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentSubmissionForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [refNumber, setRefNumber] = useState('');

  // Submissions State
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [viewSubmission, setViewSubmission] = useState(null);

  const [formData, setFormData] = useState({
    submission_type: '', // intent
    category: '',
    title: '',
    description: '',
    location: '',
    student_reported_priority: 'Low',
    is_anonymous: false,
    other_category: ''
  });

  const step2Ref = useRef(null);
  const step3Ref = useRef(null);

  useEffect(() => {
    if (user?.email) {
      fetchSubmissions();
    }
  }, [user?.email]);

  const fetchSubmissions = async () => {
    try {
      const headers = {};
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      const res = await fetch(API_ENDPOINTS.FW_MY_SUBMISSIONS, {
        headers: headers
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-scroll when category is selected
      if (name === 'category' && value && !prev.category) {
        setTimeout(() => {
            step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
      return newData;
    });
  };

  const handleIntentSelect = (type) => {
    setFormData(prev => ({ ...prev, submission_type: type, category: '' }));
    setTimeout(() => {
        step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    let finalDescription = formData.description;
    if (formData.category === 'Other' && formData.other_category) {
        finalDescription = `[Specified Category: ${formData.other_category}]\n\n${finalDescription}`;
    }

    const dataToSend = { ...formData, description: finalDescription, is_anonymous: false };
    delete dataToSend.other_category;

    const headers = {
      'Content-Type': 'application/json'
    };
    if (user?.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }

    try {
      const res = await fetch(API_ENDPOINTS.FW_STUDENT_SUBMIT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(dataToSend)
      });
      if (res.ok) {
        const data = await res.json();
        setRefNumber(data.reference_number);
        setSubmitSuccess(true);
        fetchSubmissions(); 
      } else {
        const errText = await res.text();
        // Removed console.error to prevent Vite from showing the full-screen error overlay
        setSubmitError(errText || 'Failed to submit concern. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setSubmitError('An error occurred. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitSuccess(false);
    setSubmitError('');
    setFormData({
      submission_type: '',
      category: '',
      title: '',
      description: '',
      location: '',
      student_reported_priority: 'Low',
      is_anonymous: false,
      other_category: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Submitted': return <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>;
      case 'Acknowledged': return <span className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>;
      case 'Under Review': return <span className="bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>;
      case 'For Investigation': return <span className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>;
      case 'Action Taken': return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>;
      case 'Resolved': return <span className="bg-teal-100 text-teal-800 border border-teal-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(20,184,166,0.2)]">{status}</span>;
      case 'Dismissed': return <span className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>;
      default: return <span className="bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>;
    }
  };

  const getIntentLabel = (type) => {
      switch(type) {
          case 'report_something': return 'Report Something';
          case 'get_help': return 'Get Help';
          case 'resolve_conflict': return 'Resolve a Conflict';
          case 'suggest_improvement': return 'Suggest an Improvement';
          case 'share_experience': return 'Share Your Experience';
          case 'give_appreciation': return 'Give Appreciation';
          default: return type;
      }
  };

  const getPlaceholderText = () => {
    switch (formData.submission_type) {
        case 'report_something': return "Tell us what happened and provide any details that may help us understand the situation.";
        case 'get_help': return "Tell us what you're experiencing and how SWAFO may assist you.";
        case 'resolve_conflict': return "Briefly describe the situation and the type of assistance you are seeking.";
        case 'suggest_improvement': return "Tell us about your idea and how you think it could improve the student experience.";
        case 'share_experience': return "Share your experience and let us know what you think could be improved or maintained.";
        case 'give_appreciation': return "Tell us who or what you would like to recognize and why.";
        default: return "Please describe what happened and provide any details that may help SWAFO understand your concern.";
    }
  };

  const getTitlePlaceholder = () => {
      switch(formData.category) {
          case 'Professor': return "e.g. Concern regarding a faculty member";
          case 'Subject': return "e.g. Inquiry regarding a specific subject";
          case 'Administration': return "e.g. Inquiry regarding school administration";
          case 'Student Services': return "e.g. Concern regarding a student service";
          case 'Facilities': return "e.g. Report regarding a campus facility";
          case 'Bullying': return "e.g. Report regarding an inappropriate incident";
          case 'Safety': return "e.g. Concern regarding campus safety";
          case 'Welfare': return "e.g. Inquiry about student welfare programs";
          case 'Policies': return "e.g. Suggestion regarding a school policy";
          case 'Activities': return "e.g. Feedback regarding a student activity";
          default: return "e.g. Briefly summarize your message";
      }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] p-4 sm:p-6 lg:p-8 xl:p-12 font-manrope">
      
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="text-[#003624] font-bold text-sm hover:text-[#1bc689] transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
        
        {/* ─── LEFT COLUMN: ACTIONS & FORM (Col Span 8) ─────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8 relative">
            
            {submitSuccess ? (
                <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-emerald-900/5 border border-emerald-50 text-center animate-in zoom-in-95 duration-500 max-w-lg mx-auto">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-inner">
                        <CheckCircle2 size={40} className="drop-shadow-sm" />
                    </div>
                    <h2 className="text-2xl font-pjs font-extrabold text-[#003624] mb-2">Successfully Submitted</h2>
                    <p className="text-sm text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                        Your voice has been heard. It is now securely in the hands of SWAFO.
                    </p>
                    
                    <div className="flex justify-center">
                        <button onClick={resetForm} className="px-6 py-3 bg-[#003624] text-white rounded-xl text-sm font-bold font-pjs hover:bg-emerald-900 transition-all hover:shadow-lg hover:-translate-y-1 active:translate-y-0">
                            Submit Another Feedback
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 relative">

                    {/* STEP 1: INTENT */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative p-8 md:p-12 transition-all">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-[#003624]"></div>
                        
                        <div className="mb-8 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm shadow-inner shrink-0">
                                {formData.submission_type ? <Check size={18} strokeWidth={3} /> : '1'}
                            </div>
                            <h2 className="text-2xl font-pjs font-extrabold text-[#003624] tracking-tight">How can SWAFO help you?</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <IntentCard 
                                icon={<AlertTriangle size={24} />} 
                                title="Report Something" 
                                desc="Something happened that needs attention." 
                                active={formData.submission_type === 'report_something'}
                                onClick={() => handleIntentSelect('report_something')}
                            />

                            <IntentCard 
                                icon={<MessageCircle size={24} />} 
                                title="Resolve a Conflict" 
                                desc="I need help with a disagreement or conflict." 
                                active={formData.submission_type === 'resolve_conflict'}
                                onClick={() => handleIntentSelect('resolve_conflict')}
                            />

                            <IntentCard 
                                icon={<MessageSquare size={24} />} 
                                title="Share Your Experience" 
                                desc="Tell SWAFO about your experience." 
                                active={formData.submission_type === 'share_experience'}
                                onClick={() => handleIntentSelect('share_experience')}
                            />
                        </div>
                    </div>

                    {/* STEP 2: CATEGORY */}
                    <div ref={step2Ref} className={`transition-all duration-500 ease-out transform ${formData.submission_type ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none hidden'}`}>
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative p-8 md:p-12">
                            <div className="absolute left-6 top-[-30px] w-0.5 h-8 bg-slate-200 hidden md:block z-0"></div>
                            
                            <div className="mb-6 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm shadow-inner shrink-0 relative z-10">
                                    {formData.category ? <Check size={18} strokeWidth={3} /> : '2'}
                                </div>
                                <h2 className="text-2xl font-pjs font-extrabold text-[#003624] tracking-tight">What is this about?</h2>
                            </div>

                            <div className="pl-0 md:pl-14">
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { id: 'Professor', label: 'Professor / Faculty' },
                                        { id: 'Subject', label: 'Subject / Curriculum' },
                                        { id: 'Administration', label: 'School Administration' },
                                        { id: 'Student Services', label: 'Student Services' },
                                        { id: 'Facilities', label: 'Facilities' },
                                        { id: 'Bullying', label: 'Bullying / Harassment' },
                                        { id: 'Safety', label: 'Safety & Security' },
                                        { id: 'Welfare', label: 'Student Welfare' },
                                        { id: 'Policies', label: 'School Policies' },
                                        { id: 'Activities', label: 'Student Activities' },
                                        { id: 'Other', label: 'Other' }
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                                            className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all border ${
                                                formData.category === cat.id 
                                                ? 'bg-[#003624] text-white border-[#003624] shadow-lg shadow-emerald-900/20 scale-105' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:-translate-y-0.5 shadow-sm'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                                
                                {formData.category === 'Other' && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                        <input 
                                            required 
                                            type="text" 
                                            name="other_category" 
                                            value={formData.other_category} 
                                            onChange={handleChange} 
                                            placeholder="Please specify..." 
                                            className="w-full bg-slate-50 border-0 ring-1 ring-emerald-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-700 text-sm placeholder:text-emerald-600/50 hover:ring-emerald-300" 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* STEP 3: DETAILS */}
                    <div ref={step3Ref} className={`transition-all duration-500 delay-100 ease-out transform ${formData.category ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none hidden'}`}>
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative p-8 md:p-12">
                            <div className="absolute left-6 top-[-30px] w-0.5 h-8 bg-slate-200 hidden md:block z-0"></div>
                            
                            <div className="mb-8 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm shadow-inner shrink-0 relative z-10">3</div>
                                <h2 className="text-2xl font-pjs font-extrabold text-[#003624] tracking-tight">Tell us more</h2>
                            </div>

                            {submitError && (
                                <div className="mb-6 ml-0 md:ml-14 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertTriangle size={18} className="shrink-0" />
                                    <span>{submitError}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="pl-0 md:pl-14 space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2 relative group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                            <MessageSquare size={12} /> Subject / Title *
                                        </label>
                                        <div className="relative">
                                            <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder={getTitlePlaceholder()} className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl px-5 py-4 pl-5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-800 text-[15px] placeholder:text-slate-400 placeholder:font-medium hover:ring-emerald-300 hover:bg-white shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                            <AlignLeft size={12} /> Description *
                                        </label>
                                        <textarea required name="description" value={formData.description} onChange={handleChange} placeholder={getPlaceholderText()} rows={6} className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-3xl px-6 py-5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-700 text-[15px] resize-none placeholder:text-slate-400 placeholder:font-medium hover:ring-emerald-300 hover:bg-white shadow-inner leading-relaxed"></textarea>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                            <MapPin size={12} /> Location (Optional)
                                        </label>
                                        <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Building B, Cafeteria" className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-700 text-sm placeholder:text-slate-400 placeholder:font-medium hover:ring-emerald-300 hover:bg-white shadow-sm" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                            <Flag size={12} /> Perceived Urgency
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'Low', label: 'Low', color: 'blue' },
                                                { id: 'Moderate', label: 'Moderate', color: 'amber' },
                                                { id: 'High', label: 'High', color: 'orange' },
                                                { id: 'Critical', label: 'Critical', color: 'red' }
                                            ].map(level => (
                                                <button
                                                    key={level.id}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, student_reported_priority: level.id }))}
                                                    className={`px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all border flex flex-col items-center justify-center gap-1
                                                        ${formData.student_reported_priority === level.id 
                                                            ? `bg-${level.color}-50 border-${level.color}-300 text-${level.color}-700 shadow-sm scale-[1.02]` 
                                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {level.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div 
                                    className={`rounded-2xl p-5 flex items-start gap-4 transition-all cursor-pointer border ${formData.is_anonymous ? 'bg-emerald-50 border-emerald-200 shadow-inner' : 'bg-slate-50 border-slate-200 hover:border-emerald-300'}`} 
                                    onClick={() => setFormData(prev => ({ ...prev, is_anonymous: !prev.is_anonymous }))}
                                >
                                    <div className="pt-0.5">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.is_anonymous ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300'}`}>
                                            {formData.is_anonymous && <ShieldCheck size={14} className="text-white" />}
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${formData.is_anonymous ? 'text-emerald-800' : 'text-slate-700'}`}>Submit Anonymously</p>
                                        <p className="text-[13px] text-slate-500 font-medium mt-0.5 leading-tight">Your identity will be completely hidden from the administration. They will only see the details of your report.</p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div>
                                        <p className="font-pjs font-extrabold text-[#003624] text-xl">Ready to submit?</p>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Your submission will be securely sent to SWAFO.</p>
                                    </div>

                                    <button disabled={isSubmitting} type="submit" className="group relative overflow-hidden w-full md:w-auto flex items-center justify-center gap-3 bg-[#003624] text-white px-10 py-5 rounded-2xl font-pjs font-bold text-[14px] shadow-xl shadow-emerald-900/20 hover:bg-[#004d33] transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 whitespace-nowrap">
                                        <div className="absolute inset-0 w-full h-full bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                                        <span className="relative z-10 flex items-center gap-2">
                                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                                            {isSubmitting ? 'Sending...' : 'Submit to SWAFO'}
                                            {!isSubmitting && <Send size={18} className="group-hover:translate-x-1 transition-transform" />}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* ─── RIGHT COLUMN: MY SUBMISSIONS (Col Span 4) ─────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6 sticky top-8">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-pjs font-extrabold text-[#003624] flex items-center gap-2">
                    <History size={24} className="text-emerald-600" /> History
                </h2>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-200 px-2 py-1 rounded-md">Live</div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-200px)] max-h-[800px]">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-sm text-slate-500 font-medium">Track your previous submissions and feedback.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30">
                    {loadingSubmissions ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="animate-spin text-emerald-600" size={32} />
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 text-center px-6">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-sm border border-slate-100">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="text-lg font-pjs font-extrabold text-slate-700 mb-2">No submissions yet</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Your voice matters. Send your first message to SWAFO using the form.</p>
                        </div>
                    ) : (
                        submissions.map(sub => (
                            <div key={sub.id} onClick={() => setViewSubmission(sub)} className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest">{sub.reference_number}</span>
                                    {getStatusBadge(sub.status)}
                                </div>
                                <h4 className="font-pjs font-bold text-[#003624] text-sm mb-3 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">{sub.title}</h4>
                                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>{getIntentLabel(sub.submission_type)}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>{sub.category}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">{new Date(sub.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* Submission Details Modal */}
      {viewSubmission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewSubmission(null)}>
              <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                  
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 md:px-8 md:py-6 border-b border-slate-100 bg-slate-50/80">
                      <div>
                          <div className="flex items-center gap-3 mb-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tracking Reference</p>
                              {getStatusBadge(viewSubmission.status)}
                          </div>
                          <h3 className="text-2xl font-pjs font-extrabold text-[#003624] tracking-tight">{viewSubmission.reference_number}</h3>
                      </div>
                      <button onClick={() => setViewSubmission(null)} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-full transition-colors text-slate-500 shadow-sm">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                      
                      {/* Tracking Timeline Visual */}
                      <div>
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Tracking Progress</h4>
                          <div className="relative flex items-center justify-between w-full">
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full"></div>
                              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full transition-all duration-500 ${
                                  viewSubmission.status === 'Resolved' ? 'w-full' : 
                                  ['Under Review', 'For Investigation'].includes(viewSubmission.status) ? 'w-1/2' : 'w-0'
                              }`}></div>
                              
                              <div className="relative flex flex-col items-center gap-2 bg-white z-10 px-2">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                                      <Check size={16} strokeWidth={3} />
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Submitted</span>
                              </div>
                              
                              <div className="relative flex flex-col items-center gap-2 bg-white z-10 px-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                                      ['Under Review', 'For Investigation', 'Resolved'].includes(viewSubmission.status) 
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                                      : 'bg-white border-slate-200 text-slate-300'
                                  }`}>
                                      {['Under Review', 'For Investigation', 'Resolved'].includes(viewSubmission.status) ? <Check size={16} strokeWidth={3} /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>}
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase tracking-widest ${['Under Review', 'For Investigation', 'Resolved'].includes(viewSubmission.status) ? 'text-emerald-700' : 'text-slate-400'}`}>Reviewing</span>
                              </div>

                              <div className="relative flex flex-col items-center gap-2 bg-white z-10 px-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                                      viewSubmission.status === 'Resolved' 
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                                      : 'bg-white border-slate-200 text-slate-300'
                                  }`}>
                                      {viewSubmission.status === 'Resolved' ? <Check size={16} strokeWidth={3} /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>}
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase tracking-widest ${viewSubmission.status === 'Resolved' ? 'text-emerald-700' : 'text-slate-400'}`}>Resolved</span>
                              </div>
                          </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Content Section */}
                      <div className="space-y-5">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                              <div className="flex flex-wrap gap-2">
                                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest border border-emerald-100/50 flex items-center gap-1.5">
                                      <MessageCircle size={12} /> {getIntentLabel(viewSubmission.submission_type)}
                                  </span>
                                  <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest border border-slate-200/50 flex items-center gap-1.5">
                                      <History size={12} /> {viewSubmission.category}
                                  </span>
                              </div>
                              {viewSubmission.student_reported_priority && (
                                  <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest border flex items-center gap-1.5
                                      ${viewSubmission.student_reported_priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                                        viewSubmission.student_reported_priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                      <AlertTriangle size={12} /> {viewSubmission.student_reported_priority} Priority
                                  </span>
                              )}
                          </div>
                          
                          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
                              <h4 className="font-pjs font-extrabold text-slate-800 text-2xl leading-snug mb-4">{viewSubmission.title}</h4>
                              <div className="relative">
                                  <div className="absolute top-0 left-0 -ml-2 -mt-2 text-slate-100">
                                      <MessageSquare size={48} className="fill-current opacity-50" />
                                  </div>
                                  <p className="relative z-10 text-slate-600 font-medium whitespace-pre-wrap leading-relaxed text-[15px] pt-2">
                                      {viewSubmission.description}
                                  </p>
                              </div>
                          </div>
                      </div>
                      
                      {/* Meta Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-slate-50/80 rounded-[1.5rem] p-5 border border-slate-100 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100 shrink-0">
                                  <History size={18} />
                              </div>
                              <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Submitted On</p>
                                  <p className="text-sm font-bold text-slate-700">{new Date(viewSubmission.created_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}</p>
                              </div>
                          </div>
                          
                          <div className="bg-slate-50/80 rounded-[1.5rem] p-5 border border-slate-100 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-sm border border-slate-100 shrink-0">
                                  <Lightbulb size={18} />
                              </div>
                              <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Location / Context</p>
                                  <p className="text-sm font-bold text-slate-700">{viewSubmission.location || "No specific location provided"}</p>
                              </div>
                          </div>
                      </div>

                      {/* Resolution File Section */}
                      {viewSubmission.status === 'Resolved' && viewSubmission.resolution_file && (
                          <div className="bg-emerald-50/50 rounded-[1.5rem] p-6 border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0">
                                      <FileText size={24} />
                                  </div>
                                  <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Official Document</p>
                                      <p className="text-sm font-bold text-slate-800">Resolution Report</p>
                                  </div>
                              </div>
                              <a 
                                  href={viewSubmission.resolution_file} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                              >
                                  <Download size={16} /> View Document
                              </a>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

// Helper Component for Intent Cards
function IntentCard({ icon, title, desc, active, onClick }) {
    
    const baseClasses = "relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer group flex flex-col h-full";
    const activeClasses = active 
        ? "bg-[#003624] border-[#003624] shadow-lg shadow-emerald-900/20 scale-[1.02]" 
        : "bg-white border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1";

    return (
        <div onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
            {active && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>}
            
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors shrink-0 ${active ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-slate-50 text-emerald-600 group-hover:bg-emerald-50 group-hover:scale-110'}`}>
                {icon}
            </div>
            <h4 className={`font-pjs font-extrabold text-base mb-1 ${active ? 'text-white' : 'text-slate-800'}`}>{title}</h4>
            <p className={`text-xs font-medium leading-relaxed mt-auto ${active ? 'text-emerald-100' : 'text-slate-500'}`}>{desc}</p>
        </div>
    );
}
