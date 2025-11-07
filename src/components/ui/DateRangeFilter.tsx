import React from 'react';
import { DateRangePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Button } from "./button";

type Props = {
  start?: string;
  end?: string;
  onChange?: (start?: string, end?: string) => void;
  onClear?: () => void;
  className?: string;
};

export function DateRangeFilter({ start, end, onChange, onClear, className }: Props) {
  // Control the calendar popover open state to allow programmatic close
  const [isOpen, setIsOpen] = React.useState(false);

  // Provide a controlled value when either start or end exists; otherwise leave undefined
  const value = React.useMemo(() => {
    return {
      start: start ? parseDate(start) : undefined,
      end: end ? parseDate(end) : undefined,
    } as any;
  }, [start, end]);

  return (
    (() => {
      const DRP = DateRangePicker as any; // widen type to allow open-state props
      return (
        <DRP
          className={className ?? "date-range-picker"}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          calendarProps={{
            classNames: {
              base: "bg-card rounded-lg border shadow-soft",
              headerWrapper: "pt-4 bg-background",
              prevButton: "border rounded-full",
              nextButton: "border rounded-full",
              gridHeader: "bg-background shadow-none border-b-1 border-default-100",
              cell: "cursor-pointer",
              cellButton: [
                "data-[today=true]:bg-default-100 data-[selected=true]:bg-accent rounded-none",
              ],
            },
          }}
          aria-label="Date range picker"
          value={value}
          onChange={(range: any) => {
            const s = range?.start?.toString?.();
            const e = range?.end?.toString?.();
            onChange?.(s || undefined, e || undefined);
          }}
          CalendarBottomContent={
            <div className="flex justify-end gap-2 p-2 pt-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  onChange?.(undefined, undefined);  
                  onClear?.();
                }}
              >
                Clear
              </Button>
            </div>
          }
        />
      );
    })()
  );
}

export default DateRangeFilter;