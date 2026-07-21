import React, { useState } from "react";
import BarcodeLabel from "./BarcodeLabel";
import { barcodeService } from "../../api/barcode.service";

interface BarcodePrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barcodeValue: string;
  labelType: "PRODUCT" | "BATCH";
  productName: string;
  productCode: string;
  price?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export const BarcodePrintDialog: React.FC<BarcodePrintDialogProps> = ({
  isOpen,
  onClose,
  barcodeValue,
  labelType,
  productName,
  productCode,
  price,
  batchNumber,
  expiryDate,
}) => {
  const [printQty, setPrintQty] = useState<number>(1);
  const [printReason, setPrintReason] = useState<string>("Initial Print");
  
  // Option Toggles
  const [showName, setShowName] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [showPrice, setShowPrice] = useState(false);
  const [showExpiry, setShowExpiry] = useState(true);

  if (!isOpen) return null;

  const handlePrint = async () => {
    try {
      await barcodeService.recordPrint({
        barcode: barcodeValue,
        label_type: labelType,
        qty: printQty,
        reason: printReason,
      });
    } catch (err) {
      console.error("Failed to log print action:", err);
    }
    
    // Trigger browser print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Print-only CSS block injected dynamically to override page dimensions for standard 50x30mm thermal layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          .print-area-wrapper {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: 50mm 30mm;
            margin: 0;
          }
          html, body {
            height: 100% !important;
            max-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-area-wrapper, .print-area-wrapper * {
            visibility: visible !important;
          }
          .print-area-wrapper {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 50mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }
          .thermal-label-sheet {
            width: 50mm !important;
            height: 30mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            text-align: center !important;
            font-family: Arial, sans-serif !important;
            color: #000000 !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            padding: 1.5mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .thermal-label-sheet:not(:last-child) {
            page-break-after: always !important;
            break-after: page !important;
          }
          .label-text-name {
            font-size: 8pt !important;
            font-weight: bold !important;
            max-width: 47mm !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            margin-bottom: 0.5mm !important;
          }
          .label-text-sub {
            font-size: 6.5pt !important;
            margin-bottom: 0.5mm !important;
          }
          .label-barcode-svg {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            margin-top: 0.5mm !important;
          }
          .label-barcode-svg svg {
            max-width: 47mm !important;
            max-height: 16mm !important;
          }
        }
      `}} />

      {/* Main Dialog Modal */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
            Print Thermal Barcode Label ({labelType})
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold">
            &times;
          </button>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-6">
          {/* Controls */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Print Quantity
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={printQty}
                onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Reason for Printing
              </label>
              <select
                value={printReason}
                onChange={(e) => setPrintReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Initial Print">Initial Print</option>
                <option value="Reprint">Reprint (Damaged/Lost Label)</option>
                <option value="Replacement">Replacement</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Display Customization
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showName}
                  onChange={(e) => setShowName(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                Show Product Name
              </label>
              {labelType === "PRODUCT" && (
                <>
                  <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCode}
                      onChange={(e) => setShowCode(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    Show Product Code
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    Show Price (Rp)
                  </label>
                </>
              )}
              {labelType === "BATCH" && (
                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showExpiry}
                    onChange={(e) => setShowExpiry(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  Show Expiration Date
                </label>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">
              Thermal Preview (50 x 30 mm)
            </span>
            <div className="w-[188px] h-[113px] bg-white border border-slate-300 shadow-lg rounded p-2 flex flex-col justify-between items-center text-black font-sans leading-none overflow-hidden select-none">
              {showName && (
                <div className="text-[10px] font-bold truncate w-full" title={productName}>
                  {productName}
                </div>
              )}
              
              {labelType === "PRODUCT" ? (
                <div className="space-y-0.5 w-full">
                  {showCode && <div className="text-[8px] text-gray-600">Code: {productCode}</div>}
                  {showPrice && price !== undefined && (
                    <div className="text-[9px] font-semibold text-gray-800">Rp {price.toLocaleString()}</div>
                  )}
                </div>
              ) : (
                <div className="space-y-0.5 w-full">
                  <div className="text-[8px] font-semibold text-gray-700">Batch: {batchNumber}</div>
                  {showExpiry && expiryDate && (
                    <div className="text-[7px] text-red-600 font-bold">EXP: {expiryDate}</div>
                  )}
                </div>
              )}
              
              <div className="w-full flex justify-center mt-1">
                <BarcodeLabel value={barcodeValue} height={30} width={1.2} displayValue={true} />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            Print Label
          </button>
        </div>
      </div>

      {/* Hidden print wrapper that will be formatted to exactly 50x30mm thermal label sheets during window.print() */}
      <div className="print-area-wrapper">
        {Array.from({ length: printQty }).map((_, idx) => (
          <div key={idx} className="thermal-label-sheet">
            {showName && <div className="label-text-name">{productName}</div>}
            
            {labelType === "PRODUCT" ? (
              <div className="label-text-sub">
                {showCode && <span>{productCode}</span>}
                {showCode && showPrice && <span> | </span>}
                {showPrice && price !== undefined && <span>Rp {price.toLocaleString()}</span>}
              </div>
            ) : (
              <div className="label-text-sub">
                <span>Batch: {batchNumber}</span>
                {showExpiry && expiryDate && <span> | EXP: {expiryDate}</span>}
              </div>
            )}

            <div className="label-barcode-svg">
              <BarcodeLabel value={barcodeValue} height={26} width={1.1} displayValue={true} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default BarcodePrintDialog;
