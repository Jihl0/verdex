"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  getDashboardStats,
  getRecentDistributions,
  getRecentHarvests,
  getCropHarvestStats,
  getHarvestTrends,
  getDistributionTrends,
} from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/utils/AuthGuard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { CROP_VARIETIES } from "@/constants/variety";
import { saveAs } from "file-saver";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentDistributions, setRecentDistributions] = useState([]);
  const [recentHarvests, setRecentHarvests] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cropStats, setCropStats] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("All Crops");
  const [harvestTrends, setHarvestTrends] = useState([]);
  const [distributionTrends, setDistributionTrends] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const statsData = await getDashboardStats();
        setStats(statsData);

        const distData = await getRecentDistributions(5);
        setRecentDistributions(distData);

        const harvestData = await getRecentHarvests(5);
        setRecentHarvests(harvestData);

        const cropData = await getCropHarvestStats();
        setCropStats(cropData);

        const trendsData = await getHarvestTrends();
        setHarvestTrends(trendsData);

        const distTrends = await getDistributionTrends();
        setDistributionTrends(distTrends);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredHarvests =
    selectedCrop === "All Crops"
      ? recentHarvests
      : recentHarvests.filter((harvest) => harvest.crop === selectedCrop);

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const generateDashboardReport = () => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");

    // Create report content
    let reportContent = `Verdex Seed Inventory Dashboard Report\n`;
    reportContent += `Generated on: ${now.toLocaleString()}\n\n`;

    // 1. Summary Stats
    reportContent += `=== SUMMARY STATISTICS ===\n`;
    reportContent += `Total Seeds: ${
      stats?.totalSeeds?.toFixed(2) || "0"
    } kg\n`;
    reportContent += `Most Abundant Crop: ${
      stats?.mostAbundantCrop || "N/A"
    }\n`;
    reportContent += `Recent Harvest: ${
      stats?.recentHarvest
        ? `${stats.recentHarvest.crop} - ${stats.recentHarvest.variety}`
        : "N/A"
    }\n\n`;

    // 2. Crop Distribution
    reportContent += `=== CROP DISTRIBUTION ===\n`;
    cropStats.forEach((crop) => {
      reportContent += `${crop.crop}: ${crop.total.toFixed(2)} kg (${(
        (crop.total / stats.totalSeeds) *
        100
      ).toFixed(1)}%)\n`;
    });
    reportContent += "\n";

    // 3. Recent Harvests
    reportContent += `=== RECENT HARVESTS (LAST 5) ===\n`;
    recentHarvests.forEach((harvest) => {
      reportContent += `${harvest.seedBatchId}: ${harvest.crop} - ${
        harvest.variety
      }, ${harvest.balance.toFixed(2)} kg\n`;
    });
    reportContent += "\n";

    // 4. Recent Distributions
    reportContent += `=== RECENT DISTRIBUTIONS (LAST 5) ===\n`;
    recentDistributions.forEach((dist) => {
      reportContent += `${dist.seedBatchId}: ${
        dist.recipientName
      }, ${dist.quantity.toFixed(2)} kg\n`;
    });

    // 5. Trends data
    reportContent += `\n=== HARVEST TRENDS (LAST 6 MONTHS) ===\n`;
    harvestTrends.forEach((trend) => {
      reportContent += `${trend.month}: ${trend.total.toFixed(2)} kg\n`;
    });

    reportContent += `\n=== DISTRIBUTION TRENDS (LAST 6 MONTHS) ===\n`;
    distributionTrends.forEach((trend) => {
      reportContent += `${trend.month}: ${trend.total.toFixed(2)} kg\n`;
    });

    // Create a Blob and trigger download
    const blob = new Blob([reportContent], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, `verdex-dashboard-report-${timestamp}.txt`);
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
      <div className="flex h-screen bg-gray-100">
        <Sidebar onToggle={handleSidebarToggle} />

        <div
          className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "ml-20" : "ml-64"
          } p-8`}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <button
              onClick={generateDashboardReport}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Report
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Welcome Message - now takes half width on medium+ screens */}
            <div className="bg-white p-6 rounded-lg shadow md:w-1/2">
              <h2 className="text-xl font-semibold text-gray-700">
                Welcome back, {currentUser?.email || "User"}!
              </h2>
              <div className="text-gray-600 mt-2 space-y-2">
                <p>
                  This is the current development version of our seed inventory
                  system, specifically tracking these legume varieties:
                </p>

                <div className="ml-4">
                  <p className="font-medium">Soybeans:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                    {CROP_VARIETIES.Soybean.map((variety) => (
                      <span key={variety} className="text-sm">
                        • {variety}
                      </span>
                    ))}
                  </div>

                  <p className="font-medium mt-2">Mungbeans:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                    {CROP_VARIETIES.Mungbean.map((variety) => (
                      <span key={variety} className="text-sm">
                        • {variety}
                      </span>
                    ))}
                  </div>

                  <p className="font-medium mt-2">Peanuts:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                    {CROP_VARIETIES.Peanut.map((variety) => (
                      <span key={variety} className="text-sm">
                        • {variety}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-sm italic">
                  Note: The system currently supports only these registered
                  legume varieties. Additional crops and varieties will be added
                  in future updates.
                </p>
              </div>
            </div>

            {/* Crop Distribution Pie Chart - now takes half width on medium+ screens */}
            <div className="bg-white p-6 rounded-lg shadow md:w-1/2 text-gray-800">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Crop Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cropStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                      nameKey="crop"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {cropStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#8D1436", // Soybean - maroon
                              "#00563F", // Mungbean - green
                              "#FFB61C", // Peanut - gold
                              "#9C27B0", // Other - purple
                              "#FF5722", // Other - deep orange
                            ][index % 5]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} kg`, "Quantity"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-2">
                {cropStats.map((crop, index) => (
                  <div key={crop.crop} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{
                        backgroundColor: [
                          "#8D1436",
                          "#00563F",
                          "#FFB61C",
                          "#9C27B0",
                          "#FF5722",
                        ][index % 5],
                      }}
                    ></div>
                    <span className="text-sm">
                      {crop.crop}: {crop.total.toFixed(2)} kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Seeds - Maroon */}
            <div className="bg-white p-6 rounded-lg shadow border-t-4 border-[#8D1436]">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-[#f8e8eb] text-[#8D1436] mr-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Seeds
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats?.totalSeeds?.toFixed(2) || "0"} kg
                  </p>
                </div>
              </div>
            </div>

            {/* Most Abundant Crop - Green */}
            <div className="bg-white p-6 rounded-lg shadow border-t-4 border-[#00563F]">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-[#e6f2ef] text-[#00563F] mr-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Most Abundant Crop
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats?.mostAbundantCrop || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Harvest - Gold */}
            <div className="bg-white p-6 rounded-lg shadow border-t-4 border-[#FFB61C]">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-[#fff5e0] text-[#FFB61C] mr-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Recent Harvest
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {stats?.recentHarvest
                      ? `${stats.recentHarvest.crop} - ${stats.recentHarvest.variety}`
                      : "N/A"}
                  </p>
                  {stats?.recentHarvest && (
                    <p className="text-sm text-gray-500">
                      Batch: {stats.recentHarvest.seedBatchId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Crop Selection Dropdown */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Crop Statistics
              </h3>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="All Crops">All Crops</option>
                {cropStats.map((crop) => (
                  <option key={crop.crop} value={crop.crop}>
                    {crop.crop}
                  </option>
                ))}
              </select>
            </div>

            {/* Statistics Display */}
            {selectedCrop === "All Crops" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cropStats.map((crop) => (
                  <div key={crop.crop} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700">{crop.crop}</h4>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">Total Harvested:</p>
                      <p className="text-xl font-bold text-green-600">
                        {crop.total.toFixed(2)} kg
                      </p>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">Recent Varieties:</p>
                      <p className="text-sm text-gray-400">
                        {recentHarvests
                          .filter((h) => h.crop === crop.crop)
                          .slice(0, 3)
                          .map((h) => h.variety)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {/* Detailed View for Selected Crop */}
                <div className="flex justify-between gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">
                      {selectedCrop} Overview
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          Total Harvested:
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {cropStats
                            .find((c) => c.crop === selectedCrop)
                            ?.total.toFixed(2) || 0}{" "}
                          kg
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Recent Activity
                    </h4>
                    <div className="overflow-x-auto">
                      {/* Recent Harvests Table */}
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Batch ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Crop
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity (kg)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recentHarvests.map((harvest) => (
                            <tr key={harvest.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {harvest.dateHarvested?.toLocaleDateString() ||
                                  "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {harvest.seedBatchId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {harvest.crop}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {harvest.balance.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Harvests */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Harvests
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crop
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity (kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentHarvests.map((harvest) => (
                      <tr key={harvest.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {harvest.seedBatchId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {harvest.crop}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {harvest.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Distributions */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Distributions
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity (kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentDistributions.map((dist) => (
                      <tr key={dist.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {dist.seedBatchId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dist.recipientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dist.quantity.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Harvest Trends Chart */}
          <div className="bg-white p-6 rounded-lg shadow mb-6 text-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Harvest Trends (Last 6 Months)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={harvestTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} kg`, "Quantity"]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar
                    dataKey="total"
                    fill="#8D1436"
                    name="Harvested Quantity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution Trends Chart */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-800 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Distribution Trends (Last 6 Months)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} kg`, "Quantity"]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar
                    dataKey="total"
                    fill="#00563F"
                    name="Distributed Quantity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
