
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, Search, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Vendor = {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
};

type VendorSelectorProps = {
  selectedVendorId?: string;
  selectedVendorName?: string;
  onSelect: (vendorId: string, vendorName: string) => void;
};

export const VendorSelector: React.FC<VendorSelectorProps> = ({
  selectedVendorId,
  selectedVendorName,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setVendors([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name, cnpj, email")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      if (!error && Array.isArray(data)) setVendors(data);
      setLoading(false);
    };
    if (open && vendors.length === 0) fetchVendors();
    // eslint-disable-next-line
  }, [open]);

  const filtered = vendors.filter((vendor) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      (vendor.name && vendor.name.toLowerCase().includes(s)) ||
      (vendor.cnpj && vendor.cnpj.toLowerCase().includes(s)) ||
      (vendor.email && vendor.email.toLowerCase().includes(s))
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" className="w-full justify-between min-h-[40px]">
          <span className="truncate">{selectedVendorName || "Buscar fornecedor..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-white z-[99]" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Digite para buscar fornecedor..."
              value={search}
              onValueChange={setSearch}
              className="h-9 border-0 focus:outline-none"
              autoFocus
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {loading
                ? "Carregando fornecedores..."
                : vendors.length === 0
                ? "Nenhum fornecedor cadastrado."
                : "Nenhum fornecedor encontrado."}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filtered.map((vendor) => (
                <CommandItem
                  key={vendor.id}
                  value={vendor.id}
                  onSelect={() => {
                    onSelect(vendor.id, vendor.name);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedVendorId === vendor.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{vendor.name}</span>
                    {vendor.cnpj && <span className="text-xs text-muted-foreground">{vendor.cnpj}</span>}
                    {vendor.email && <span className="text-xs text-muted-foreground">{vendor.email}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default VendorSelector;
