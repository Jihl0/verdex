import React, { useRef, useState, useEffect } from "react";
import { fetchHarvestByBatchId } from "@/lib/db";

const DetailItem = ({ label, value }) => (
  <div className="mb-4">
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-normal text-gray-800 bg-gray-100 px-3 py-2 rounded-md">
      {value || "-"}
    </p>
  </div>
);

const DistributionDetailModal = ({ record, onClose }) => {
  const modalRef = useRef(null);
  const [harvestDetails, setHarvestDetails] = useState(null);
  const [loadingHarvest, setLoadingHarvest] = useState(false);

  useEffect(() => {
    const fetchHarvestDetails = async () => {
      if (!record?.seedBatchId) return;

      setLoadingHarvest(true);
      try {
        const harvest = await fetchHarvestByBatchId(record.seedBatchId);
        setHarvestDetails(harvest);
      } catch (error) {
        console.error("Error fetching harvest details:", error);
      } finally {
        setLoadingHarvest(false);
      }
    };

    fetchHarvestDetails();

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [record, onClose]);

  if (!record) return null;

  return (
    <div className="fixed inset-0 bg-gray bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Distribution Record Details
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Distribution Details Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-2 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Distribution Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <DetailItem label="Distribution ID" value={record.id} />
                <DetailItem
                  label="Date"
                  value={
                    record.date
                      ? new Date(record.date).toLocaleDateString()
                      : "-"
                  }
                />
                <DetailItem label="Quantity" value={`${record.quantity} kg`} />
              </div>
              <div>
                <DetailItem label="Purpose" value={record.purpose} />
                <DetailItem
                  label="Affiliation/Office"
                  value={record.affiliation}
                />
                <DetailItem label="Recipient" value={record.recipientName} />
                <DetailItem
                  label="Contact"
                  value={record.contactNumber || "-"}
                />
              </div>
            </div>

            {record.remarks && (
              <div className="mt-6">
                <DetailItem label="Remarks" value={record.remarks} />
              </div>
            )}
          </div>

          {/* Seed Batch Details Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-2 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Seed Batch Information
              </h3>
            </div>

            {loadingHarvest ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : harvestDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DetailItem
                    label="Batch ID"
                    value={harvestDetails.seedBatchId}
                  />
                  <DetailItem label="Crop" value={harvestDetails.crop} />
                  <DetailItem label="Variety" value={harvestDetails.variety} />
                </div>
                <div>
                  <DetailItem
                    label="Harvest Date"
                    value={
                      harvestDetails.dateHarvested instanceof Date
                        ? harvestDetails.dateHarvested.toLocaleDateString()
                        : "-"
                    }
                  />
                  <DetailItem
                    label="Classification"
                    value={harvestDetails.classification}
                  />
                  <DetailItem
                    label="Germination"
                    value={`${harvestDetails.germination}%`}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No seed batch found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Could not retrieve seed batch details
                </p>
              </div>
            )}

            {harvestDetails && (
              <div className="mt-6 grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Original Quantity
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {harvestDetails.inQuantity} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Current Balance
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      harvestDetails.balance > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {harvestDetails.balance} kg
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {/* <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default DistributionDetailModal;
