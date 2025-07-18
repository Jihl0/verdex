import React, { useRef, useState, useEffect } from "react";

const DetailItem = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-800 mt-1">{value || "-"}</p>
  </div>
);

const DistributionTypeBadge = ({ type }) => {
  const typeStyles = {
    breeding: "bg-purple-100 text-purple-800",
    exportation: "bg-blue-100 text-blue-800",
    default: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
        typeStyles[type] || typeStyles.default
      }`}
    >
      {type}
    </span>
  );
};

const DetailModal = ({ record, onClose }) => {
  const modalRef = useRef(null);
  const [showLogs, setShowLogs] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!record) return null;

  const renderDistributionDetails = (log) => {
    const distributionType = log.mode || "exportation";

    return (
      <div className="space-y-1">
        <p className="font-medium">{log.note || "Distribution record"}</p>

        {log.purpose && (
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Purpose:</span> {log.purpose}
          </p>
        )}

        {distributionType === "exportation" ? (
          <>
            {log.recipientName && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Recipient:</span>{" "}
                {log.recipientName}
              </p>
            )}
            {log.affiliation && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Affiliation:</span>{" "}
                {log.affiliation}
              </p>
            )}
            {log.contactNumber && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Contact:</span>{" "}
                {log.contactNumber}
              </p>
            )}
          </>
        ) : (
          <>
            {log.requestedBy && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Requested by:</span>{" "}
                {log.requestedBy}
              </p>
            )}
            {log.area && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Area:</span> {log.area}
              </p>
            )}
          </>
        )}

        {log.distributionId && (
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-semibold">ID:</span> {log.distributionId}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {record.seedBatchId} - Detailed Record
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-gray-700">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Batch ID" value={record.seedBatchId} />
              <DetailItem label="Status" value={record.status} />
              <DetailItem label="Crop" value={record.crop} />
              <DetailItem label="Variety" value={record.variety} />
              <DetailItem
                label="Classification"
                value={record.classification}
              />
            </div>
          </div>

          {/* Date Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-gray-700">
              Date Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem
                label="Date Planted"
                value={
                  record.datePlanted instanceof Date
                    ? record.datePlanted.toLocaleDateString()
                    : record.datePlanted?.toDate
                    ? record.datePlanted.toDate().toLocaleDateString()
                    : "-"
                }
              />
              <DetailItem
                label="Date Harvested"
                value={
                  record.dateHarvested instanceof Date
                    ? record.dateHarvested.toLocaleDateString()
                    : record.dateHarvested?.toDate
                    ? record.dateHarvested.toDate().toLocaleDateString()
                    : "-"
                }
              />
              <DetailItem
                label="Record Created"
                value={
                  record.createdAt instanceof Date
                    ? record.createdAt.toLocaleDateString()
                    : record.createdAt?.toDate
                    ? record.createdAt.toDate().toLocaleDateString()
                    : "-"
                }
              />
            </div>
          </div>

          {/* Quantity Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-gray-700">
              Quantity Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailItem
                label="Planted (kg)"
                value={record.inQuantity?.toFixed(2)}
              />
              <DetailItem
                label="Harvested (kg)"
                value={record.outQuantity?.toFixed(2)}
              />
              <DetailItem
                label="Balance (kg)"
                value={record.balance?.toFixed(2)}
              />
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-gray-700">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <DetailItem label="Area" value={record.area} />
              <DetailItem label="Total Lot Area" value={record.totalLotArea} />
              <DetailItem
                label="Germination Rate"
                value={record.germination ? `${record.germination}%` : "-"}
              />
              <DetailItem label="Remarks" value={record.remarks} />
            </div>
          </div>

          {/* Distribution History Section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-800">
                Distribution History
              </h3>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 px-3 py-1 rounded-md hover:bg-green-50 transition-colors"
              >
                {showLogs ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Hide History
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Show History
                  </>
                )}
              </button>
            </div>

            {showLogs && (
              <div className="space-y-3">
                {record.logs?.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {record.logs
                          .sort((a, b) => {
                            const dateA = a.date?.toDate
                              ? a.date.toDate()
                              : new Date(a.date);
                            const dateB = b.date?.toDate
                              ? b.date.toDate()
                              : new Date(b.date);
                            return dateB - dateA;
                          })
                          .map((log, index) => {
                            const logDate = log.date?.toDate
                              ? log.date.toDate()
                              : new Date(log.date);
                            const isDistribution = log.quantity < 0;

                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {logDate.toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {logDate.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <DistributionTypeBadge
                                    type={log.mode || "exportation"}
                                  />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      isDistribution
                                        ? "bg-red-100 text-red-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {isDistribution ? "⬇ " : "⬆ "}
                                    {Math.abs(log.quantity).toFixed(2)} kg
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {renderDistributionDetails(log)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No distribution history
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new distribution record.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
