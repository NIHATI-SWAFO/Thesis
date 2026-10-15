import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { API_ENDPOINTS } from '../api/config';

/**
 * Normalizes a raw barcode value.
 * In DLSU-D, physical ID barcodes contain an extra "20" prefix (11 digits: "20" + 9-digit student number).
 * Extracts the 9-digit student number while preserving the raw barcode.
 */
function normalizeStudentBarcode(rawBarcode) {
  if (!rawBarcode) return { raw: '', extractedId: null };
  const raw = String(rawBarcode).trim();
  const digits = raw.replace(/\D/g, '');
  let extractedId = null;
  if (digits.length === 11 && digits.startsWith('20')) {
    extractedId = digits.slice(2);
  } else if (digits.length === 9) {
    extractedId = digits;
  }
  return { raw, extractedId };
}

/**
 * High-Reliability Barcode Scanner
 * 
 * Multi-Engine Architecture:
 * 1. Native GPU BarcodeDetector (Chrome/Edge/Android native C++ at 30fps)
 * 2. Enhanced Html5Qrcode with CODE_128/39/EAN formats + 1080p constraints
 * 3. Real-Time Snapshot Decoder (zxing-cpp backend with adaptive binarization)
 * 4. Manual "Snap & Decode" trigger for difficult or low-light physical IDs
 * 5. Torch / Flashlight control for dark environments & glare management
 * 6. Quick image upload fallback
 */
