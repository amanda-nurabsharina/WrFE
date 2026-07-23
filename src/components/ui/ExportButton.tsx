import * as React from "react";
import { Download, FileSpreadsheet, FileText, FileCode } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./DropdownMenu/DropdownMenu";
import { exportToExcel, exportToCSV, exportToPDF, TExportOptions } from "../../utils/exportUtils";

export interface TExportButtonProps {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  disabled?: boolean;
  buttonText?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const ExportButton: React.FC<TExportButtonProps> = ({
  filename,
  title,
  subtitle,
  headers,
  rows,
  disabled = false,
  buttonText = "Ekspor",
  className = "",
  size = "sm"
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportOptions: TExportOptions = {
    filename,
    title,
    subtitle,
    headers,
    rows
  };

  const handleExcelExport = async () => {
    try {
      setIsExporting(true);
      await exportToExcel(exportOptions);
    } catch (err) {
      console.error("Failed to export Excel:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCSVExport = () => {
    try {
      exportToCSV(exportOptions);
    } catch (err) {
      console.error("Failed to export CSV:", err);
    }
  };

  const handlePDFExport = () => {
    try {
      exportToPDF(exportOptions);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    }
  };

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1.5 text-xs gap-1.5"
      : size === "lg"
      ? "px-5 py-2.5 text-base gap-2.5"
      : "px-4 py-2 text-sm gap-2";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled || isExporting || rows.length === 0}
        className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 shadow-sm border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${className}`}
      >
        <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>{isExporting ? "Mengunduh..." : buttonText}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-50">
        <DropdownMenuLabel className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-1">
          Pilih Format File
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 my-1" />
        
        <DropdownMenuItem
          onClick={handleExcelExport}
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <div className="flex flex-col">
            <span className="font-bold">Excel (.xlsx)</span>
            <span className="text-[10px] text-zinc-400">Header & Styling Rapih</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleCSVExport}
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors"
        >
          <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="flex flex-col">
            <span className="font-bold">CSV (.csv)</span>
            <span className="text-[10px] text-zinc-400">Kompatibel Excel Lama</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handlePDFExport}
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer transition-colors"
        >
          <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <div className="flex flex-col">
            <span className="font-bold">PDF (.pdf)</span>
            <span className="text-[10px] text-zinc-400">Siap Cetak / Print</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
