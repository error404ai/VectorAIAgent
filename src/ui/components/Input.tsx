import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, helperText, fullWidth = true, id, ...props },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={cn("flex flex-col", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={inputId} className="mb-1 text-sm text-white/70">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "appearance-none rounded-none border border-white/20 bg-black/40 px-4 py-2 text-white placeholder-white/50 ring-0 focus:border-blue-500/50 focus:ring-0 focus:outline-none",
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

Input.displayName = "Input";

export default Input;
