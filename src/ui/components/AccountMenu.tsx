import { LogOut, Settings, User, UserPlus } from "lucide-react";
import { useState } from "react";
import type { User as UserType } from "../RTKService/authService";
import {
  useGetProfileQuery,
  useLogoutMutation,
} from "../RTKService/authService";
import { useAppSelector } from "../store/store";

interface AccountMenuProps {
  onUpgradeClick?: () => void;
}

function AccountMenu({ onUpgradeClick }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: profileData, isLoading } = useGetProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { isAuthenticated, isGuest } = useAppSelector((state) => state.auth);

  const user: UserType | null = profileData?.data || null;

  // Truncate long names to prevent design breaking
  const truncateName = (name: string, maxLength: number = 7) => {
    return name.length > maxLength
      ? `${name.substring(0, maxLength)}...`
      : name;
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      setIsOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Account Button */}
      <button
        onClick={toggleMenu}
        className="flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-[#1C569A]"
      >
        <div className="flex h-8 w-8 min-w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400">
          <User size={16} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="truncate text-xs font-medium text-white">
            {truncateName(user.name)}
          </div>
          <div className="truncate text-[10px] text-gray-400">
            {isGuest ? "Guest" : user.email}
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-[180px] rounded-lg border border-gray-700 bg-[#0A2E55] shadow-xl">
            {/* User Info Header */}
            <div className="border-b border-gray-700 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400">
                  <User size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {truncateName(user.name)}
                  </div>
                  <div className="truncate text-xs text-gray-400">
                    {user.email}
                  </div>
                  {isGuest && (
                    <div className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                      Guest Account
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-1">
              {isGuest && onUpgradeClick && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onUpgradeClick();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white transition-colors hover:bg-[#1C569A]"
                >
                  <UserPlus size={16} />
                  <span>Upgrade Account</span>
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white transition-colors hover:bg-[#1C569A]"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                {isLoggingOut ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                ) : (
                  <LogOut size={16} />
                )}
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AccountMenu;
