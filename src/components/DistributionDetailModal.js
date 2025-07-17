"use client";

import React, { useRef, useState, useEffect } from "react";
import { fetchHarvestByBatchId } from "@/lib/db";

const DetailItem = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-800 mt-1">{value || "-"}</p>
  </div>
);

const DistributionDetailModal = ({ record, onClose }) => {
  const [harvestDetails, setHarvestDetails] = useState(null);
  const [loadingHarvest, setLoadingHarvest] = useState(true);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchHarvestDetails = async () => {
      try {
        // You'll need to import getSeedHarvests or create a specific function to fetch by seedBatchId
        const response = await fetchHarvestByBatchId(record.seedBatchId);
        setHarvestDetails(response);
      } catch (error) {
        console.error("Error fetching harvest details:", error);
      } finally {
        setLoadingHarvest(false);
      }
    };

    if (record?.seedBatchId) {
      fetchHarvestDetails();
    }

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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Distribution Record Details
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
        <div className="space-y-6 flex flex-col">
          {/* Distribution and Seed Batch Information */}
          <div className="flex flex-col gap-6">
            {/* Distribution Details */}
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col">
              <h3 className="font-semibold text-lg mb-4 text-gray-700">
                Distribution Information
              </h3>
              <div className="space-y-3">
                <DetailItem label="Distribution ID" value={record.id} />
                <DetailItem
                  label="Date"
                  value={
                    record.date
                      ? new Date(record.date).toLocaleDateString()
                      : "-"
                  }
                />
                <DetailItem label="Quantity (kg)" value={record.quantity} />
                <DetailItem label="Purpose" value={record.purpose} />
                <DetailItem
                  label="Affiliation/Office"
                  value={record.affiliation}
                />
                <DetailItem
                  label="Recipient Name"
                  value={record.recipientName}
                />
                <DetailItem
                  label="Contact Number"
                  value={record.contactNumber}
                />
                <DetailItem label="Remarks" value={record.remarks} />
              </div>
            </div>

            {/* Seed Batch Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 text-gray-700">
                Seed Batch Information
              </h3>
              {loadingHarvest ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : harvestDetails ? (
                <div className="space-y-3">
                  <DetailItem
                    label="Batch ID"
                    value={harvestDetails.seedBatchId}
                  />
                  <DetailItem label="Crop" value={harvestDetails.crop} />
                  <DetailItem label="Variety" value={harvestDetails.variety} />
                  <DetailItem
                    label="Date Harvested"
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
                    label="Germination Rate"
                    value={`${harvestDetails.germination}%`}
                  />
                  <DetailItem
                    label="Original Quantity"
                    value={`${harvestDetails.inQuantity} kg`}
                  />
                  <DetailItem
                    label="Current Balance"
                    value={`${harvestDetails.balance} kg`}
                  />
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-2">
                  No seed batch information available
                </p>
              )}
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

export default DistributionDetailModal;
