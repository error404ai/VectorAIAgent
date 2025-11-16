import React from "react";
import { cn } from "../utils/cn";

interface ProfileTabProps {
  profile: string;
  isActive: boolean;
  hasRunningTask: boolean;
  onClick: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  isActive,
  hasRunningTask,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "mr-1 flex-shrink-0 border px-3 py-1.5 text-sm font-medium transition-all duration-150",
        {
          "z-10 border-blue-500 bg-black/60 text-white shadow-[0_2px_8px_0_rgba(0,32,128,0.10)]":
            isActive,
          "border-white/15 bg-black/30 text-white/70 hover:bg-black/40 hover:text-white/90":
            !isActive,
          "ring-1 ring-orange-400": hasRunningTask,
        },
      )}
      style={{ minWidth: 80 }}
    >
      <span className="block whitespace-nowrap">{profile}</span>
      {hasRunningTask && (
        <span className="ml-1">
          <div className="inline-block h-2 w-2 animate-pulse rounded bg-orange-400"></div>
        </span>
      )}
    </button>
  );
};

export default ProfileTab;
