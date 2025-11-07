import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

export type SearchOption = { label: string; value: string };

type SearchDropdownProps = {
  options: SearchOption[];
  value: string | null;
  onChange: (val: string | null) => void;
  query: string;
  onQueryChange: (q: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function SearchDropdown({
  options,
  value,
  onChange,
  query,
  onQueryChange,
  onFocus,
  placeholder = "Type to search...",
  emptyLabel = "No results found",
  className,
  disabled,
}: SearchDropdownProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<number>(-1);

  const selectedOption = useMemo(
    () => (value ? options.find((o) => o.value === value) ?? null : null),
    [options, value]
  );

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Keep input showing the selected label when cleared
  useEffect(() => {
    if (selectedOption && !query) {
      onQueryChange(selectedOption.label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!open) setHighlighted(-1);
  }, [open]);

  const ensureVisible = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children.item(index) as HTMLElement | null;
    if (!item) return;
    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    const viewTop = list.scrollTop;
    const viewBottom = viewTop + list.clientHeight;
    if (itemTop < viewTop) list.scrollTop = itemTop;
    else if (itemBottom > viewBottom) list.scrollTop = itemBottom - list.clientHeight;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlighted((prev) => {
        const next = Math.min((prev < 0 ? -1 : prev) + 1, options.length - 1);
        requestAnimationFrame(() => ensureVisible(next));
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((prev) => {
        const next = Math.max((prev < 0 ? 0 : prev) - 1, 0);
        requestAnimationFrame(() => ensureVisible(next));
        return next;
      });
    } else if (e.key === "Enter") {
      if (open && highlighted >= 0 && highlighted < options.length) {
        e.preventDefault();
        const opt = options[highlighted];
        onChange(opt.value);
        onQueryChange(opt.label);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <input
        className="input-field w-full pr-10"
        aria-label="Search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
            setOpen(true)
            onFocus?.();
          }
        }
        onKeyDown={onKeyDown}
        disabled={disabled}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex items-center px-2.5"
        onClick={() => setOpen((v) => !v)}
        tabIndex={-1}
        aria-label="Toggle dropdown"
        disabled={disabled}
      >
        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="card absolute left-0 right-0 top-full mt-2 py-3! px-4! w-full empty:invisible max-h-[40vh] overflow-y-auto overscroll-contain z-50 shadow-lg"
        >
          {options?.length ? (
            options.map((opt, idx) => {
              const isSelected = value === opt.value;
              const isActive = highlighted === idx;
              const optionKey = typeof opt.value === 'string'
                ? `opt-${opt.value}-${idx}`
                : `opt-${idx}`;
              return (
                <li
                  key={optionKey}
                  role="option"
                  aria-selected={isSelected}
                  className={`group flex cursor-pointer items-center gap-2 rounded-md py-1 select-none ${
                    isActive ? "text-primary" : ""
                  }`}
                  onMouseEnter={() => setHighlighted(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt.value);
                    onQueryChange(opt.label);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </li>
              );
            })
          ) : (
            <li className="group cursor-default items-center text-center px-3 py-1 select-none" aria-disabled>
              {emptyLabel}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}