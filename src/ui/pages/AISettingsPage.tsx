import { Link, Outlet, useLocation } from "react-router";

function AISettingsPage() {
  const location = useLocation();

  return (
    <div className="relative flex h-full w-full flex-col select-none">
      {/* Tab Navigation */}
      <div className="border-b border-white/10 bg-black/10">
        <div className="flex px-6">
          <Link
            to="/ai-settings/model-settings"
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              location.pathname === "/ai-settings/model-settings" ||
              location.pathname === "/ai-settings"
                ? "border-b-2 border-blue-500 text-white"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            AI Model Settings
          </Link>
          <Link
            to="/ai-settings/agent-settings"
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              location.pathname === "/ai-settings/agent-settings"
                ? "border-b-2 border-blue-500 text-white"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            Agent Settings
          </Link>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default AISettingsPage;
