
import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClients, Client } from "@/hooks/useClients";

type ReceivableClientSelectorProps = {
  selectedClientId: string;
  selectedClientName: string;
  onSelect: (id: string, name: string) => void;
};

const ReceivableClientSelector: React.FC<ReceivableClientSelectorProps> = ({
  selectedClientId,
  selectedClientName,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { allClients, isLoading } = useClients();

  // Filtragem dos clientes pelo termo de busca
  const clients: Client[] = Array.isArray(allClients) ? allClients : [];
  const filteredClients = clients.filter(client => {
    if (!search) return true;
    const searchTerm = search.toLowerCase();
    return (
      (client.name && client.name.toLowerCase().includes(searchTerm)) ||
      (client.cnpj && client.cnpj.toLowerCase().includes(searchTerm)) ||
      (client.cpf && client.cpf.toLowerCase().includes(searchTerm)) ||
      (client.email && client.email.toLowerCase().includes(searchTerm))
    );
  });

  const handleSelect = (id: string, name: string) => {
    onSelect(id, name);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full min-h-[40px] text-left"
        >
          <span className="truncate">{selectedClientName || "Buscar cliente..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Digite para buscar cliente..."
              value={search}
              onValueChange={setSearch}
              className="h-9 focus:outline-none border-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {isLoading
                ? "Carregando clientes..."
                : clients.length === 0
                ? "Nenhum cliente cadastrado. Cadastre um cliente primeiro."
                : "Nenhum cliente encontrado com esse termo."}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filteredClients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.id}
                  onSelect={() => handleSelect(client.id, client.name || "")}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedClientId === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{client.name || "Nome não informado"}</span>
                    <span className="text-xs text-muted-foreground">
                       {client.type === "Jurídica"
                         ? client.cnpj || "CNPJ não informado"
                         : client.cpf || "CPF não informado"}
                    </span>
                    {client.email && (
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    )}
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

export default ReceivableClientSelector;
