
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Client } from '@/hooks/useClients';

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: string;
  selectedClientName: string;
  onClientSelect: (clientId: string, clientName: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients = [],
  selectedClientId = '',
  selectedClientName = '',
  onClientSelect,
  open = false,
  setOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  // Ensure clients is always a valid array
  const safeClients = Array.isArray(clients) ? clients : [];

  // Update filtered clients when search query or clients change
  useEffect(() => {
    console.log('ClientSelector - updating filtered clients', { searchQuery, clientsCount: safeClients.length });
    
    if (!searchQuery || searchQuery.trim() === '') {
      setFilteredClients(safeClients);
    } else {
      const filtered = safeClients.filter(client => {
        if (!client) return false;
        
        const searchString = searchQuery.toLowerCase();
        return (
          (client.name && client.name.toLowerCase().includes(searchString)) ||
          (client.cnpj && client.cnpj.toLowerCase().includes(searchString)) ||
          (client.cpf && client.cpf.toLowerCase().includes(searchString))
        );
      });
      setFilteredClients(filtered);
    }
  }, [searchQuery, safeClients]);

  const handleClientSelect = (clientId: string, clientName: string) => {
    console.log('ClientSelector - selecting client', { clientId, clientName });
    onClientSelect(clientId, clientName);
    setSearchQuery('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full"
        >
          {selectedClientName || "Selecione um cliente"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Buscar cliente..." 
              onValueChange={setSearchQuery}
              value={searchQuery}
              className="h-9 focus:outline-none"
            />
          </div>
          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {filteredClients.map((client) => {
              if (!client || !client.id) return null;
              
              return (
                <CommandItem
                  key={client.id}
                  value={client.id}
                  onSelect={() => handleClientSelect(client.id, client.name || '')}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedClientId === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{client.name || 'Nome não informado'}</span>
                    <span className="text-xs text-muted-foreground">
                      {client.type === 'Jurídica' ? (client.cnpj || '') : (client.cpf || '')}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
