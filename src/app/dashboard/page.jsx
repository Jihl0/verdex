"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  getDashboardStats,
  getRecentDistributions,
  getRecentHarvests,
} from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/utils/AuthGuard";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentDistributions, setRecentDistributions] = useState([]);
  const [recentHarvests, setRecentHarvests] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const statsData = await getDashboardStats();
        setStats(statsData);

        // Load recent distributions (last 5)
        const distData = await getRecentDistributions(5);
        setRecentDistributions(distData);

        // Load recent harvests (last 5)
        const harvestData = await getRecentHarvests(5);
        setRecentHarvests(harvestData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
      <div className="flex h-screen bg-gray-100">
        <Sidebar onToggle={handleSidebarToggle} />

        <div
          className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "ml-20" : "ml-64"
          } p-8`}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

          {/* Welcome Message */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-700">
              Welcome back, {currentUser?.email || "User"}!
            </h2>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your seed inventory today.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Seeds */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
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

            {/* Most Abundant Crop */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
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

            {/* Recent Harvest */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
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

          {/* Recent Activity Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Harvests */}
            <div className="bg-white p-6 rounded-lg shadow">
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
            <div className="bg-white p-6 rounded-lg shadow">
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
        </div>
      </div>
    </AuthGuard>
  );
}
