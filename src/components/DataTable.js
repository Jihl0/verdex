"use client";

import { useState } from "react";

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
}) {
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter data based on search term
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;

    return columns.some((column) => {
      const value = row[column.key];
      if (typeof value === "string" || typeof value === "number") {
        return value
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      }
      return false;
    });
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

  return (
    <div className={`overflow-x-auto ${className}`}>
      {searchable && (
        <div className="relative mb-4 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-icons-round text-gray-400">search</span>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
            >
              <span className="material-icons-round text-gray-400">close</span>
            </button>
          )}
        </div>
      )}

      {sortedData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "No matching results found" : emptyMessage}
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
