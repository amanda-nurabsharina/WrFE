import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, X, RefreshCw } from "lucide-react";

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "html5-camera-scanner-view";

  useEffect(() => {
    if (!isOpen) return;

    let html5QrcodeScanner: Html5Qrcode | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        setIsScanning(true);

        html5QrcodeScanner = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
          verbose: false,
        });

        scannerRef.current = html5QrcodeScanner;

        const config = {
          fps: 10,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.0,
        };

        await html5QrcodeScanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (decodedText) {
              onScan(decodedText);
              stopCamera();
              onClose();
            }
          },
          () => {
            // Ignore scan failure frame errors
          }
        );
      } catch (err: any) {
        console.error("Camera scanner error:", err);
        setCameraError(
          err?.message || "Gagal membuka kamera. Pastikan izin kamera telah diberikan pada browser HP/Tablet."
        );
        setIsScanning(false);
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {
        console.error("Failed to stop camera scanner:", e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Scanner Kamera Live (HP / Tablet)</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Feed Container */}
        <div className="p-4 relative bg-black flex flex-col items-center justify-center min-h-[300px]">
          {cameraError ? (
            <div className="p-6 text-center text-xs text-rose-400 space-y-3">
              <p className="font-semibold">{cameraError}</p>
              <button
                onClick={() => {
                  setCameraError(null);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Coba Lagi
              </button>
            </div>
          ) : (
            <>
              <div id={containerId} className="w-full rounded-2xl overflow-hidden shadow-inner" />
              <p className="text-[11px] text-zinc-400 text-center mt-3 font-medium">
                Arahkan kamera HP ke barcode stiker produk / rak.
              </p>
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Status: {isScanning ? "Scanning Live..." : "Kamera Off"}
          </span>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraScannerModal;
