import React from "react";

const DetailItem = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-800 mt-1">{value || "-"}</p>
  </div>
);

const DetailModal = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 bg-gray bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Harvest Record Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
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

        {/* Main Content */}
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
                    : "-"
                }
              />
              <DetailItem
                label="Date Harvested"
                value={
                  record.dateHarvested instanceof Date
                    ? record.dateHarvested.toLocaleDateString()
                    : "-"
                }
              />
              <DetailItem
                label="Record Created"
                value={
                  record.createdAt instanceof Date
                    ? record.createdAt.toLocaleDateString()
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
              <DetailItem label="Planted (kg)" value={record.inQuantity} />
              <DetailItem label="Harvested (kg)" value={record.outQuantity} />
              <DetailItem label="Balance (kg)" value={record.balance} />
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
              <DetailItem label="Germination Rate" value={record.germination} />
              <DetailItem label="Remarks" value={record.remarks} />
            </div>
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
