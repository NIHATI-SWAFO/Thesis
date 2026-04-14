import React, { useState, useRef } from 'react';
import shelfImg from '../../assets/shelfimage.jpg';

export default function RecordViolation() {
  // ── State for form fields (ready for backend integration) ──
  const [formData, setFormData] = useState({
    violationType: '',
    incidentDate: '',
    incidentTime: '',
    location: '',
    description: '',
    handbookSection: '',
  });

  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setEvidenceFiles(prev => [...prev, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setEvidenceFiles(prev => [...prev, ...files]);
  };

  const handleGenerateRecommendation = () => {
    if (!formData.description) return;
    setIsGenerating(true);
    // TODO: Replace with actual API call to AI backend
    setTimeout(() => {
      setIsGenerating(false);
      setRecommendation(
        "Based on Article IV, Section 2 of the Faculty Handbook, this incident qualifies as a Category B Violation (Major). Recommended Sanction: 3-day suspension and mandatory counseling session."
      );
    }, 2000);
  };

  return (
    <div className="max-w-[1200px] animate-fade-in-up pb-16 mx-auto px-6">

      {/* ═══════════ TWO-COLUMN GRID LAYOUT ═══════════ */}
      <div className="grid grid-cols-3 gap-8 items-start">

        {/* ═══════════ LEFT COLUMN (form) ═══════════ */}
        <div className="col-span-2">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[32px] font-pjs font-extrabold text-[#003624] tracking-tight mb-3">
              Record New Violation
            </h1>
            <p className="text-[14px] text-gray-500 font-manrope font-medium leading-[1.6] max-w-[560px]">
              Systematically document institutional policy breaches. Ensure all data fields
              are populated accurately to maintain archival integrity and facilitate AI-assisted recommendation.
            </p>
          </div>

          {/* ── Violation Details Card ── */}
          <div className="bg-white border border-[#f1f5f9] rounded-2xl p-8 pb-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] mb-6 relative overflow-hidden">
            {/* Design Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#205F4B]" />
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-[#003624] text-[24px]">description</span>
              <h2 className="text-[18px] font-pjs font-bold text-[#0f172a]">Violation Details</h2>
            </div>

            {/* Violation Type */}
            <label className="block text-[10px] font-extrabold text-[#003624] uppercase tracking-[0.14em] mb-2">
              Violation Type
            </label>
            <div className="relative mb-8">
              <select
                name="violationType"
                value={formData.violationType}
                onChange={handleInputChange}
                className="w-full bg-[#f4f6f8] rounded-xl h-[52px] px-5 pr-12 text-[14px] font-manrope font-semibold text-[#0f172a] outline-none appearance-none cursor-pointer hover:bg-[#eef0f3] transition-all border-none"
              >
                <option value="">Select violation category...</option>
                <option value="academic">Academic Integrity</option>
                <option value="conduct">General Conduct</option>
                <option value="uniform">Uniform &amp; Grooming</option>
                <option value="facilities">Facility Misuse</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Date / Time Row */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-[10px] font-extrabold text-[#003624] uppercase tracking-[0.14em] mb-2">
                  Incident Date
                </label>
                <input
                  type="date"
                  name="incidentDate"
                  value={formData.incidentDate}
                  onChange={handleInputChange}
                  className="w-full bg-[#e8eaed] rounded-xl py-3.5 px-5 text-[13px] font-manrope font-medium text-gray-600 outline-none border-none hover:bg-[#dfe1e5] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-[#003624] uppercase tracking-[0.14em] mb-2">
                  Incident Time
                </label>
                <input
                  type="time"
                  name="incidentTime"
                  value={formData.incidentTime}
                  onChange={handleInputChange}
                  className="w-full bg-[#f4f6f8] rounded-xl py-3.5 px-5 text-[13px] font-manrope font-medium text-gray-500 outline-none border-none hover:bg-[#eef0f3] transition-colors"
                />
              </div>
            </div>

            {/* Location */}
            <label className="block text-[10px] font-extrabold text-[#003624] uppercase tracking-[0.14em] mb-2">
              Location
            </label>
            <div className="relative mb-6">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                location_on
              </span>
              <input
                type="text"
                name="location"
                placeholder="Specify block, room, or area..."
                value={formData.location}
                onChange={handleInputChange}
                className="w-full bg-[#f4f6f8] rounded-xl py-3.5 pl-11 pr-5 text-[13px] font-manrope font-medium text-gray-500 outline-none border-none hover:bg-[#eef0f3] transition-colors"
              />
            </div>

            {/* Description */}
            <label className="block text-[10px] font-extrabold text-[#003624] uppercase tracking-[0.14em] mb-2">
              Incident Description
            </label>
            <textarea
              name="description"
              rows="4"
              placeholder="Provide a detailed objective account of the event..."
              value={formData.description}
              onChange={handleInputChange}
              className="w-full bg-[#f4f6f8] rounded-xl py-4 px-5 text-[13px] font-manrope font-medium text-gray-500 outline-none resize-none leading-relaxed border-none hover:bg-[#eef0f3] transition-colors"
            />
          </div>

          {/* ── Handbook Mapping Card ── */}
          <div className="bg-white border border-[#f1f5f9] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] mb-6 relative overflow-hidden">
            {/* Design Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#205F4B]" />
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#003624] text-[24px]">menu_book</span>
              <h2 className="text-[18px] font-pjs font-bold text-[#0f172a]">Handbook Mapping</h2>
            </div>

            <label className="block text-[10px] font-extrabold text-[#003624] uppercase tracking-[0.14em] mb-2">
              Related Handbook Section
            </label>
            <div className="relative mb-3">
              <select
                name="handbookSection"
                value={formData.handbookSection}
                onChange={handleInputChange}
                className="w-full bg-[#f4f6f8] rounded-xl py-3.5 px-5 pr-10 text-[13px] font-manrope font-medium text-gray-500 outline-none appearance-none cursor-pointer border-none hover:bg-[#eef0f3] transition-colors"
              >
                <option value="">Search rule index...</option>
                <option value="art4_sec2">Article IV, Section 2 - Major Offenses</option>
                <option value="art4_sec1">Article IV, Section 1 - Minor Offenses</option>
                <option value="art5_sec3">Article V, Section 3 - Academic Honesty</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none">
                expand_more
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium italic">
              Linking to the handbook ensures legal compliance and consistency in disciplinary actions.
            </p>
          </div>

          {/* ── Evidence Upload Card ── */}
          <div className="bg-[#f0fdf4] rounded-2xl p-8 border border-emerald-100 mb-6 transition-all">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="material-symbols-outlined text-[#059669] text-[24px]">link</span>
              <h2 className="text-[18px] font-pjs font-bold text-[#059669]">Evidence Upload</h2>
            </div>
 
            <div
              className="border-2 border-dashed border-emerald-400/40 rounded-2xl py-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/60 transition-all bg-white/60 group"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.mp4"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#059669] mb-4">
                <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
              </div>
              <h3 className="text-[15px] font-pjs font-bold text-[#0f172a] mb-1">Add Evidence File</h3>
              <p className="text-[12px] text-gray-400 font-medium mb-3">
                Drop files here or{' '}
                <span className="text-[#059669] font-semibold hover:underline">browse local storage</span>
              </p>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.12em]">
                Supported: PDF, JPG, PNG, MP4 (MAX 50MB)
              </span>
            </div>

            {/* Show uploaded files */}
            {evidenceFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {evidenceFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 text-[12px] font-medium text-gray-600">
                    <span className="material-symbols-outlined text-emerald-500 text-[16px]">attach_file</span>
                    {file.name}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEvidenceFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                      className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Recommendation Result */}
          {recommendation && (
            <div className="bg-[#003624] rounded-3xl p-8 text-white shadow-lg mb-6 animate-fade-in-up">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="material-symbols-outlined text-emerald-400 animate-pulse">auto_awesome</span>
                <h3 className="text-[14px] font-pjs font-black uppercase tracking-[0.12em]">AI Recommendation</h3>
              </div>
              <p className="text-[13px] font-manrope font-medium leading-[1.8] text-emerald-50/90 italic">
                &ldquo;{recommendation}&rdquo;
              </p>
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button className="text-[11px] font-bold text-white/50 hover:text-white transition-colors">Discard</button>
                <button className="bg-emerald-500 text-white px-5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-emerald-400 transition-all">
                  Apply Recommendation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════ RIGHT SIDEBAR ═══════════ */}
        <div className="col-span-1 space-y-6 pt-[92px]">

          {/* Quick Tips */}
          <div className="bg-white border border-[#f1f5f9] rounded-2xl p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#059669] text-[22px]">lightbulb</span>
              <h2 className="text-[17px] font-pjs font-bold text-[#0f172a]">Quick Tips</h2>
            </div>
            <ul className="space-y-5">
              {[
                { id: '01', text: 'Use neutral, observable language. Instead of "John was angry," use "The student spoke at a high volume and gestured frequently."' },
                { id: '02', text: 'Include names of any witnesses present during the incident in the description field.' },
                { id: '03', text: 'Capture clear photos of any physical damage or digital screenshots for academic integrity cases.' },
              ].map((tip) => (
                <li key={tip.id} className="flex gap-3">
                  <span className="text-[13px] font-pjs font-extrabold text-[#059669] shrink-0 mt-0.5">{tip.id}</span>
                  <p className="text-[11px] text-gray-500 font-medium leading-[1.6]">{tip.text}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Rule Reference */}
          <div className="bg-[#003624] rounded-2xl p-7 text-white shadow-xl shadow-emerald-950/20">
            <h3 className="text-[17px] font-pjs font-extrabold mb-3 leading-tight">Rule Reference</h3>
            <p className="text-[12px] text-white/80 font-manrope font-medium leading-[1.6] mb-6">
              You are recording a violation under the General Conduct framework. Ensure the sanctions align
              with the 2024 Faculty Handbook guidelines.
            </p>
            <button className="bg-emerald-500 hover:bg-emerald-400 px-6 py-3 rounded-xl text-[12px] font-bold transition-all flex items-center gap-2 tracking-wide text-white">
              VIEW FULL PDF
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </button>
          </div>

          {/* Shelf Image */}
          <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] h-[300px] border border-[#f1f5f9]">
            <img
              src={shelfImg}
              alt="Library bookshelf"
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-[2s]"
            />
          </div>
        </div>
      </div>

      {/* ═══════════ GENERATE BUTTON (full-width below both columns) ═══════════ */}
      <div className="mt-10 flex flex-col items-center">
        <button
          onClick={handleGenerateRecommendation}
          disabled={isGenerating}
          className={`w-full max-w-[720px] h-[64px] rounded-2xl flex items-center justify-center gap-3 font-pjs font-bold text-[17px] tracking-tight transition-all ${
            isGenerating
              ? 'bg-[#003624] text-white/50 cursor-not-allowed opacity-80'
              : 'bg-[#003624] text-white hover:bg-[#004d35] active:scale-[0.98] shadow-xl shadow-emerald-950/20'
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Incident Details...</span>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              Generate Summary &amp; Recommendation
            </>
          )}
        </button>

        <p className="mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] text-center">
          Security Protocols Active. Data will be encrypted upon generation.
        </p>
      </div>
    </div>
  );
}
