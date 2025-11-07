import React from 'react';
import { DateRangePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";

type Props = {
  start?: string;
  end?: string;
  onChange?: (start?: string, end?: string) => void;
  className?: string;
};

export function DateRangeFilter({ start, end, onChange, className }: Props) {
  return (
    <DateRangePicker
      className={className ?? "date-range-picker w-full md:w-80"}
      calendarProps={{
        classNames: {
          base: "bg-card rounded-lg border shadow-soft",
          headerWrapper: "pt-4 bg-background",
          prevButton: "border rounded-full",
          nextButton: "border rounded-full",
          gridHeader: "bg-background shadow-none border-b-1 border-default-100",
          cellButton: [
            "data-[today=true]:bg-default-100 data-[selected=true]:bg-accent rounded-none",
          ],
        },
      }}
      aria-label="Date range picker"
      value={start && end ? { start: parseDate(start), end: parseDate(end) } : undefined}
      onChange={(range: any) => {
        const s = range?.start?.toString?.();
        const e = range?.end?.toString?.();
        onChange?.(s || undefined, e || undefined);
      }}
    />
  );
}

export default DateRangeFilter;