export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const videoTrackRef = useRef(null);
  const nativeDetectorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const backendProbeIntervalRef = useRef(null);
  const isFinishedRef = useRef(false);
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState('initializing'); // 'initializing' | 'scanning' | 'decoding_snapshot' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [detectedResult, setDetectedResult] = useState(null);
  const [engineBadge, setEngineBadge] = useState('Initializing...');

  // Camera capabilities
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isCapturingSnap, setIsCapturingSnap] = useState(false);

  // Play crisp audio chime on detection
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.16);
      }
    } catch (e) {
      // Audio autoplay policy might silently block; non-fatal
    }
  }, []);

  // Safe cleanup of all hardware and loops
  const cleanupAll = useCallback(async () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (backendProbeIntervalRef.current) {
      clearInterval(backendProbeIntervalRef.current);
      backendProbeIntervalRef.current = null;
    }
    if (videoTrackRef.current) {
      try {
        if (isTorchOn) {
          await videoTrackRef.current.applyConstraints({ advanced: [{ torch: false }] });
        }
        videoTrackRef.current.stop();
      } catch (e) {}
      videoTrackRef.current = null;
    }
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
  }, [isTorchOn]);

  // Handle successful barcode recognition
  const handleSuccess = useCallback((rawCode, engineName = 'Camera') => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    const trimmed = String(rawCode || '').trim();
    if (!trimmed) return;

    const normalized = normalizeStudentBarcode(trimmed);
    setDetectedResult(normalized);
    setStatus('success');
    setEngineBadge(`Decoded via ${engineName}`);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([70, 30, 70]); } catch (e) {}
    }

    // Audio beep
    playBeep();

    // Short visual delay so user sees green flash and recognized student ID
    setTimeout(() => {
      cleanupAll().finally(() => {
        onScan(trimmed);
      });
    }, 450);
  }, [cleanupAll, onScan, playBeep]);

  // Capture frame from video element and send to backend zxing-cpp
  const captureAndDecodeFrame = useCallback(async (isManualTrigger = false) => {
    if (isFinishedRef.current) return;
    const scannerId = 'barcode-scanner-viewport';
    const container = document.getElementById(scannerId);
    const videoEl = container ? container.querySelector('video') : null;

    if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return;

    if (isManualTrigger) {
      setIsCapturingSnap(true);
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (!blob) {
        if (isManualTrigger) setIsCapturingSnap(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');

      const resp = await fetch(API_ENDPOINTS.DECODE_BARCODE, {
        method: 'POST',
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.barcode) {
          handleSuccess(data.barcode, 'Backend zxing-cpp');
          return;
        }
      }
    } catch (e) {
      console.warn('Backend snapshot decode error:', e);
    } finally {
      if (isManualTrigger) {
        setIsCapturingSnap(false);
      }
    }
  }, [handleSuccess]);

  // Start the camera and scanning engines
  const startScanner = useCallback(async (cameraIdToUse) => {
    setStatus('initializing');
    setErrorMsg('');
    isFinishedRef.current = false;

    // 1. Initialize Native BarcodeDetector if supported
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats().catch(() => []);
        const targetFormats = ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'].filter(f => supported.includes(f));
        if (targetFormats.length > 0) {
          nativeDetectorRef.current = new window.BarcodeDetector({ formats: targetFormats });
          setEngineBadge('Native GPU BarcodeDetector Active');
        }
      } catch (e) {
        console.warn('Native BarcodeDetector setup skipped:', e);
      }
    }

    const scannerId = 'barcode-scanner-viewport';
    const html5QrCode = new Html5Qrcode(scannerId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128, // primary DLSU-D ID barcode format
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
      verbose: false,
    });
    scannerRef.current = html5QrCode;

    // High resolution constraints for crisp barcode lines
    const scanConfig = {
      fps: 25,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const w = Math.min(Math.floor(viewfinderWidth * 0.90), 440);
        const h = Math.min(Math.floor(viewfinderHeight * 0.45), 180);
        return { width: Math.max(w, 240), height: Math.max(h, 90) };
      },
      videoConstraints: {
        deviceId: cameraIdToUse ? { exact: cameraIdToUse } : undefined,
        facingMode: cameraIdToUse ? undefined : { ideal: 'environment' },
        width: { ideal: 1920, min: 480 },
        height: { ideal: 1080, min: 480 },
      },
      disableFlip: false,
    };

    try {
      const cameraSource = cameraIdToUse || { facingMode: 'environment' };
      await html5QrCode.start(
        cameraSource,
        scanConfig,
        (decodedText) => {
          handleSuccess(decodedText, 'Html5Qrcode Live Feed');
        },
        () => {
          // Normal frame misses
        }
      );

      setStatus('scanning');

      // Hook into video element for hardware controls & Native Detector loop
      const container = document.getElementById(scannerId);
      const videoEl = container ? container.querySelector('video') : null;

      if (videoEl && videoEl.srcObject) {
        const tracks = videoEl.srcObject.getVideoTracks();
        if (tracks.length > 0) {
          const track = tracks[0];
          videoTrackRef.current = track;

          // Check torch capability
          try {
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            if (capabilities.torch) {
              setHasTorch(true);
            }
          } catch (e) {}
        }

        // Native GPU Detection Loop (runs at 25-30fps directly on video element)
        if (nativeDetectorRef.current) {
          const runNativeLoop = async () => {
            if (isFinishedRef.current) return;
            if (videoEl.readyState >= 2) {
              try {
                const barcodes = await nativeDetectorRef.current.detect(videoEl);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  handleSuccess(barcodes[0].rawValue, 'Native GPU BarcodeDetector');
                  return;
                }
              } catch (e) {}
            }
            animationFrameRef.current = requestAnimationFrame(runNativeLoop);
          };
          animationFrameRef.current = requestAnimationFrame(runNativeLoop);
        }
      }

      // Backend zxing-cpp auto-probe (captures frame every 1.5s as background fallback)
      backendProbeIntervalRef.current = setInterval(() => {
        if (!isFinishedRef.current) {
          captureAndDecodeFrame(false);
        }
      }, 1500);

    } catch (err) {
      console.error('Camera start error:', err);
      setStatus('error');
      setErrorMsg(
        typeof err === 'string'
          ? err
          : err?.message || 'Unable to access camera. Please check permissions.'
      );
    }
  }, [captureAndDecodeFrame, handleSuccess]);

  // Initial camera enumeration & start
  useEffect(() => {
    let mounted = true;

    Html5Qrcode.getCameras()
      .then((cams) => {
        if (!mounted) return;
        if (!cams || cams.length === 0) {
          setStatus('error');
          setErrorMsg('No camera hardware detected on this device.');
          return;
        }

        setCameras(cams);

        // Find rear / environment camera
        const backCam = cams.find(
          (c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
        );

        const initialId = backCam ? backCam.id : cams[0].id;
        setSelectedCameraId(initialId);
        startScanner(initialId);
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus('error');
        setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings.');
      });

    return () => {
      mounted = false;
      cleanupAll();
    };
  }, []);

  // Switch camera when user selects a different one
  const handleCameraChange = async (newCameraId) => {
    setSelectedCameraId(newCameraId);
    await cleanupAll();
    startScanner(newCameraId);
  };

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!videoTrackRef.current) return;
    try {
      const nextState = !isTorchOn;
      await videoTrackRef.current.applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Handle direct file upload fallback
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('decoding_snapshot');
    setEngineBadge('Analyzing uploaded image...');

    try {
      // 1. Native BarcodeDetector pass
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats().catch(() => []);
          const activeFormats = ['code_128', 'code_39', 'ean_13', 'upc_a'].filter(f => supported.includes(f));
          if (activeFormats.length > 0) {
            const detector = new window.BarcodeDetector({ formats: activeFormats });
            const bitmap = await createImageBitmap(file);
            const res = await detector.detect(bitmap);
            if (res && res.length > 0 && res[0].rawValue) {
              handleSuccess(res[0].rawValue, 'Native BarcodeDetector (Upload)');
              return;
            }
          }
        } catch (e) {}
      }

      // 2. Dedicated Backend zxing-cpp pass
      const formData = new FormData();
      formData.append('image', file);
      const resp = await fetch(API_ENDPOINTS.DECODE_BARCODE, {
        method: 'POST',
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.barcode) {
          handleSuccess(data.barcode, 'zxing-cpp C++ Engine (Upload)');
          return;
        }
      }

      // Fallback message
      alert('Could not detect barcode from uploaded image. Please ensure good lighting and clear barcode bars.');
      setStatus('scanning');
      setEngineBadge('Ready');
    } catch (err) {
      console.error('File decode error:', err);
      alert('Failed to process image file.');
      setStatus('scanning');
    }
  };

  const handleClose = async () => {
    await cleanupAll();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex flex-col justify-between text-white select-none">
      <style>{`
        #barcode-scanner-viewport {
          position: absolute !important;
          inset: 0 !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: #000 !important;
          overflow: hidden !important;
        }
        #barcode-scanner-viewport video {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          width: 100% !important;
          height: 100% !important;
          min-width: 100% !important;
          min-height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }
        #barcode-scanner-viewport canvas {
          display: none !important;
        }
        #barcode-scanner-viewport > div {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          inset: 0 !important;
        }
        #qr-shaded-region {
          display: none !important;
        }
        @keyframes scanLaser {
          0% { top: 8%; opacity: 0.9; }
          50% { top: 88%; opacity: 1; }
          100% { top: 8%; opacity: 0.9; }
        }
        .animate-laser {
          animation: scanLaser 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* Hidden File Input for fallback image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ── Top Header Bar ── */}
      <div className="px-5 pt-8 pb-3 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                SWAFO Vision Engine
              </span>
              <span className="bg-emerald-950/80 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-700/50">
                1080p
              </span>
            </div>
            <h2 className="text-white text-[17px] font-black leading-tight">
              Scan DLSU-D Student ID Barcode
            </h2>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all cursor-pointer"
          aria-label="Close Scanner"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* ── Central Viewfinder Area ── */}
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden w-full h-full">
        {/* Html5Qrcode video mount container (covers full screen viewport) */}
        <div
          id="barcode-scanner-viewport"
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        />

        {/* Viewfinder Target Overlay (centered right over camera feed) */}
        <div className="relative z-10 flex flex-col items-center pointer-events-none px-4">
          {/* Rectangular Target Frame tailored to 1D ID Barcodes */}
          <div
            className={`w-[300px] sm:w-[380px] h-[130px] sm:h-[150px] rounded-2xl border-2 transition-all relative ${
              status === 'success'
                ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.7)]'
                : 'border-emerald-400/80 shadow-[0_0_25px_rgba(0,0,0,0.6)]'
            }`}
          >
            {/* Animated Laser Scan Line */}
            {status !== 'success' && (
              <div className="absolute left-2 right-2 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_rgba(16,185,129,1)] animate-laser" />
            )}

            {/* Corner Bracket Accents */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-300 rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-300 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-300 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-300 rounded-br-xl" />

            {/* Success Checkmark Pop */}
            {status === 'success' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in-75 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg mb-1">
                  <span className="material-symbols-outlined text-[32px]">check</span>
                </div>
                <span className="text-[13px] font-black text-emerald-300 tracking-wider">
                  BARCODE DETECTED
                </span>
              </div>
            )}
          </div>

          {/* Guide Hint */}
          <div className="mt-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-center max-w-xs">
            <p className="text-[12px] font-semibold text-emerald-200">
              {status === 'initializing' && 'Starting high-res camera...'}
              {status === 'scanning' && 'Align barcode inside the green box'}
              {status === 'decoding_snapshot' && 'Analyzing frame with C++ engine...'}
              {status === 'success' && detectedResult && (
                <span className="font-mono font-black text-white">
                  {detectedResult.extractedId ? `SN: ${detectedResult.extractedId}` : detectedResult.raw}
                </span>
              )}
              {status === 'error' && (
                <span className="text-rose-400 font-bold">{errorMsg}</span>
              )}
            </p>
          </div>
        </div>

        {/* Floating Quick Action Overlays (Torch & Cameras) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer ${
                isTorchOn
                  ? 'bg-amber-400 text-slate-900 shadow-amber-400/30'
                  : 'bg-black/60 text-white/90 border border-white/20 hover:bg-black/80'
              }`}
              title="Toggle Flashlight / Torch"
            >
              <span className="material-symbols-outlined text-[22px]">
                {isTorchOn ? 'flashlight_on' : 'flashlight_off'}
              </span>
            </button>
          )}

          {cameras.length > 1 && (
            <button
              onClick={() => {
                const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
                const nextIndex = (currentIndex + 1) % cameras.length;
                handleCameraChange(cameras[nextIndex].id);
              }}
              className="w-11 h-11 rounded-2xl bg-black/60 hover:bg-black/80 text-white/90 border border-white/20 flex items-center justify-center transition-all shadow-lg active:scale-90 cursor-pointer"
              title="Switch Camera"
            >
              <span className="material-symbols-outlined text-[22px]">flip_camera_ios</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom Controls Bar ── */}
      <div className="px-6 pt-3 pb-8 z-20 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center space-y-4">
        
        {/* Instant Manual Snapshot Trigger */}
        <div className="flex items-center gap-3 w-full max-w-sm justify-center">
          <button
            type="button"
            onClick={() => captureAndDecodeFrame(true)}
            disabled={status !== 'scanning' || isCapturingSnap}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-pjs font-black text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
          >
            {isCapturingSnap ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Analyzing Frame...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[19px]">photo_camera</span>
                <span>Snap & Decode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-pjs font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            title="Upload an ID photo instead"
          >
            <span className="material-symbols-outlined text-[19px]">upload_file</span>
            <span>Upload</span>
          </button>
        </div>

        {/* Engine status indicator & manual exit */}
        <div className="flex items-center justify-between w-full max-w-sm text-[11px] text-white/40 px-1">
          <span className="truncate max-w-[200px] text-emerald-400/80 font-mono text-[10px]">
            ⚡ {engineBadge}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/60 hover:text-white font-bold underline underline-offset-4 cursor-pointer"
          >
            Enter Manually
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
