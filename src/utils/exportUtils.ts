export interface TExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Export data to Excel (.xlsx) with styled header, borders, auto column width, and zebra striping.
 * Uses dynamic import to keep initial bundle size light and prevent memory overflow during build.
 */
export const exportToExcel = async (options: TExportOptions) => {
  const { filename, title, subtitle, headers, rows } = options;

  // Dynamically import ExcelJS on demand
  const { default: ExcelJS } = await import("exceljs");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Warehouse Management System";
  workbook.created = new Date();

  const sheetName = title.replace(/[\\/*?:[\]]/g, "").slice(0, 31) || "Laporan";
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }]
  });

  // 1. Add Title Banner
  const titleRow = worksheet.addRow([title.toUpperCase()]);
  titleRow.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF1E293B" } };
  titleRow.height = 24;

  if (subtitle) {
    const subRow = worksheet.addRow([subtitle]);
    subRow.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF64748B" } };
    subRow.height = 18;
  }

  const timestampRow = worksheet.addRow([`Dicetak pada: ${new Date().toLocaleString("id-ID")}`]);
  timestampRow.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF94A3B8" } };
  timestampRow.height = 16;

  worksheet.addRow([]); // Blank spacer row

  // 2. Add Table Headers
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" } // Dark Slate
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0F172A" } },
      left: { style: "thin", color: { argb: "FF0F172A" } },
      bottom: { style: "medium", color: { argb: "FF0F172A" } },
      right: { style: "thin", color: { argb: "FF0F172A" } }
    };
  });

  // 3. Add Data Rows
  rows.forEach((rowData, rowIndex) => {
    const dataRow = worksheet.addRow(rowData);
    dataRow.height = 20;

    const isEven = rowIndex % 2 === 0;

    dataRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9.5, color: { argb: "FF334155" } };
      
      // Zebra background
      if (!isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" }
        };
      }

      // Thin gridline border
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };

      // Auto alignment based on content type
      const val = cell.value;
      if (typeof val === "number") {
        cell.alignment = { vertical: "middle", horizontal: "right" };
      } else if (
        typeof val === "string" &&
        (val.startsWith("INV") ||
          val.startsWith("SO") ||
          val.startsWith("PO") ||
          val.startsWith("ADJ") ||
          val.startsWith("BATCH") ||
          val.match(/^\d{2}\/\d{2}\/\d{4}/))
      ) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });
  });

  // 4. Calculate Auto Column Widths
  worksheet.columns.forEach((column, colIndex) => {
    let maxLength = headers[colIndex] ? String(headers[colIndex]).length : 10;
    
    rows.forEach((row) => {
      const val = row[colIndex];
      if (val !== null && val !== undefined) {
        const len = String(val).length;
        if (len > maxLength) {
          maxLength = len;
        }
      }
    });

    column.width = Math.min(Math.max(maxLength + 4, 12), 45);
  });

  // 5. Generate and Download Blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const exportFilename = filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  link.setAttribute("href", url);
  link.setAttribute("download", exportFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to CSV with UTF-8 BOM (\uFEFF) for maximum compatibility with MS Excel.
 */
export const exportToCSV = (options: TExportOptions) => {
  const { filename, headers, rows } = options;

  const BOM = "\uFEFF";
  const csvContent =
    BOM +
    [
      headers
        .map((h) => {
          const str = String(h || "").replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(","),
      ...rows.map((row) =>
        row
          .map((val) => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(",")
      )
    ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const exportFilename = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", exportFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to PDF with document header, auto landscape/portrait, styled table, and page footer.
 * Dynamically imports jsPDF and jspdf-autotable on demand.
 */
export const exportToPDF = async (options: TExportOptions) => {
  const { filename, title, subtitle, headers, rows } = options;

  // Dynamically import jsPDF and jspdf-autotable
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  // Determine orientation: if column count > 6, use landscape
  const orientation = headers.length > 6 ? "landscape" : "portrait";
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Document Title Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // #1E293B
  doc.text(title.toUpperCase(), 14, 15);

  let startY = 22;

  if (subtitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, startY);
    startY += 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleString("id-ID")}`, 14, startY);
  startY += 6;

  // Horizontal separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, startY, pageWidth - 14, startY);
  startY += 5;

  // Format table rows (convert null/undefined to empty string)
  const formattedRows = rows.map((row) =>
    row.map((cell) => (cell === null || cell === undefined ? "" : String(cell)))
  );

  autoTable(doc, {
    startY,
    head: [headers],
    body: formattedRows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59], // Dark slate
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
      valign: "middle",
      lineWidth: 0.2,
      lineColor: [15, 23, 42]
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [226, 232, 240]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Light zebra background
    },
    styles: {
      overflow: "linebreak",
      cellPadding: 2.5
    },
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      // Add Page Number Footer on every page
      const pageCount = (doc.internal as any).getNumberOfPages();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      
      const pageStr = `Halaman ${data.pageNumber} dari ${pageCount}`;
      const footerText = "Warehouse Management System • Dokumen Resmi Ops";

      doc.text(footerText, 14, pageHeight - 10);
      doc.text(pageStr, pageWidth - 14 - doc.getTextWidth(pageStr), pageHeight - 10);
    }
  });

  const exportFilename = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
  doc.save(exportFilename);
};

/**
 * Universal Legacy CSV Download function to ensure compatibility with existing code while offering styled exports.
 */
export const downloadExcelCSV = (filename: string, headers: string[], rows: any[][]) => {
  exportToExcel({
    filename,
    title: filename.replace(/\.(csv|xlsx)$/i, "").replace(/_/g, " "),
    headers,
    rows
  });
};
