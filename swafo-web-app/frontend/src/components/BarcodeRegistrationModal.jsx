import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { API_ENDPOINTS } from '../api/config';
import BarcodeScanner from './BarcodeScanner';

/**
 * Visual SVG Barcode Renderer
 * Generates an authentic-looking 1D barcode pattern from any string
 */
function VisualBarcode({ value, height = 55 }) {
  if (!value) return null;

  // Generate pseudo-deterministic bar pattern from characters
  const bars = [];
  let currentPos = 10;
  const chars = String(value);

  // Start guard
  bars.push({ x: currentPos, w: 2 }); currentPos += 4;
  bars.push({ x: currentPos, w: 2 }); currentPos += 4;

  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i);
    const pattern = [
      (code % 3) + 1,
      ((code >> 1) % 3) + 1,
      ((code >> 2) % 3) + 1,
      ((code >> 3) % 2) + 1,
    ];
    for (let p of pattern) {
      bars.push({ x: currentPos, w: p });
      currentPos += p + 2;
    }
  }

  // End guard
  bars.push({ x: currentPos, w: 2 }); currentPos += 4;
  bars.push({ x: currentPos, w: 2 }); currentPos += 14;

  const totalWidth = currentPos;

  return (
    <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-slate-200/80 shadow-inner">
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[280px] h-[55px]"
        preserveAspectRatio="none"
      >
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y="0"
            width={bar.w}
            height={height}
            fill="#0f172a"
          />
        ))}
      </svg>
      <span className="font-mono text-[12px] font-black tracking-[0.25em] text-slate-800 mt-1.5 uppercase">
        {value}
      </span>
    </div>
  );
}

