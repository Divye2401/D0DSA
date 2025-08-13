import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { useLeetCodeSync } from "../../hooks/useLeetCodeSync";
import Spinner from "./Spinner";

export default function Navbar() {
  const location = useLocation();
  const { logout } = useAuthStore();
  const { triggerSync, isLoading } = useLeetCodeSync();

  const handleSyncData = () => {
    triggerSync();
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/dashboard" },
    { id: "problems", label: "Problems", icon: "💡", path: "/problems" },
    { id: "flashcards", label: "Flashcards", icon: "🗂️", path: "/flashcards" },
    { id: "plan", label: "Daily Plan", icon: "📋", path: "/plan" },
    { id: "mock", label: "Mock", icon: "🎯", path: "/mock" },
    { id: "settings", label: "Settings", icon: "⚙️", path: "/settings" },
  ];

  const getActiveTab = () => {
    const currentPath = location.pathname;
    const activeItem = navItems.find((item) => item.path === currentPath);
    return activeItem ? activeItem.id : "dashboard";
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      console.log("Logged out successfully");
    }
  };

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl">
            <span className="text-2xl">🎯</span>
            <span className="text-xl font-bold text-white">DSA Prep</span>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-1 bg-gray-800/30 rounded-2xl p-2 border border-gray-700/30">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  getActiveTab() === item.id
                    ? "btn-primary shadow-md"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Sync button */}
            <button
              onClick={handleSyncData}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white bg-gray-800/50 hover:bg-primary/80 border border-gray-700/50 hover:border-primary/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sync LeetCode Data"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner />
                  <span>Syncing...</span>
                </div>
              ) : (
                <>🔄 Sync</>
              )}
            </button>

            {/* Mobile menu button */}
            <button className="md:hidden text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
              <span className="text-xl">☰</span>
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white bg-gray-800/50 hover:bg-red-500/80 border border-gray-700/50 hover:border-red-500/50 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-800/50 py-3">
          <div className="flex flex-wrap gap-2 bg-gray-800/20 rounded-xl p-3">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  getActiveTab() === item.id
                    ? "btn-primary"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
