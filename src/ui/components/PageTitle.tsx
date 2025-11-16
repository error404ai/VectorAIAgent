import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  children?: ReactNode;
  savedStatus?: {
    status: "idle" | "saving" | "saved" | "error";
    message?: string;
  };
  hasUnsavedChanges?: boolean;
}

function PageTitle({
  title,
  children,
  savedStatus,
  hasUnsavedChanges,
}: PageTitleProps) {
  return (
    <div className="flex cursor-default items-center justify-between border-b border-white/10 px-6 py-3 select-none">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="flex items-center gap-3">
        {hasUnsavedChanges && (
          <div className="rounded bg-yellow-400/90 px-3 py-1 text-xs font-semibold text-yellow-900 shadow">
            Unsaved changes
          </div>
        )}
        {savedStatus?.status === "saved" && (
          <div className="flex items-center gap-2 px-3 py-1 text-green-400">
            <Check size={16} />
            <span className="text-sm font-medium">{savedStatus.message}</span>
          </div>
        )}
        {savedStatus?.status === "error" && (
          <div className="flex items-center gap-2 px-3 py-1 text-red-400">
            <span className="text-sm font-medium">{savedStatus.message}</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default PageTitle;
