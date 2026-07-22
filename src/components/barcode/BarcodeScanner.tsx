import React, { useEffect, useState } from "react";
import { useScannerStore } from "../../store/scanner.store";
import { KeyboardScanProvider } from "../../utils/scanProviders";
import { barcodeService } from "../../api/barcode.service";
import { audioFeedback } from "../../utils/audioFeedback";
import CameraScannerModal from "./CameraScannerModal";
import { Camera } from "lucide-react";

interface BarcodeScannerProps {
  mode: "receiving" | "put_away" | "picking" | "outward" | "transfer" | "opname" | "general";
  onScan: (barcode: string) => void;
  expectedWarehouseId?: string;
  expectedLocationId?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  mode,
  onScan,
  expectedWarehouseId,
  expectedLocationId,
}) => {
  const { scannerGapMs, setScannerGapMs } = useScannerStore();
  const [lastScanned, setLastScanned] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [tempGap, setTempGap] = useState(scannerGapMs);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [testInput, setTestInput] = useState<string>("");

  const processBarcode = async (barcode: string) => {
    setLastScanned(barcode);
    setPulse(true);
    setScanError(null);
    setTimeout(() => setPulse(false), 500);

    try {
      const payload: { barcode: string; expected_warehouse_id?: string; expected_location_id?: string } = {
        barcode,
      };
      if (expectedWarehouseId) payload.expected_warehouse_id = expectedWarehouseId;
      if (expectedLocationId) payload.expected_location_id = expectedLocationId;

      const res = (mode === "picking" || mode === "outward")
        ? await barcodeService.validatePickBarcode(payload)
        : await barcodeService.validateBarcode(payload);

      if (res.error) {
        throw new Error((res.error as any)?.message || "Validation failed");
      }

      if (soundEnabled) audioFeedback.playSuccessBeep();
      onScan(barcode);
    } catch (err: any) {
      console.error("Scan validation failed:", err);
      const errMsg = err?.message || "Invalid Barcode";
      setScanError(errMsg);
      if (soundEnabled) audioFeedback.playErrorBeep();
      onScan(barcode);
    }
  };

  useEffect(() => {
    // Instantiate Keyboard Scan Provider with current configurable gap
    const provider = new KeyboardScanProvider(scannerGapMs);

    provider.start((barcode) => {
      processBarcode(barcode);
    });

    return () => {
      provider.stop();
    };
  }, [scannerGapMs, onScan, expectedWarehouseId, expectedLocationId, mode, soundEnabled]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setScannerGapMs(tempGap);
    setIsSettingsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none font-sans">
      {/* Floating Status Badge */}
      <div className="flex flex-col items-end gap-2">
        {scanError && (
          <div className="bg-rose-900/90 text-rose-200 border border-rose-700/80 px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150 max-w-[260px] flex items-center justify-between gap-2">
            <span>{scanError}</span>
            <button onClick={() => setScanError(null)} className="text-rose-400 hover:text-white font-bold">&times;</button>
          </div>
        )}

        <div 
          className={`flex items-center gap-3 bg-slate-900/90 dark:bg-slate-950/90 text-white px-4 py-2.5 rounded-full shadow-lg border border-slate-700/50 backdrop-blur-md transition-all duration-300 ${
            pulse ? "scale-105 border-emerald-400 ring-2 ring-emerald-500/20" : ""
          } ${scanError ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
        >
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${scanError ? "bg-rose-400" : pulse ? "bg-emerald-400" : "bg-sky-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${scanError ? "bg-rose-500" : pulse ? "bg-emerald-500" : "bg-sky-500"}`}></span>
          </span>
          
          <div className="flex flex-col text-left leading-none pr-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Scanner ({mode})
            </span>
            <span className="text-xs font-semibold mt-0.5 truncate max-w-[120px]">
              {lastScanned || "Ready to Scan"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 p-1.5 hover:bg-white/10 rounded-full transition"
              title="Buka Kamera Scanner (HP/Tablet)"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button 
              onClick={() => {
                setTempGap(scannerGapMs);
                setIsSettingsOpen(!isSettingsOpen);
              }}
              className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition"
              title="Scanner Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal popover */}
      {isSettingsOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-xl p-4 text-white text-left animate-in slide-in-from-bottom-2 duration-150">
          <form onSubmit={handleSaveSettings} className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Hardware Scanner Settings
            </h4>
            
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-300">
                Keystroke Gap Delay (ms)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={tempGap}
                onChange={(e) => setTempGap(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="block text-[9px] text-slate-500 leading-normal">
                Slow bluetooth scanners: 100-150ms. Fast USB scanners: 30-50ms.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <input
                type="checkbox"
                id="soundToggle"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="soundToggle" className="text-xs text-slate-300 cursor-pointer">
                Enable Audio & Haptic Feedback
              </label>
            </div>

            {/* Camera Scan Button inside Settings */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsCameraOpen(true);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Buka Live Kamera Scanner
              </button>
            </div>

            {/* Test Scan Input Box */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <label className="block text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                Simulasi Scan Manual (Test)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ketik/Paste Barcode + Enter"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (testInput.trim()) {
                        processBarcode(testInput.trim());
                        setTestInput("");
                      }
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (testInput.trim()) {
                      processBarcode(testInput.trim());
                      setTestInput("");
                    }
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition whitespace-nowrap"
                >
                  Scan
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(scannedBarcode) => {
          processBarcode(scannedBarcode);
        }}
      />
    </div>
  );
};
export default BarcodeScanner;
