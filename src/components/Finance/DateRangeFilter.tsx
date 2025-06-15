
import React from "react";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type DateRange = {
  startDate: Date | null;
  endDate: Date | null;
};

interface DateRangeFilterProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
  disabled?: boolean;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ range, onChange, label = "Período", disabled }) => {
  const handleDaySelect = (date: Date) => {
    // Alternar entre definir data de início ou término
    if (!range.startDate || (range.startDate && range.endDate)) {
      onChange({ startDate: date, endDate: null });
    } else if (range.startDate && !range.endDate) {
      if (date >= range.startDate) {
        onChange({ startDate: range.startDate, endDate: date });
      } else {
        onChange({ startDate: date, endDate: range.startDate });
      }
    }
  };

  const selectedDays = [range.startDate, range.endDate].filter(Boolean);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <CalendarRange className="mr-2 h-4 w-4" />
          {range.startDate && range.endDate
            ? `${format(range.startDate, "dd/MM/yyyy")} - ${format(range.endDate, "dd/MM/yyyy")}`
            : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50">
        <Calendar
          mode="range"
          selected={{
            from: range.startDate ?? undefined, 
            to: range.endDate ?? undefined
          }}
          onSelect={({ from, to }) => onChange({ startDate: from ?? null, endDate: to ?? null })}
          numberOfMonths={2}
          locale={ptBR}
          initialFocus
          className="p-3 pointer-events-auto"
        />
        <div className="flex justify-end gap-2 px-4 py-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange({ startDate: null, endDate: null })}
            type="button"
          >
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
