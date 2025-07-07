"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

const Sidebar = ({ onToggle }) => {
  const pathname = usePathname();
  const { logout, currentUser } = useAuth();
  const [collapsed, setCollapsed] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Save sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setCollapsed(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
    if (onToggle) {
      onToggle(collapsed);
    }
  }, [collapsed, onToggle]);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;

    setIsLoggingOut(true);
    try {
      await logout();
      localStorage.removeItem("sidebarCollapsed");
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Seed Harvest", href: "/seed_harvest", icon: "grass" },
    {
      name: "Seed Distribution",
      href: "/seed_distribute",
      icon: "local_shipping",
    },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const expandedWidth = "w-64";
  const collapsedWidth = "w-20";
  const sidebarWidth = collapsed ? collapsedWidth : expandedWidth;

  return (
    <div
      className={`${sidebarWidth} bg-green-800 text-white flex flex-col h-screen fixed transition-all duration-300 ease-in-out z-50`}
    >
      {/* Logo/Header Section */}
      <div className="p-4 border-b border-green-700 flex items-center justify-between">
        {!collapsed && <h1 className="text-2xl font-bold">Verdex</h1>}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-green-700 transition-colors"
        >
          <span className="material-icons-round">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? "bg-green-700 text-white"
                    : "text-green-200 hover:bg-green-700 hover:bg-opacity-50"
                }`}
                title={collapsed ? item.name : ""}
              >
                <span className="material-icons-round">{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User & Logout Section */}
      <div className="p-4 border-t border-green-700">
        {!collapsed && (
          <div className="mb-4 text-sm">
            <p className="font-medium truncate">
              {currentUser?.email || "User"}
            </p>
            <p className="text-green-200">Administrator</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex items-center w-full p-3 text-green-200 hover:bg-green-700 rounded-lg transition-colors ${
            collapsed ? "justify-center" : ""
          } ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
          title={collapsed ? "Sign Out" : ""}
        >
          {isLoggingOut ? (
            <span className="material-icons-round animate-spin">autorenew</span>
          ) : (
            <>
              <span className="material-icons-round">logout</span>
              {!collapsed && <span className="ml-3">Sign Out</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
