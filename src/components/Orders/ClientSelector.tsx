
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
  CommandItem,
  CommandList
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

  // Ensure clients is always a valid array
  const safeClients = Array.isArray(clients) ? clients : [];

  // Debug logging
  useEffect(() => {
    console.log('ClientSelector - Debug info:', {
      clientsCount: safeClients.length,
      selectedClientId,
      selectedClientName,
      searchQuery,
      open
    });
  }, [safeClients.length, selectedClientId, selectedClientName, searchQuery, open]);

  // Filter clients based on search query
  const filteredClients = safeClients.filter(client => {
    if (!client) return false;
    
    if (!searchQuery || searchQuery.trim() === '') {
      return true;
    }
    
    const searchString = searchQuery.toLowerCase();
    return (
      (client.name && client.name.toLowerCase().includes(searchString)) ||
      (client.cnpj && client.cnpj.toLowerCase().includes(searchString)) ||
      (client.cpf && client.cpf.toLowerCase().includes(searchString)) ||
      (client.email && client.email.toLowerCase().includes(searchString))
    );
  });

  const handleClientSelect = (clientId: string, clientName: string) => {
    console.log('ClientSelector - selecting client', { clientId, clientName });
    onClientSelect(clientId, clientName);
    setSearchQuery('');
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log('ClientSelector - open state changing to:', newOpen);
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery('');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full min-h-[40px]"
        >
          <span className="truncate">
            {selectedClientName || "Selecione um cliente"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Buscar cliente..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9 focus:outline-none border-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {safeClients.length === 0 
                ? "Nenhum cliente cadastrado. Cadastre um cliente primeiro." 
                : "Nenhum cliente encontrado com esse termo."}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filteredClients.map((client) => {
                if (!client || !client.id) return null;
                
                return (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleClientSelect(client.id, client.name || '')}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClientId === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">{client.name || 'Nome não informado'}</span>
                      <span className="text-xs text-muted-foreground">
                        {client.type === 'Jurídica' ? (client.cnpj || 'CNPJ não informado') : (client.cpf || 'CPF não informado')}
                      </span>
                      {client.email && (
                        <span className="text-xs text-muted-foreground">{client.email}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
