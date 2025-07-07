"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import DataTable from "@/components/DataTable";
import DetailModal from "@/components/DetailModal";
import {
  addSeedDistribution,
  getSeedDistributions,
  updateSeedDistribution,
  deleteSeedDistribution,
  getSeedHarvests,
} from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/utils/AuthGuard";

export default function SeedDistribution() {
  const { currentUser } = useAuth();
  const [distributions, setDistributions] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    seedBatchId: "",
    quantity: 0,
    purpose: "",
    affiliation: "",
    recipientName: "",
    contactNumber: "",
    remarks: "",
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
        console.log("Fetching data..."); // Debug log

        const [distributionsData, harvestsData] = await Promise.all([
          getSeedDistributions(),
          getSeedHarvests(),
        ]);

        console.log("Harvests data:", harvestsData); // Debug log

        setDistributions(distributionsData);

        const availableHarvests = harvestsData.filter((h) => {
          const balance = Number(h.balance) || 0;
          console.log(`Batch ${h.seedBatchId} balance:`, balance); // Debug log
          return balance > 0;
        });

        console.log("Available harvests:", availableHarvests); // Debug log
        setHarvests(availableHarvests);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
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

      const finalData = {
        ...formData,
        date: new Date(formData.date),
        quantity: parseFloat(formData.quantity) || 0,
        createdBy: currentUser.uid,
        createdAt: new Date(),
      };

      if (editingId) {
        await updateSeedDistribution(editingId, finalData);
      } else {
        // Verify the selected harvest exists before adding
        const selectedHarvest = harvests.find(
          (h) => h.seedBatchId === formData.seedBatchId
        );
        if (!selectedHarvest) {
          throw new Error("Selected seed batch not found");
        }
        if (selectedHarvest.balance < finalData.quantity) {
          throw new Error("Insufficient quantity available");
        }

        await addSeedDistribution(finalData);
      }

      // Refresh data
      const [distributionsData, harvestsData] = await Promise.all([
        getSeedDistributions(),
        getSeedHarvests(),
      ]);
      setDistributions(distributionsData);
      setHarvests(harvestsData.filter((h) => (h.balance || 0) > 0));

      // Reset form
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
      });
    } catch (error) {
      console.error("Error saving record:", error);
      setError(error.message);
    }
  };

  const columns = [
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
      key: "recipientName",
      title: "Recipient",
    },
    {
      key: "affiliation",
      title: "Affiliation/Office",
    },
    {
      key: "quantity",
      title: "Quantity (kg)",
      render: (row) => row.quantity?.toFixed(2) || "0",
    },
    {
      key: "purpose",
      title: "Purpose",
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

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {editingId
                  ? "Edit Distribution Record"
                  : "Add New Distribution Record"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Date */}
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

                  {/* Seed Batch ID */}
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

                  {/* Quantity */}
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

                  {/* Purpose */}
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
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Affiliation/Office */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Affiliation/Office *
                    </label>
                    <input
                      type="text"
                      name="affiliation"
                      value={formData.affiliation}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Recipient Name */}
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Contact Number */}
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
                    />
                  </div>
                </div>

                {/* Remarks */}
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
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                  >
                    {editingId ? "Update Record" : "Save Record"}
                  </button>
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
              defaultSort={{ key: "date", direction: "descending" }}
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
          <DetailModal
            record={selectedRecord}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
