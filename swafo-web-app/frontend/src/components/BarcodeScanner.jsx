import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * BarcodeScanner
 * Props:
 *  onScan(decodedValue: string) — called when a barcode is successfully decoded
 *  onClose()                   — called when the user closes the scanner
 */
export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('initializing'); // 'initializing' | 'scanning' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const scannerId = 'barcode-scanner-viewport';
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;

    const config = {
      fps: 15,
      formatsToSupport: [
        0,  // QR_CODE
        1,  // AZTEC
        2,  // CODABAR
        3,  // CODE_39
        4,  // CODE_93
        5,  // CODE_128   ← most likely format for university IDs
        6,  // DATA_MATRIX
        7,  // MAXICODE
        8,  // ITF
        9,  // EAN_13
        10, // EAN_8
        11, // PDF_417
        12, // RSS_14
        13, // RSS_EXPANDED
        14, // UPC_A
        15, // UPC_E
        16, // UPC_EAN_EXTENSION
      ],
    };

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras || cameras.length === 0) {
          setStatus('error');
          setErrorMsg('No camera found on this device.');
          return;
        }

        // Prefer back/environment camera for mobile scanning
        const backCamera = cameras.find(
          (c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
        );
        const cameraId = backCamera ? backCamera.id : cameras[0].id;

        setStatus('scanning');
        html5QrCode
          .start(
            cameraId,
            config,
            (decodedText) => {
              // Stop scanning once we have a result
              html5QrCode.stop().then(() => {
                onScan(decodedText.trim());
              });
            },
            () => {
              // ignore per-frame decode failures (normal)
            }
          )
          .catch((err) => {
            setStatus('error');
            setErrorMsg(`Camera error: ${err}`);
          });
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Camera permission denied. Please allow camera access and try again.');
      });

    return () => {
      // Cleanup on unmount
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, []);

  const handleClose = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().then(onClose).catch(onClose);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <style>{`
        #barcode-scanner-viewport video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 2rem !important;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 z-10">
        <div>
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
            SWAFO Scanner
          </p>
          <h2 className="text-white text-[20px] font-black leading-tight">
            Scan Student ID Barcode
          </h2>
        </div>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Viewfinder area */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4">
        {/* The div html5-qrcode mounts the video into */}
        <div
          id="barcode-scanner-viewport"
          className="w-full max-w-[400px] rounded-[2rem] overflow-hidden"
          style={{ minHeight: 300 }}
        />

        {/* Scan frame overlay */}
        <div className="absolute pointer-events-none">
          <div
            className="border-2 border-emerald-400 rounded-2xl relative"
            style={{ width: 300, height: 110 }}
          >
            {/* Animated scan line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)] animate-scan" />
            {/* Corner accents */}
            <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-4 border-l-4 border-emerald-300 rounded-tl-xl" />
            <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-4 border-r-4 border-emerald-300 rounded-tr-xl" />
            <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-4 border-l-4 border-emerald-300 rounded-bl-xl" />
            <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-4 border-r-4 border-emerald-300 rounded-br-xl" />
          </div>
        </div>

        {/* Status text */}
        <p className="text-white/50 text-[12px] font-bold mt-6 text-center">
          {status === 'initializing' && 'Starting camera...'}
          {status === 'scanning' && 'Point at the barcode on the student ID'}
          {status === 'error' && (
            <span className="text-rose-400">{errorMsg}</span>
          )}
        </p>
      </div>

      {/* Footer hint + manual fallback */}
      <div className="px-6 pb-12 text-center space-y-4">
        <p className="text-white/20 text-[11px] font-medium">
          Keep the barcode flat and well-lit for faster detection
        </p>
        <button
          onClick={handleClose}
          className="text-white/40 text-[12px] font-black uppercase tracking-[0.15em] underline underline-offset-4 active:opacity-60"
        >
          Enter Manually Instead
        </button>
      </div>
    </div>
  );
}
