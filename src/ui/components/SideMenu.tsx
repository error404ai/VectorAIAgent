import {
  Cpu,
  Mail,
  Monitor,
  Terminal,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import desktopIcon from "../../../desktopIcon.png";
import { cn } from "../utils/cn";

function SideMenu() {
  const location = useLocation();
  const menuItems = [
    {
      name: "Automation",
      path: "/",
      icon: Terminal,
    },
    {
      name: "Multi-Profile",
      path: "/multi-profile",
      icon: Users,
    },
    {
      name: "Profiles",
      path: "/profile-management",
      icon: User,
    },
    {
      name: "Wallets",
      path: "/wallet-management",
      icon: Wallet,
    },
    {
      name: "AI Settings",
      path: "/ai-settings",
      icon: Cpu,
    },
    {
      name: "Browser",
      path: "/browser-settings",
      icon: Monitor,
    },
    {
      name: "Contact",
      path: "/contact",
      icon: Mail,
    },
  ];
  return (
    <div className="flex h-full flex-col">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex h-20 w-full cursor-default flex-col items-center justify-center gap-1 transition-all select-none",
            {
              "bg-gradient-to-tr from-sky-800 via-blue-600 to-cyan-500 text-white shadow-[0px_15px_55px_-13px_rgba(0,0,0,0.3)] shadow-blue-600":
                location.pathname === item.path,
              "bg-transparent text-white transition-colors hover:bg-[#1C569A]":
                location.pathname !== item.path,
            },
          )}
        >
          <item.icon size={26} />
          <div className="font-base text-center text-sm">{item.name}</div>
        </Link>
      ))}

      <div className="mx-auto mt-auto flex w-full items-center justify-center gap-2 border-gray-700 px-0 pt-0 pb-1 shadow-inner">
        <img
          src={desktopIcon}
          alt="app logo"
          className="h-6 w-6 object-contain"
        />
        <span className="text-[9px] font-semibold tracking-wide text-gray-200">
          Vector AI Agent
        </span>
      </div>
    </div>
  );
}

export default SideMenu;
