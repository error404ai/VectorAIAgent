import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, error, helperText, fullWidth = true, id, ...props },
    ref,
  ) => {
    const textareaId =
      id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={cn("flex flex-col", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={textareaId} className="mb-1 text-sm text-white/70">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "border border-white/20 bg-black/40 px-4 py-2 text-white placeholder-white/50 focus:border-blue-500/50 focus:outline-none",
            error && "border-red-500/50",
            fullWidth && "w-full",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-white/50">{helperText}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
