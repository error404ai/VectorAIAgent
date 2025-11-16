import React, { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";

export interface SelectOption {
  id: string;
  label: string;
}

interface SelectDropdownProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  className?: string;
  searchable?: boolean;
}

export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  helperText,
  className,
  searchable = false,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.id === value);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Handle keyboard events for accessibility
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" && !isOpen) {
      setIsOpen(true);
    }
  };

  const filteredOptions =
    searchable && searchQuery
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : options;

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleDropdownKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex w-full appearance-none items-center justify-between rounded-none border border-white/20 bg-black/40 px-3 py-2 text-sm text-white ring-0 focus:border-blue-500/50 focus:ring-0 focus:outline-none"
        >
          <span>{selectedOption?.label || placeholder}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen ? "rotate-180" : "",
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div
            className="absolute z-10 mt-1 w-full overflow-auto border border-white/20 bg-[#091E38] shadow-lg"
            role="listbox"
          >
            {searchable && (
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-none border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white placeholder-white/50 focus:border-blue-500/50 focus:outline-none"
                />
              </div>
            )}

            <div className="max-h-38 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-center text-sm text-white/50">
                  No options match your search
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    role="option"
                    aria-selected={value === option.id}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm transition-colors",
                      value === option.id
                        ? "bg-blue-600/40 text-white"
                        : "text-white/80 hover:bg-white/10",
                    )}
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {helperText && !isOpen && (
        <p className="mt-1 text-xs text-white/50">{helperText}</p>
      )}
    </div>
  );
}
