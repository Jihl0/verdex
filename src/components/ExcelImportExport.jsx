"use client";

import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function ExcelImportExport({
  columns,
  fileName,
  onUpload,
  exampleData = null,
  disabled = false,
  dropdowns = {},
}) {
  const generateTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Filter out columns to exclude (like seedBatchId, status, and outQuantity)
    const filteredColumns = columns.filter(
      (col) => !["seedBatchId", "status", "outQuantity"].includes(col.key)
    );

    // Prepare header row
    const headerRow = filteredColumns.map((col) => col.header || col.key);

    // Prepare data rows (header + example if provided)
    const wsData = [headerRow];
    if (exampleData) {
      const exampleRow = filteredColumns.map((col) => {
        if (col.key in exampleData) {
          // For inQuantity, we'll show the example value but remove outQuantity
          if (col.key === "inQuantity") {
            return (
              exampleData.inQuantity ||
              exampleData.outQuantity ||
              col.example ||
              ""
            );
          }
          return exampleData[col.key];
        }
        return col.example || "";
      });
      wsData.push(exampleRow);
    } else {
      // Add empty row if no example provided
      wsData.push(filteredColumns.map(() => ""));
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Add dropdown validation
    if (dropdowns) {
      const range = XLSX.utils.decode_range(ws["!ref"]);

      // Add dropdown for each specified column
      Object.entries(dropdowns).forEach(([key, values]) => {
        const colIndex = filteredColumns.findIndex((col) => col.key === key);
        if (colIndex >= 0) {
          const colLetter = XLSX.utils.encode_col(colIndex);

          // Create validation object
          ws["!dataValidation"] = ws["!dataValidation"] || [];
          ws["!dataValidation"].push({
            ref: `${colLetter}2:${colLetter}${range.e.r + 1}`,
            t: "list",
            allowBlank: true,
            showInputMessage: true,
            prompt: `Please select from dropdown`,
            formulae: [`"${values.join(",")}"`],
          });
        }
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, "Template");

    // Generate Excel file
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, `${fileName}_Template.xlsx`);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Process data and call the upload handler
        await onUpload(jsonData);

        // Reset file input
        e.target.value = "";
      } catch (error) {
        console.error("Error processing file:", error);
        alert(`Failed to import records: ${error.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex space-x-4">
      <button
        onClick={generateTemplate}
        disabled={disabled}
        className={`flex items-center px-4 py-2 rounded-lg ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        <span className="material-icons-round mr-2">download</span>
        Download Template
      </button>

      <label
        className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        }`}
      >
        <span className="material-icons-round mr-2">upload</span>
        Upload Records
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
          disabled={disabled}
        />
      </label>
    </div>
  );
}
