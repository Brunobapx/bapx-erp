
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
  // const logs removidos para produção

  const selectedFrom = range.startDate ?? undefined;
  const selectedTo = range.endDate ?? undefined;

  const handleSelect = (v: any) => {
    if (!v) {
      onChange({ startDate: null, endDate: null });
      return;
    }
    if (typeof v === "object" && (v.from || v.to)) {
      onChange({ startDate: v.from ?? null, endDate: v.to ?? null });
    } else if (v instanceof Date) {
      onChange({ startDate: v, endDate: null });
    }
  };

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
          selected={{ from: selectedFrom, to: selectedTo }}
          onSelect={handleSelect}
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
