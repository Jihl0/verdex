"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import DataTable from "@/components/DataTable";
import {
  addSeedDistribution,
  getSeedDistributions,
  updateSeedDistribution,
  deleteSeedDistribution,
  getSeedHarvests,
  updateSeedHarvest,
} from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/utils/AuthGuard";
import DistributionDetailModal from "@/components/DistributionDetailModal";
import ExcelImportExport from "@/components/ExcelImportExport";
import { v4 as uuidv4 } from "uuid";

export default function SeedDistribution() {
  const { currentUser } = useAuth();
  const [distributions, setDistributions] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("exportation"); // 'exportation' or 'breeding'
  const [formData, setFormData] = useState({
    date: "",
    seedBatchId: "",
    quantity: 0,
    purpose: "",
    affiliation: "",
    recipientName: "",
    contactNumber: "",
    remarks: "",
    requestedBy: "",
    area: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [distributionsData, harvestsData] = await Promise.all([
          getSeedDistributions(),
          getSeedHarvests(),
        ]);

        setDistributions(distributionsData);
        setHarvests(harvestsData.filter((h) => (h.balance || 0) > 0));
      } catch (error) {
        console.error("Error loading data:", error);
        setError(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadData();
    } else {
      setError("Please sign in to view data");
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for contact number
    if (name === "contactNumber") {
      // Only allow numbers and limit to 11 characters
      if (/^\d*$/.test(value) && value.length <= 11) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleModeToggle = () => {
    setFormMode(formMode === "exportation" ? "breeding" : "exportation");
    // Reset form when switching modes
    setFormData({
      date: "",
      seedBatchId: "",
      quantity: 0,
      purpose: "",
      affiliation: "",
      recipientName: "",
      contactNumber: "",
      remarks: "",
      requestedBy: "",
      area: "",
    });
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setFormMode(record.mode || "exportation"); // Default to exportation if mode not set
    setFormData({
      ...record,
      date: record.date?.toISOString().split("T")[0] || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this distribution record?")) {
      try {
        await deleteSeedDistribution(id);
        const distributionsData = await getSeedDistributions();
        setDistributions(distributionsData);
        alert("Record deleted successfully");
      } catch (error) {
        console.error("Error deleting record:", error);
        alert("Failed to delete record");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      // Validate required fields based on mode
      let requiredFields = [];
      if (formMode === "exportation") {
        requiredFields = [
          "date",
          "seedBatchId",
          "quantity",
          "purpose",
          "affiliation",
          "recipientName",
        ];

        // Add contact number validation only for exportation mode
        if (formData.contactNumber && formData.contactNumber.length > 0) {
          if (
            !formData.contactNumber.startsWith("09") ||
            formData.contactNumber.length !== 11
          ) {
            throw new Error(
              "Contact number must start with 09 and be exactly 11 digits"
            );
          }
        }
      } else {
        requiredFields = [
          "date",
          "seedBatchId",
          "quantity",
          "purpose",
          "requestedBy",
          "area",
        ];
      }

      const missingFields = requiredFields.filter((field) => !formData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      const quantity = parseFloat(formData.quantity);
      if (isNaN(quantity)) {
        throw new Error("Quantity must be a number");
      }
      if (quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      // Prepare distribution data with defaults
      const distributionData = {
        date: formData.date,
        seedBatchId: formData.seedBatchId,
        quantity: quantity,
        purpose: formData.purpose,
        mode: formMode, // Store the mode with the record
        createdBy: currentUser.uid,
      };

      // Add mode-specific fields
      if (formMode === "exportation") {
        distributionData.affiliation = formData.affiliation;
        distributionData.recipientName = formData.recipientName;
        distributionData.contactNumber = formData.contactNumber || "";
        distributionData.remarks = formData.remarks || "";
      } else {
        distributionData.requestedBy = formData.requestedBy;
        distributionData.area = formData.area;
        distributionData.remarks = formData.remarks || "";
      }

      await addSeedDistribution(distributionData);

      // Refresh data
      const [updatedDistributions, updatedHarvests] = await Promise.all([
        getSeedDistributions(),
        getSeedHarvests(),
      ]);

      setDistributions(updatedDistributions);
      setHarvests(updatedHarvests.filter((h) => (h.balance || 0) > 0));
      setShowForm(false);
      setFormData({
        date: "",
        seedBatchId: "",
        quantity: 0,
        purpose: "",
        affiliation: "",
        recipientName: "",
        contactNumber: "",
        remarks: "",
        requestedBy: "",
        area: "",
      });
    } catch (error) {
      console.error("Distribution error:", error);
      setError(error.message);
    }
  };

  // Template columns for Excel export based on mode
  const exportationTemplateColumns = [
    { key: "date", header: "Date", example: "2023-10-15" },
    {
      key: "seedBatchId",
      header: "Seed Batch ID",
      example: "2023-09-SB-TIWALA_6",
    },
    { key: "quantity", header: "Quantity (kg)", example: "50" },
    { key: "purpose", header: "Purpose", example: "Planting" },
    {
      key: "affiliation",
      header: "Affiliation/Office",
      example: "DA Region 5",
    },
    {
      key: "recipientName",
      header: "Recipient Name",
      example: "Juan Dela Cruz",
    },
    { key: "contactNumber", header: "Contact Number", example: "09123456789" },
    { key: "remarks", header: "Remarks", example: "For demo farm" },
  ];

  const breedingTemplateColumns = [
    { key: "date", header: "Date", example: "2023-10-15" },
    {
      key: "seedBatchId",
      header: "Seed Batch ID",
      example: "2023-09-SB-TIWALA_6",
    },
    { key: "quantity", header: "Quantity (kg)", example: "5" },
    { key: "purpose", header: "Purpose", example: "Breeding" },
    { key: "requestedBy", header: "Requested By", example: "Dr. Smith" },
    { key: "area", header: "Area", example: "Breeding Plot A" },
    { key: "remarks", header: "Remarks", example: "For crossing experiment" },
  ];

  const distributionDropdowns = {
    purpose: [
      "Research",
      "Planting",
      "Demonstration",
      "Seed Production",
      "Other",
      "Breeding",
    ],
  };

  const handleDistributionUpload = async (jsonData) => {
    // Skip header row and process each row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      // Determine mode based on columns present
      const isBreeding = row.length <= 7; // Breeding has fewer columns

      // Map row data to fields
      let distributionData = {
        createdBy: currentUser.uid,
        createdAt: new Date(),
      };

      if (isBreeding) {
        const [
          date,
          seedBatchId,
          quantity,
          purpose,
          requestedBy,
          area,
          remarks,
        ] = row;

        // Validate required fields
        if (
          !date ||
          !seedBatchId ||
          !quantity ||
          !purpose ||
          !requestedBy ||
          !area
        ) {
          console.warn(`Skipping row ${i} due to missing required fields`);
          continue;
        }

        // Parse quantity
        const parsedQuantity = parseFloat(quantity) || 0;
        if (parsedQuantity <= 0) {
          console.warn(`Skipping row ${i} - quantity must be positive`);
          continue;
        }

        // Function to parse dates from Excel or string input
        const parseDate = (dateValue) => {
          if (!dateValue) return null;

          // If it's an Excel serial date number
          if (typeof dateValue === "number") {
            const excelEpoch = new Date("1899-12-30");
            const date = new Date(
              excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000
            );
            return date;
          }

          // If it's already a Date object
          if (dateValue instanceof Date) {
            return dateValue;
          }

          // Try parsing as YYYY-MM-DD
          if (typeof dateValue === "string" && dateValue.includes("-")) {
            return new Date(dateValue);
          }

          return null;
        };

        const parsedDate = parseDate(date);

        distributionData = {
          ...distributionData,
          date: parsedDate || new Date(),
          seedBatchId,
          quantity: parsedQuantity,
          purpose,
          requestedBy,
          area,
          remarks: remarks || "",
          mode: "breeding",
        };
      } else {
        // Exportation mode
        const [
          date,
          seedBatchId,
          quantity,
          purpose,
          affiliation,
          recipientName,
          contactNumber,
          remarks,
        ] = row;

        // Validate required fields
        if (
          !date ||
          !seedBatchId ||
          !quantity ||
          !purpose ||
          !affiliation ||
          !recipientName
        ) {
          console.warn(`Skipping row ${i} due to missing required fields`);
          continue;
        }

        // Parse quantity
        const parsedQuantity = parseFloat(quantity) || 0;
        if (parsedQuantity <= 0) {
          console.warn(`Skipping row ${i} - quantity must be positive`);
          continue;
        }

        // Function to parse dates from Excel or string input
        const parseDate = (dateValue) => {
          if (!dateValue) return null;

          // If it's an Excel serial date number
          if (typeof dateValue === "number") {
            const excelEpoch = new Date("1899-12-30");
            const date = new Date(
              excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000
            );
            return date;
          }

          // If it's already a Date object
          if (dateValue instanceof Date) {
            return dateValue;
          }

          // Try parsing as YYYY-MM-DD
          if (typeof dateValue === "string" && dateValue.includes("-")) {
            return new Date(dateValue);
          }

          return null;
        };

        const parsedDate = parseDate(date);

        distributionData = {
          ...distributionData,
          date: parsedDate || new Date(),
          seedBatchId,
          quantity: parsedQuantity,
          purpose,
          affiliation,
          recipientName,
          contactNumber: contactNumber || "",
          remarks: remarks || "",
          mode: "exportation",
        };
      }

      try {
        await addSeedDistribution(distributionData);
      } catch (error) {
        console.error(`Error saving row ${i}:`, error);
      }
    }

    // Refresh data
    const [updatedDistributions, updatedHarvests] = await Promise.all([
      getSeedDistributions(),
      getSeedHarvests(),
    ]);

    setDistributions(updatedDistributions);
    setHarvests(updatedHarvests.filter((h) => (h.balance || 0) > 0));

    // Close the form popup after successful upload
    setShowForm(false);
    alert("Distribution records imported successfully!");
  };

  const columns = [
    {
      key: "createdAt",
      title: "Date Created",
      render: (row) =>
        row.createdAt instanceof Date
          ? row.createdAt.toLocaleDateString()
          : "-",
    },
    {
      key: "date",
      title: "Date",
      render: (row) =>
        row.date ? new Date(row.date).toLocaleDateString() : "-",
      headerClassName: "font-semibold",
    },
    {
      key: "seedBatchId",
      title: "Batch ID",
    },
    {
      key: "mode",
      title: "Type",
      render: (row) => (
        <span className="capitalize">{row.mode || "exportation"}</span>
      ),
    },
    {
      key: "recipientName",
      title: "Recipient/Requester",
      render: (row) => row.recipientName || row.requestedBy || "-",
    },
    // {
    //   key: "affiliation",
    //   title: "Affiliation/Area",
    //   render: (row) => row.affiliation || row.area || "-",
    // },
    {
      key: "quantity",
      title: "Quantity (kg)",
      render: (row) => row.quantity?.toFixed(2) || "0",
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
            title="Edit"
          >
            <span className="material-icons-round">edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
            title="Delete"
          >
            <span className="material-icons-round">delete</span>
          </button>
        </div>
      ),
      cellClassName: "text-right",
    },
  ];

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar onToggle={handleSidebarToggle} />
        <div
          className={`flex-1 ${
            sidebarCollapsed ? "ml-20" : "ml-64"
          } flex items-center justify-center`}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-100 text-gray-800">
        <Sidebar onToggle={handleSidebarToggle} />

        <div
          className={`flex-1 overflow-y-auto ${
            sidebarCollapsed ? "ml-20" : "ml-64"
          } p-8`}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Seed Distribution Records
            </h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <span className="material-icons-round mr-2">
                {showForm ? "close" : "add"}
              </span>
              {showForm ? "Cancel" : "Add New Record"}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingId
                    ? "Edit Distribution Record"
                    : "Add New Distribution Record"}
                </h2>
                <div className="flex items-center">
                  <span className="mr-2 text-sm font-medium text-gray-700">
                    {formMode === "exportation" ? "Exportation" : "Breeding"}
                  </span>
                  <button
                    type="button"
                    onClick={handleModeToggle}
                    className="relative inline-flex items-center h-6 rounded-full w-11 bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <span
                      className={`${
                        formMode === "exportation"
                          ? "translate-x-1 bg-blue-600"
                          : "translate-x-6 bg-green-600"
                      } inline-block w-4 h-4 transform transition-transform rounded-full`}
                    />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Date - Common to both modes */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Seed Batch ID - Common to both modes */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seed Batch ID *
                    </label>
                    {harvests.length > 0 ? (
                      <select
                        name="seedBatchId"
                        value={formData.seedBatchId}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select Batch ID</option>
                        {harvests.map((harvest) => (
                          <option key={harvest.id} value={harvest.seedBatchId}>
                            {harvest.seedBatchId} ({harvest.crop} -{" "}
                            {harvest.variety}) - {harvest.balance} kg available
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-red-500 text-sm">
                        No available seed batches with positive balance found.
                      </div>
                    )}
                  </div>

                  {/* Quantity - Common to both modes */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Purpose - Common to both modes */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose *
                    </label>
                    <select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Purpose</option>
                      <option value="Research">Research</option>
                      <option value="Planting">Planting</option>
                      <option value="Demonstration">Demonstration</option>
                      <option value="Seed Production">Seed Production</option>
                      <option value="Breeding">Breeding</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Mode-specific fields */}
                  {formMode === "exportation" ? (
                    <>
                      {/* Affiliation/Office - Exportation only */}
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Affiliation/Office *
                        </label>
                        <input
                          type="text"
                          name="affiliation"
                          value={formData.affiliation}
                          onChange={handleChange}
                          required={formMode === "exportation"}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      {/* Recipient Name - Exportation only */}
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recipient Name *
                        </label>
                        <input
                          type="text"
                          name="recipientName"
                          value={formData.recipientName}
                          onChange={handleChange}
                          required={formMode === "exportation"}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      {/* Contact Number - Exportation only */}
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Number
                        </label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="09XXXXXXXXX"
                          maxLength={11}
                        />
                        {formData.contactNumber && (
                          <p className="text-xs mt-1 text-gray-500">
                            {!formData.contactNumber.startsWith("09") &&
                              "Must start with 09"}
                            {formData.contactNumber.length !== 11 &&
                              " - Must be 11 digits"}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Requested By - Breeding only */}
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Requested By *
                        </label>
                        <input
                          type="text"
                          name="requestedBy"
                          value={formData.requestedBy}
                          onChange={handleChange}
                          required={formMode === "breeding"}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      {/* Area - Breeding only */}
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Area *
                        </label>
                        <input
                          type="text"
                          name="area"
                          value={formData.area}
                          onChange={handleChange}
                          required={formMode === "breeding"}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Remarks - Common to both modes */}
                <div className="form-group col-span-1 md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <div className="flex gap-10">
                    <ExcelImportExport
                      columns={
                        formMode === "exportation"
                          ? exportationTemplateColumns
                          : breedingTemplateColumns
                      }
                      fileName={`Seed_Distribution_${formMode}`}
                      onUpload={handleDistributionUpload}
                      dropdowns={distributionDropdowns}
                      disabled={!currentUser}
                    />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                    >
                      {editingId ? "Update Record" : "Save Record"}
                    </button>
                  </div>

                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setShowForm(false);
                        setFormData({
                          date: "",
                          seedBatchId: "",
                          quantity: 0,
                          purpose: "",
                          affiliation: "",
                          recipientName: "",
                          contactNumber: "",
                          remarks: "",
                          requestedBy: "",
                          area: "",
                        });
                      }}
                      className="ml-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Distribution Records Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <DataTable
              columns={columns}
              data={distributions}
              sortable={true}
              defaultSort={{ key: "createdAt", direction: "descending" }}
              emptyMessage="No distribution records found"
              rowClassName="hover:bg-gray-50 cursor-pointer"
              headerClassName="bg-gray-50"
              onRowClick={(row) => {
                setSelectedRecord(row);
                setShowDetailModal(true);
              }}
            />
          </div>
        </div>
        {showDetailModal && (
          <DistributionDetailModal
            record={selectedRecord}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
