"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function DataTable({
  columns,
  data,
  onRowClick,
  className = "",
  rowClassName = "",
  headerClassName = "",
  cellClassName = "",
  sortable = false,
  defaultSort = null,
  emptyMessage = "No data available",
  searchable = true,
  filterable = true,
}) {
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleColumnFilterChange = (columnKey, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
  };

  const clearColumnFilter = (columnKey) => {
    const newFilters = { ...columnFilters };
    delete newFilters[columnKey];
    setColumnFilters(newFilters);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm("");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Filter data based on search term and column filters
  const filteredData = data.filter((row) => {
    if (searchTerm) {
      const matchesSearch = columns.some((column) => {
        const value = row[column.key];
        if (typeof value === "string" || typeof value === "number") {
          return value
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        }
        return false;
      });
      if (!matchesSearch) return false;
    }

    for (const [columnKey, filterValue] of Object.entries(columnFilters)) {
      if (!filterValue) continue;

      const column = columns.find((col) => col.key === columnKey);
      if (!column) continue;

      const cellValue = row[columnKey];
      if (cellValue === undefined || cellValue === null) return false;

      if (column.filterType === "select") {
        if (cellValue.toString() !== filterValue) return false;
      } else if (column.filterType === "date") {
        const cellDate = new Date(cellValue).toDateString();
        const filterDate = new Date(filterValue).toDateString();
        if (cellDate !== filterDate) return false;
      } else {
        if (
          !cellValue
            .toString()
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        ) {
          return false;
        }
      }
    }

    return true;
  });

  // Sort data if sortable
  const sortedData = [...filteredData];
  if (sortable && sortConfig) {
    sortedData.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  }

  const handleCellClick = (e, column, row) => {
    if (column.key !== "actions" && onRowClick) {
      onRowClick(row);
    }
  };

  // Generate unique values for select filters
  const getUniqueValues = (columnKey) => {
    const values = new Set();
    data.forEach((row) => {
      if (row[columnKey] !== undefined && row[columnKey] !== null) {
        values.add(row[columnKey].toString());
      }
    });
    return Array.from(values).sort();
  };

  // Get filterable columns
  const filterableColumns = columns.filter(
    (column) => column.filterable !== false && column.key !== "actions"
  );

  const exportToExcel = () => {
    // Fields to exclude from export
    const excludedFields = [
      "id",
      "createdAt",
      "actions",
      "balance",
      "logs",
      "status",
      "createdBy",
      "harvested",
    ];

    // Preferred column order (partial - just the beginning and end)
    const preferredOrder = [
      /date/i, // Any date fields first
      "Seed Batch Id", // Then seed batch
      "Crop", // Then crop
      "Variety", // Then variety
      /quantity/i, // Then any quantity fields
      // ... other fields will go here ...
      "Remarks", // Remarks always last
    ];

    // Get all available fields from the data
    const allFields = [
      ...new Set(sortedData.flatMap((row) => Object.keys(row))),
    ].filter((field) => !excludedFields.includes(field));

    // Prepare data for export
    const exportData = sortedData.map((row) => {
      const exportRow = {};

      // Format and organize all fields
      const formattedFields = {};

      // Process all fields first
      allFields.forEach((field) => {
        const header = field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        if (
          !excludedFields.some(
            (excluded) => excluded.toLowerCase() === header.toLowerCase()
          )
        ) {
          formattedFields[header] = row[field];
        }
      });

      // Add computed values from column renders
      columns.forEach((column) => {
        if (column.render && !excludedFields.includes(column.key)) {
          const header = column.title
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();

          if (
            !excludedFields.some(
              (excluded) => excluded.toLowerCase() === header.toLowerCase()
            )
          ) {
            formattedFields[header] = column.render(row);
          }
        }
      });

      // Now organize fields in preferred order
      const orderedFields = {};

      // 1. Add preferred fields in order
      preferredOrder.forEach((pref) => {
        Object.keys(formattedFields).forEach((header) => {
          if (
            (typeof pref === "string" && header === pref) ||
            (pref instanceof RegExp && pref.test(header))
          ) {
            orderedFields[header] = formattedFields[header];
            delete formattedFields[header];
          }
        });
      });

      // 2. Add remaining fields (except remarks)
      Object.keys(formattedFields)
        .filter((header) => header !== "Remarks")
        .forEach((header) => {
          orderedFields[header] = formattedFields[header];
          delete formattedFields[header];
        });

      // 3. Finally add remarks if it exists
      if (formattedFields["Remarks"]) {
        orderedFields["Remarks"] = formattedFields["Remarks"];
      }

      return orderedFields;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");

    // Generate file and download
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `DataExport-${date}.xlsx`);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      {/* Search and Filter Controls - Left aligned container */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3 m-1">
          {/* Search */}
          {searchable && (
            <div className="relative w-full md:w-100 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons-round text-gray-400">
                  search
                </span>
              </div>
              <input
                type="text"
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-transparent placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
                >
                  <span className="material-icons-round text-gray-400">
                    close
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Filter Controls */}
          <div className="flex items-center gap-3">
            {/* Filter Toggle Button */}
            {filterable && (
              <button
                onClick={toggleFilters}
                className={`flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                  Object.keys(columnFilters).length > 0
                    ? "bg-transparent border-green-300 text-green-700"
                    : "bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="material-icons-round mr-1 text-base">
                  filter_alt
                </span>
                Filters
                {Object.keys(columnFilters).length > 0 && (
                  <span className="ml-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {Object.keys(columnFilters).length}
                  </span>
                )}
              </button>
            )}

            {/* Clear All Button */}
            {(searchTerm || Object.keys(columnFilters).length > 0) && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-transparent hover:bg-gray-50"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Download XSLX Button - NEW */}
          <button
            onClick={exportToExcel}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-transparent hover:bg-gray-50"
            disabled={sortedData.length === 0}
          >
            <span className="material-icons-round mr-1 text-base">
              download
            </span>
            Download XLSX
          </button>
        </div>

        {/* Filter Panel - Hidden by default */}
        {showFilters && filterable && (
          <div className="bg-transparent p-4 rounded-md border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filterableColumns.map((column) => (
                <div key={`filter-${column.key}`} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {column.title}
                  </label>
                  {column.filterType === "select" ? (
                    <select
                      value={columnFilters[column.key] || ""}
                      onChange={(e) =>
                        handleColumnFilterChange(column.key, e.target.value)
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-transparent"
                    >
                      <option value="">All {column.title}</option>
                      {getUniqueValues(column.key).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  ) : column.filterType === "date" ? (
                    <input
                      type="date"
                      value={columnFilters[column.key] || ""}
                      onChange={(e) =>
                        handleColumnFilterChange(column.key, e.target.value)
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-transparent"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={`Filter ${column.title}...`}
                      value={columnFilters[column.key] || ""}
                      onChange={(e) =>
                        handleColumnFilterChange(column.key, e.target.value)
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-transparent"
                    />
                  )}
                  {columnFilters[column.key] && (
                    <button
                      onClick={() => clearColumnFilter(column.key)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Clear this filter
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {sortedData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || Object.keys(columnFilters).length > 0
            ? "No matching results found"
            : emptyMessage}
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={headerClassName}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable ? "cursor-pointer hover:bg-gray-50" : ""
                  } ${column.headerClassName || ""}`}
                  onClick={() => sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.title}
                    {sortable && sortConfig?.key === column.key && (
                      <span className="ml-1">
                        {sortConfig.direction === "ascending" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${rowClassName} ${
                  onRowClick ? "hover:bg-gray-50" : ""
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column.key}`}
                    className={`px-6 py-4 whitespace-nowrap ${cellClassName} ${
                      column.cellClassName || ""
                    }`}
                    onClick={(e) => handleCellClick(e, column, row)}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