export default function BarcodeRegistrationModal({
  isOpen,
  onClose,
  profile,
  onSuccess,
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera' | 'manual'
  const [barcodeInput, setBarcodeInput] = useState(profile?.barcode_value || '');
  const [isDecodingFile, setIsDecodingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [fileSuccess, setFileSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [showLiveScanner, setShowLiveScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const studentNumber = profile?.student_number;
  const fullName = profile?.user_details?.full_name || 'Student';

  // ── Handle ID / Barcode Image Upload (Multi-Engine Pipeline) ──
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');
    setFileSuccess('');
    setIsDecodingFile(true);

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    let detectedCode = null;

    // ── Tier 1: Native Browser BarcodeDetector (instant, GPU-accelerated) ──
    try {
      if ('BarcodeDetector' in window) {
        const supported = await window.BarcodeDetector.getSupportedFormats().catch(() => []);
        if (supported.length > 0) {
          const detector = new window.BarcodeDetector({ 
            formats: supported.filter(f => ['code_128', 'code_39', 'ean_13', 'upc_a'].includes(f))
          });
          const imgBitmap = await createImageBitmap(file);
          const detected = await detector.detect(imgBitmap);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            detectedCode = detected[0].rawValue.trim();
          }
        }
      }
    } catch (detectorErr) {
      console.warn('Native BarcodeDetector pass skipped:', detectorErr);
    }

    // ── Tier 2: Dedicated Backend Barcode Decoder (zxing-cpp C++ engine) ──
    if (!detectedCode) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        const resp = await fetch(API_ENDPOINTS.DECODE_BARCODE, {
          method: 'POST',
          body: formData,
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && data.barcode) {
            detectedCode = data.barcode.trim();
          }
        }
      } catch (backendErr) {
        console.warn('Backend zxing-cpp decode pass error:', backendErr);
      }
    }

    // ── Tier 3: Client-side html5-qrcode fallback ──
    if (!detectedCode) {
      try {
        const html5QrCode = new Html5Qrcode('barcode-file-decoder-temp', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        const decodedText = await html5QrCode.scanFile(file, false);
        await html5QrCode.clear();

        if (decodedText && decodedText.trim()) {
          detectedCode = decodedText.trim();
        }
      } catch (html5Err) {
        console.warn('Html5Qrcode fallback pass error:', html5Err);
      }
    }

    if (detectedCode) {
      setBarcodeInput(detectedCode);
      setFileSuccess(`Barcode decoded: "${detectedCode}"`);
    } else {
      setFileError('Could not auto-detect barcode from this photo. Barcode scanners require white margins (quiet zone) around the bars. You can type or edit your barcode value below.');
    }

    setIsDecodingFile(false);
  };

  // ── Handle Camera Scan Completion ──
  const handleCameraScan = (scannedText) => {
    setShowLiveScanner(false);
    if (scannedText) {
      setBarcodeInput(scannedText);
      setFileSuccess(`Barcode scanned: "${scannedText}"`);
    }
  };

  // ── Submit / Save Barcode to Backend ──
  const handleSave = async () => {
    if (!studentNumber) {
      setSubmitError('Missing student profile number.');
      return;
    }

    if (!barcodeInput.trim()) {
      setSubmitError('Please scan, upload, or enter a barcode value.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_BARCODE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_number: studentNumber,
          barcode_value: barcodeInput.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        if (onSuccess) {
          onSuccess(data.barcode_value);
        }
        setTimeout(() => {
          setSubmitSuccess(false);
          onClose();
        }, 1200);
      } else {
        setSubmitError(data.error || 'Failed to save barcode. Please try again.');
      }
    } catch (err) {
      console.error('Barcode save error:', err);
      setSubmitError('Network error connecting to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Clear / Unlink Barcode ──
  const handleClear = async () => {
    if (!studentNumber) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_BARCODE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_number: studentNumber,
          barcode_value: '',
        }),
      });
      if (response.ok) {
        setBarcodeInput('');
        setImagePreview(null);
        setFileSuccess('Barcode removed.');
        if (onSuccess) onSuccess('');
      }
    } catch (err) {
      console.error('Clear barcode error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <>
      {/* Hidden DOM element required by html5-qrcode for file scanning */}
      <div id="barcode-file-decoder-temp" style={{ display: 'none' }} />

      {/* Real Camera Scanner Modal */}
      {showLiveScanner && (
        <BarcodeScanner
          onScan={handleCameraScan}
          onClose={() => setShowLiveScanner(false)}
        />
      )}

      {/* Main Barcode Registration Dialog */}
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.35)] border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="bg-[#003624] text-white px-8 py-6 flex items-center justify-between relative overflow-hidden shrink-0">
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[140px]">qr_code_2</span>
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
                <span className="material-symbols-outlined text-[26px]">badge</span>
              </div>
              <div>
                <h3 className="font-pjs font-black text-[20px] leading-tight">
                  Student ID Barcode Registration
                </h3>
                <p className="font-manrope text-[12px] text-emerald-100/70 font-medium">
                  DLSU-D Patrol Identification & Verification System
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95 transition-all relative z-10"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">

            {/* Current Status Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  profile?.barcode_value ? 'bg-emerald-100 text-[#006b5d]' : 'bg-amber-100 text-amber-700'
                }`}>
                  <span className="material-symbols-outlined text-[22px]">
                    {profile?.barcode_value ? 'verified' : 'pending'}
                  </span>
                </div>
                <div>
                  <p className="font-pjs font-bold text-[13px] text-slate-800 leading-none">
                    {profile?.barcode_value ? 'Physical ID Barcode Linked' : 'No Barcode Linked Yet'}
                  </p>
                  <p className="font-manrope text-[11px] text-slate-500 mt-1">
                    {profile?.barcode_value
                      ? `Active Barcode: ${profile.barcode_value}`
                      : 'Upload an image or scan your ID barcode below.'}
                  </p>
                </div>
              </div>

              {profile?.barcode_value && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isSubmitting}
                  className="text-rose-600 hover:text-rose-700 text-[11px] font-pjs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Unlink
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl font-pjs text-[13px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white text-[#003624] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'camera'
                    ? 'bg-white text-[#003624] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                Live Camera
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white text-[#003624] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">keyboard</span>
                Manual
              </button>
            </div>

            {/* Tab 1: Upload Barcode Image */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
                >
                  {imagePreview ? (
                    <div className="relative mb-3">
                      <img
                        src={imagePreview}
                        alt="Uploaded ID Barcode"
                        className="max-h-[140px] max-w-full rounded-2xl object-contain border border-slate-200 shadow-sm"
                      />
                      {isDecodingFile && (
                        <div className="absolute inset-0 bg-[#003624]/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-white">
                          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-2" />
                          <span className="text-[11px] font-bold">Decoding Barcode...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[28px]">add_photo_alternate</span>
                    </div>
                  )}

                  <p className="font-pjs font-bold text-[14px] text-[#003624]">
                    {imagePreview ? 'Click to choose a different photo' : 'Upload photo of your ID barcode'}
                  </p>
                  <p className="font-manrope text-[12px] text-slate-500 mt-1 max-w-xs">
                    Take a well-lit photo of the barcode. Keep white space (quiet zone) around the bars and avoid cropping directly against the black lines.
                  </p>
                </div>

                {fileSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[12px] font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                    {fileSuccess}
                  </div>
                )}

                {fileError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[12px] font-medium flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">warning</span>
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Live Camera Scan */}
            {activeTab === 'camera' && (
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200/80 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10">
                  <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
                </div>
                <div>
                  <h4 className="font-pjs font-bold text-[16px] text-slate-800">
                    Scan via Web Camera
                  </h4>
                  <p className="font-manrope text-[12px] text-slate-500 mt-1 max-w-sm">
                    Hold your physical student ID up to your device camera to automatically capture the barcode code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLiveScanner(true)}
                  className="bg-[#006b5d] hover:bg-[#004d33] text-white px-6 py-3 rounded-2xl font-pjs font-bold text-[13px] flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  Launch Camera Scanner
                </button>
              </div>
            )}

            {/* Tab 3: Manual Input & Confirmation */}
            <div className="space-y-3 pt-2">
              <label className="block font-pjs font-bold text-[12px] text-slate-700 uppercase tracking-wider">
                ID Barcode Value / Extracted Code
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  barcode
                </span>
                <input
                  type="text"
                  placeholder="e.g. 202402914 or barcode string"
                  value={barcodeInput}
                  onChange={(e) => {
                    setBarcodeInput(e.target.value);
                    setFileSuccess('');
                    setFileError('');
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-[#006b5d] focus:bg-white rounded-2xl font-mono text-[15px] font-bold text-slate-800 outline-none transition-all shadow-inner"
                />
              </div>

              {/* DLSU-D Standard ID Pattern Quick-Fill Helper */}
              {studentNumber && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-emerald-700 shrink-0">lightbulb</span>
                    <p className="text-[11px] text-emerald-900 font-manrope">
                      <strong>DLSU-D Pattern:</strong> Physical barcode is typically <code className="bg-emerald-100/80 px-1 py-0.5 rounded font-mono font-bold">20{studentNumber}</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBarcodeInput(`20${studentNumber}`);
                      setFileError('');
                      setFileSuccess(`Applied DLSU-D standard barcode: 20${studentNumber}`);
                    }}
                    className="self-start sm:self-auto text-[11px] font-bold text-[#003624] bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    Use 20{studentNumber}
                  </button>
                </div>
              )}

              <p className="font-manrope text-[11px] text-slate-400">
                You can review or edit the value extracted from your ID before saving.
              </p>
            </div>

            {/* Visual Barcode Card Preview */}
            {barcodeInput.trim() && (
              <div className="pt-2">
                <p className="font-pjs font-bold text-[11px] text-slate-400 uppercase tracking-widest mb-2">
                  Digital Barcode Preview
                </p>
                <div className="bg-gradient-to-br from-[#003624] to-[#005238] rounded-3xl p-5 text-white shadow-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                        DLSU-D Student Identity
                      </p>
                      <h4 className="font-pjs font-black text-[16px] text-white">
                        {fullName}
                      </h4>
                      <p className="text-[11px] text-emerald-100/70 font-mono">
                        SN: {studentNumber}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                      <span className="material-symbols-outlined text-[20px] text-emerald-300">school</span>
                    </div>
                  </div>

                  <VisualBarcode value={barcodeInput.trim()} />
                </div>
              </div>
            )}

            {/* Submission Alerts */}
            {submitError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-[12px] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-[12px] font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                ID Barcode linked successfully!
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-pjs font-bold text-[13px] text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || !barcodeInput.trim()}
              className="bg-[#003624] hover:bg-[#00281b] disabled:opacity-50 text-white px-7 py-2.5 rounded-xl font-pjs font-bold text-[13px] flex items-center gap-2 shadow-md shadow-emerald-900/10 active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">link</span>
                  Save & Link Barcode
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}
