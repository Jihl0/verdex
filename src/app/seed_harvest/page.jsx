"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import DataTable from "@/components/DataTable";
import DetailModal from "@/components/DetailModal";
import {
  addSeedHarvest,
  getSeedHarvests,
  updateSeedHarvest,
  deleteSeedHarvest,
  getRecentHarvests,
} from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { CROP_VARIETIES } from "@/constants/variety";
import { CLASSIFICATIONS } from "@/constants/classifications";
import ExcelImportExport from "@/components/ExcelImportExport";
import AuthGuard from "@/utils/AuthGuard";

export default function SeedHarvest() {
  const { currentUser } = useAuth();
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    status: "Active",
    datePlanted: "",
    crop: "Soybean",
    variety: "Tiwala 6",
    classification: "",
    dateHarvested: "",
    area: "",
    totalLotArea: "",
    germination: "",
    inQuantity: 0,
    outQuantity: 0,
    balance: 0,
    remarks: "",
    logs: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [varieties, setVarieties] = useState(CROP_VARIETIES.Soybean);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHarvests = async () => {
      try {
        const harvestsData = await getSeedHarvests();
        setHarvests(harvestsData);
      } catch (error) {
        console.error("Error loading harvests:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHarvests();
  }, []);

  const getCropAbbreviation = (crop) => {
    const abbreviations = {
      Soybean: "SB",
      Mungbean: "MB",
      Peanut: "PN",
    };
    return abbreviations[crop] || crop.slice(0, 2).toUpperCase();
  };

  const formatVarietyId = (variety) => {
    return variety.replace(/\s+/g, "_").toUpperCase();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      // Calculate the new state first
      const newState = {
        ...prev,
        [name]: value,
      };

      // Update variety if crop changes
      if (name === "crop") {
        newState.variety = CROP_VARIETIES[value][0];
        setVarieties(CROP_VARIETIES[value]);
      }

      // Handle integer conversion for quantities
      if (name === "inQuantity") {
        const inQty = parseInt(value) || 0;
        newState.inQuantity = inQty;
        newState.balance = inQty; // Balance now equals inQuantity
      }

      // Generate seedBatchId (without variety abbreviation)
      if (newState.dateHarvested && newState.crop) {
        const year = new Date(newState.dateHarvested).getFullYear();
        const month = String(
          new Date(newState.dateHarvested).getMonth() + 1
        ).padStart(2, "0");
        const cropAbbr = getCropAbbreviation(newState.crop);
        const varAbbr = formatVarietyId(newState.variety);
        newState.seedBatchId = `${year}-${month}-${cropAbbr}-${varAbbr}`;
      }

      return newState;
    });
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      ...record,
      // Convert dates back to input format
      datePlanted: record.datePlanted?.toISOString().split("T")[0] || "",
      dateHarvested: record.dateHarvested?.toISOString().split("T")[0] || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteSeedHarvest(id);
        const harvestsData = await getSeedHarvests();
        setHarvests(harvestsData);
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
      console.log("Form data before submission:", formData);
      setError(null);

      // Validate required fields
      const requiredFields = [
        "dateHarvested",
        "crop",
        "variety",
        "classification",
        "area",
        "totalLotArea",
        "germination",
        "datePlanted",
        "inQuantity",
      ];

      const missingFields = requiredFields.filter((field) => !formData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Generate seedBatchId if not already set
      if (!formData.seedBatchId) {
        const year = new Date(formData.dateHarvested).getFullYear();
        const month = String(
          new Date(formData.dateHarvested).getMonth() + 1
        ).padStart(2, "0");
        const cropAbbr = getCropAbbreviation(formData.crop);
        const varAbbr = formatVarietyId(formData.variety);
        formData.seedBatchId = `${year}-${month}-${cropAbbr}-${varAbbr}`;
      }

      // Prepare the data to save
      const harvestData = {
        ...formData,
        datePlanted: formData.datePlanted
          ? new Date(formData.datePlanted)
          : null,
        dateHarvested: new Date(formData.dateHarvested),
        inQuantity: parseFloat(formData.inQuantity) || 0,
        outQuantity: parseFloat(formData.outQuantity) || 0,
        balance: parseFloat(formData.inQuantity) || 0, // Balance starts equal to inQuantity
        createdBy: currentUser.uid,
        createdAt: new Date(),
      };

      if (editingId) {
        // Update existing record
        await updateSeedHarvest(editingId, harvestData);
      } else {
        // Add new record
        await addSeedHarvest(harvestData);
      }

      // Refresh data
      const harvestsData = await getSeedHarvests();
      setHarvests(harvestsData);

      // Reset form
      setShowForm(false);
      setEditingId(null);
      setFormData({
        status: "Active",
        datePlanted: "",
        crop: "Soybean",
        variety: "Tiwala 6",
        classification: "",
        dateHarvested: "",
        area: "",
        totalLotArea: "",
        germination: "",
        inQuantity: 0,
        outQuantity: 0,
        balance: 0,
        remarks: "",
        logs: [],
      });
    } catch (error) {
      console.error("Error saving record:", error);
      setError(error.message);
    }
  };

  // Helper function to capitalize first letter of each word

  const capitalizeWords = (str) => {
    if (!str || typeof str !== "string") return str;
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleHarvestUpload = async (jsonData) => {
    // Skip header row and process each row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      // Map row data to fields
      let [
        crop,
        variety,
        classification,
        area,
        totalLotArea,
        germination,
        datePlanted,
        dateHarvested,
        inQuantity,
        remarks,
      ] = row;

      // Format string fields
      crop = capitalizeWords(crop);
      variety = capitalizeWords(variety);
      classification = capitalizeWords(classification);
      area = capitalizeWords(area);
      remarks = capitalizeWords(remarks);

      const balance = parseFloat(inQuantity) || 0;

      // Function to parse dates from Excel or string input (Philippines timezone)
      const parseDate = (dateValue) => {
        if (!dateValue) return null;

        // If it's an Excel serial date number
        if (typeof dateValue === "number") {
          // Excel's epoch is December 30, 1899 (Philippines time)
          const excelEpoch = new Date("1899-12-30T00:00:00+08:00");
          const date = new Date(
            excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000
          );
          return date;
        }

        // If it's already a Date object
        if (dateValue instanceof Date) {
          return dateValue;
        }

        // Try parsing as MM/DD/YYYY (Philippines time)
        if (typeof dateValue === "string" && dateValue.includes("/")) {
          const [month, day, year] = dateValue.split("/").map(Number);
          // Create date in Philippines timezone (UTC+8)
          return new Date(`${year}-${month}-${day}T00:00:00+08:00`);
        }

        // Try parsing as YYYY-MM-DD (Philippines time)
        if (typeof dateValue === "string" && dateValue.includes("-")) {
          return new Date(`${dateValue}T00:00:00+08:00`);
        }

        return null;
      };

      // Format dates for display/storage (Philippines timezone)
      const formatDateForStorage = (date) => {
        if (!date) return "";

        // Convert to Philippines timezone string
        const phDate = new Date(date.getTime() + 8 * 60 * 60 * 1000); // Add 8 hours if not already in PH time
        const year = phDate.getFullYear();
        const month = String(phDate.getMonth() + 1).padStart(2, "0");
        const day = String(phDate.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
      };

      // Parse dates with proper handling
      const parsedDatePlanted = parseDate(datePlanted);
      const parsedDateHarvested = parseDate(dateHarvested);

      // Generate seedBatchId using harvest date
      let seedBatchId = "";
      if (parsedDateHarvested && crop && variety) {
        try {
          const year = parsedDateHarvested.getFullYear();
          const month = String(parsedDateHarvested.getMonth() + 1).padStart(
            2,
            "0"
          );
          const cropAbbr = getCropAbbreviation(crop);
          const varAbbr = formatVarietyId(variety);
          seedBatchId = `${year}-${month}-${cropAbbr}-${varAbbr}`;
        } catch (error) {
          console.error("Error generating seedBatchId:", error);
          seedBatchId = `TEMP-${uuidv4().substring(0, 8)}`;
        }
      }

      const harvestData = {
        seedBatchId: seedBatchId || `TEMP-${uuidv4().substring(0, 8)}`,
        status: "Active",
        crop,
        variety,
        classification,
        area,
        totalLotArea: parseFloat(totalLotArea) || 0,
        germination: parseFloat(germination) || 0,
        datePlanted: formatDateForStorage(parsedDatePlanted),
        dateHarvested:
          formatDateForStorage(parsedDateHarvested) ||
          new Date().toISOString().split("T")[0],
        inQuantity: parseFloat(inQuantity) || 0,
        outQuantity: 0,
        balance,
        remarks: remarks || "",
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      // Validate required fields
      if (
        !crop ||
        !variety ||
        !classification ||
        !parsedDatePlanted ||
        !parsedDateHarvested
      ) {
        console.warn(`Skipping row ${i} due to missing required fields`);
        continue;
      }

      // Save to Firebase
      await addSeedHarvest(harvestData);
    }

    // Refresh the harvests list
    const harvestsData = await getSeedHarvests();
    setHarvests(harvestsData);

    // Close the form popup after successful upload
    setShowForm(false);
    alert("Seed harvest records imported successfully!");
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
      key: "seedBatchId",
      title: "Batch ID",
      headerClassName: "font-semibold",
    },
    {
      key: "dateHarvested",
      title: "Harvested",
      render: (row) =>
        row.dateHarvested instanceof Date
          ? row.dateHarvested.toLocaleDateString()
          : "-",
    },
    {
      key: "balance",
      title: "Balance (kg)",
      render: (row) => (
        <span
          className={`px-4 py-1 rounded-full text-sm ${
            (row.balance || 0) > 0
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.balance || "0"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-sm ${
            row.status === "Active"
              ? "bg-blue-100 text-blue-800"
              : row.status === "Archived"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status}
        </span>
      ),
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

  const harvestDropdowns = {
    crop: Object.keys(CROP_VARIETIES),
    variety: Object.values(CROP_VARIETIES).flat(),
    classification: CLASSIFICATIONS,
  };

  const harvestTemplateColumns = [
    { key: "crop", header: "Crop", example: "Soybean" },
    { key: "variety", header: "Variety", example: "Tiwala 6" },
    { key: "classification", header: "Classification", example: "Certified" },
    { key: "area", header: "Name of Area", example: "Area A" },
    { key: "totalLotArea", header: "Total Lot Area (sqm)", example: "1000" },
    { key: "germination", header: "Germination Rate", example: "95" },
    { key: "datePlanted", header: "Date Planted", example: "2023-06-15" },
    { key: "dateHarvested", header: "Date Harvested", example: "2023-09-20" },
    { key: "inQuantity", header: "Quantity (kg)", example: "100" },
    { key: "remarks", header: "Remarks", example: "Good harvest" },
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
          } flex items-center justify-center transition-all duration-300 ease-in-out`}
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
          className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "ml-20" : "ml-64"
          } p-8`}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Seed Harvest Records
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

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {editingId ? "Edit Harvest Record" : "Add New Harvest Record"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* Seed Batch ID - Read only */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seed Batch ID *
                    </label>
                    <input
                      type="text"
                      name="seedBatchId"
                      value={
                        formData.seedBatchId ||
                        "Will be generated after entering required fields"
                      }
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically generated in format: YYYY-MM-CROP-VARIETY
                    </p>
                  </div>

                  {/* Status */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Reduced">Reduced</option>
                      <option value="Archived">Storage</option>
                      <option value="Depleted">Depleted</option>
                    </select>
                  </div>

                  {/* Crop */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Crop *
                    </label>
                    <select
                      name="crop"
                      value={formData.crop}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="Soybean">Soybean</option>
                      <option value="Mungbean">Mungbean</option>
                      <option value="Peanut">Peanut</option>
                    </select>
                  </div>

                  {/* Variety */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variety *
                    </label>
                    <select
                      name="variety"
                      value={formData.variety}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      {varieties.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Classification */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Classification *
                    </label>
                    <select
                      name="classification"
                      value={formData.classification}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Classification</option>
                      <option value="Nucleus">Nucleus</option>
                      <option value="Breeder">Breeder</option>
                      <option value="Foundation">Foundation</option>
                      <option value="Registered">Registered</option>
                      <option value="Certified">Certified</option>
                    </select>
                  </div>

                  {/* Area */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (ha) *
                    </label>
                    <select
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Area</option>
                      <option value="Area_A">Area A</option>
                      <option value="Area_B">Area B</option>
                      <option value="Area_C">Area C</option>
                      <option value="Area_D">Area D</option>
                    </select>
                  </div>

                  {/* Total Lot Area */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Lot Area (sqm) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="totalLotArea"
                      value={formData.totalLotArea}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Germination Rate */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Germination Rate (%) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      name="germination"
                      value={formData.germination}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Date Planted */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Planted *
                    </label>
                    <input
                      type="date"
                      name="datePlanted"
                      value={formData.datePlanted}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Date Harvested */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Harvested *
                    </label>
                    <input
                      type="date"
                      name="dateHarvested"
                      value={formData.dateHarvested}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* In Quantity */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Harvested (kg) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      name="inQuantity"
                      value={formData.inQuantity}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Balance - Read only */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balance (kg) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      name="balance"
                      value={formData.balance}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Remarks - Full width field */}
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
                      columns={harvestTemplateColumns}
                      fileName="Seed_Harvest"
                      onUpload={handleHarvestUpload}
                      dropdowns={harvestDropdowns}
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
                          status: "Active",
                          datePlanted: "",
                          crop: "Soybean",
                          variety: "Tiwala 6",
                          classification: "",
                          dateHarvested: "",
                          area: "",
                          totalLotArea: "",
                          germination: "",
                          inQuantity: 0,
                          outQuantity: 0,
                          balance: 0,
                          remarks: "",
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

          {/* Harvest Records Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <DataTable
              columns={columns}
              data={harvests}
              sortable={true}
              defaultSort={{ key: "createdAt", direction: "descending" }}
              emptyMessage="No harvest records found"
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
          <DetailModal
            record={selectedRecord}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
