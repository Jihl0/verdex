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
}) {
  const [sortConfig, setSortConfig] = useState(defaultSort);

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

  const sortedData = [...data];
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
    // Only trigger row click if not clicking an action button
    if (column.key !== "actions" && onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
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
