import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../components/ui";
import BarcodeScanner from "../../components/barcode/BarcodeScanner";
import { barcodeService } from "../../api/barcode.service";
import { ArrowRight, MapPin, Box, CheckCircle2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export const PutAway: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation("common");

  // Scanned States
  const [locationBarcode, setLocationBarcode] = useState("");
  const [locationData, setLocationData] = useState<any | null>(null);
  
  const [batchBarcode, setBatchBarcode] = useState("");
  const [batchData, setBatchData] = useState<any | null>(null);

  // Active step
  const [activeStep, setActiveStep] = useState<"location" | "batch" | "confirm">("location");
  
  // Audio feedback helper using SpeechSynthesis
  const speakFeedback = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Put Away Mutation
  const putAwayMutation = useMutation({
    mutationFn: () =>
      barcodeService.putAway({
        batch_barcode: batchBarcode,
        location_barcode: locationBarcode,
      }),
    onSuccess: (res) => {
      if (res.error) {
        speakFeedback((res.error as any)?.message || "Failed");
        toast({
          title: "Put Away Gagal",
          description: (res.error as any)?.message,
          variant: "destructive",
        });
        return;
      }
      
      speakFeedback("Put away completed");
      toast({
        title: "Put Away Berhasil",
        description: `Batch ${batchData?.batch_number} berhasil diletakkan di ${locationData?.rack}`,
        variant: "default",
      });
      
      // Reset flow
      handleReset();
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      speakFeedback(err.message || "Put away error");
      toast({
        title: "Error",
        description: err.message || "Terjadi kesalahan sistem saat put away",
        variant: "destructive",
      });
    },
  });

  const handleReset = () => {
    setLocationBarcode("");
    setLocationData(null);
    setBatchBarcode("");
    setBatchData(null);
    setActiveStep("location");
  };

  // Main global barcode scanner listener handler
  const handleGlobalScan = async (barcode: string) => {
    try {
      // Lookup the barcode in registry
      const res = await barcodeService.lookupBarcode(barcode);
      
      if (res.error || !res.data) {
        speakFeedback("Barcode not found");
        toast({
          title: "Barcode Tidak Dikenal",
          description: `Barcode "${barcode}" tidak terdaftar di sistem.`,
          variant: "destructive",
        });
        return;
      }

      const { registry, entity } = (res.data as any);

      if (activeStep === "location") {
        if (registry.type !== "LOCATION") {
          speakFeedback("Scan location first");
          toast({
            title: "Harap Scan Lokasi Rak",
            description: "Saat ini Anda harus memindai barcode Rak / Lokasi Penyimpanan terlebih dahulu.",
            variant: "default",
          });
          return;
        }
        setLocationBarcode(barcode);
        setLocationData(entity);
        setActiveStep("batch");
        speakFeedback("Location set");
      } else if (activeStep === "batch" || activeStep === "confirm") {
        if (registry.type !== "BATCH") {
          // If user scans another location, switch the location
          if (registry.type === "LOCATION") {
            setLocationBarcode(barcode);
            setLocationData(entity);
            setActiveStep("batch");
            speakFeedback("Location updated");
            return;
          }
          speakFeedback("Scan batch label");
          toast({
            title: "Harap Scan Label Batch",
            description: "Saat ini Anda harus memindai barcode Batch barang masuk.",
            variant: "default",
          });
          return;
        }

        // Validate B3 hazard area hook compatibility checks before accepting batch details
        try {
          const valRes = await barcodeService.validateBarcode({
            barcode,
            expected_location_id: locationData?.id,
          });
          
          if (valRes.error) {
            const errMsg = (valRes.error as any)?.message || "";
            if (!errMsg.includes("Wrong Location")) {
              speakFeedback(errMsg);
              toast({
                title: "Validasi Gagal",
                description: errMsg,
                variant: "destructive",
              });
              return;
            }
          }
        } catch (e) {}

        setBatchBarcode(barcode);
        setBatchData(entity);
        setActiveStep("confirm");
        speakFeedback("Batch loaded");
      }
    } catch (err: any) {
      speakFeedback("System error");
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
      <BarcodeScanner mode="put_away" onScan={handleGlobalScan} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t("putAway.title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("putAway.subtitle")}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold transition"
        >
          {t("putAway.resetBtn")}
        </button>
      </div>

      {/* Put Away Workflow Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Step 1: Scan Location */}
        <div 
          className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
            activeStep === "location"
              ? "bg-indigo-50/50 border-indigo-300 dark:bg-indigo-950/10 dark:border-indigo-900/50 shadow-md scale-[1.01]"
              : locationData
              ? "bg-emerald-50/20 border-emerald-250 dark:bg-emerald-950/5 dark:border-emerald-900/20"
              : "bg-slate-50/50 border-slate-200 dark:bg-slate-950/10 dark:border-slate-800 opacity-60"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                locationData ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"
              }`}>
                1
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {t("putAway.step1Header")}
              </span>
            </div>

            <div className="flex items-start gap-4 pt-2">
              <div className={`p-3 rounded-xl ${
                locationData ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600"
              }`}>
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {locationData ? locationData.rack : "Scan Barcode Lokasi / Rak"}
                </h4>
                <p className="text-xs text-slate-500">
                  {locationData ? `Warehouse: ${locationData.warehouse_id}` : "Pindai barcode lokasi penyimpanan permanen"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 mt-4 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">
              Barcode: {locationBarcode || "-"}
            </span>
            {activeStep === "location" && (
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">
                MENUNGGU SCAN...
              </span>
            )}
          </div>
        </div>

        {/* Step 2: Scan Batch */}
        <div 
          className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
            activeStep === "batch"
              ? "bg-indigo-50/50 border-indigo-300 dark:bg-indigo-950/10 dark:border-indigo-900/50 shadow-md scale-[1.01]"
              : batchData
              ? "bg-emerald-50/20 border-emerald-250 dark:bg-emerald-950/5 dark:border-emerald-900/20"
              : "bg-slate-50/50 border-slate-200 dark:bg-slate-950/10 dark:border-slate-800 opacity-60"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                batchData ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"
              }`}>
                2
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                BATCH BARANG MASUK
              </span>
            </div>

            <div className="flex items-start gap-4 pt-2">
              <div className={`p-3 rounded-xl ${
                batchData ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600"
              }`}>
                <Box className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                  {batchData ? batchData.product?.name : "Scan Barcode Batch"}
                </h4>
                <p className="text-xs text-slate-500">
                  {batchData ? `Batch: ${batchData.batch_number} (Qty: ${batchData.qty} ${batchData.product?.unit})` : "Pindai label batch yang tertempel pada dus karton"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 mt-4 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">
              Barcode: {batchBarcode || "-"}
            </span>
            {activeStep === "batch" && (
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">
                MENUNGGU SCAN...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Panel */}
      {activeStep === "confirm" && locationData && batchData && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-md">
                Siap Letakkan Barang
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 justify-center md:justify-start">
                <span>{batchData.batch_number} ({batchData.product?.name})</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{locationData.rack}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => putAwayMutation.mutate()}
            disabled={putAwayMutation.isPending}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-sm shadow-md"
          >
            {putAwayMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Konfirmasi Letakkan Barang"
            )}
          </button>
        </div>
      )}

      {/* Fallback Inputs for manual input testing */}
      <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">
          Input Manual (Pengetesan)
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-[11px] text-slate-500 font-semibold">Barcode Lokasi</label>
            <input
              type="text"
              placeholder="e.g. LOC00000001"
              value={locationBarcode}
              onChange={(e) => setLocationBarcode(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs focus:outline-none"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-[11px] text-slate-500 font-semibold">Barcode Batch</label>
            <input
              type="text"
              placeholder="e.g. BAT00000001"
              value={batchBarcode}
              onChange={(e) => setBatchBarcode(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl text-xs focus:outline-none"
            />
          </div>
        </div>
        {(locationBarcode || batchBarcode) && (
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => handleGlobalScan(locationBarcode || batchBarcode)}
              className="px-4 py-1.5 bg-indigo-650 text-white text-xs font-bold rounded-lg hover:bg-indigo-755 transition"
            >
              Proses Input Manual
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default PutAway;
