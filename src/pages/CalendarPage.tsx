
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Cores para eventos por tipo
const eventColors = {
  pedido: "bg-erp-order/20 border-l-4 border-erp-order text-erp-order",
  producao: "bg-erp-production/20 border-l-4 border-erp-production text-erp-production",
  embalagem: "bg-erp-packaging/20 border-l-4 border-erp-packaging text-erp-packaging",
  venda: "bg-erp-sales/20 border-l-4 border-erp-sales text-erp-sales",
  financeiro: "bg-erp-finance/20 border-l-4 border-erp-finance text-erp-finance",
  entrega: "bg-erp-route/20 border-l-4 border-erp-route text-erp-route",
};

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Prazo de Entrega - Pedido #PED-001',
      type: 'pedido',
      start: new Date(2025, 4, 20),
      description: 'Entrega de Server Hardware para Tech Solutions',
      related: 'PED-001'
    },
    {
      id: '2',
      title: 'Início de Produção - Solar Panels',
      type: 'producao',
      start: new Date(2025, 4, 19),
      description: 'Iniciar produção de 50 painéis solares',
      related: 'PR-002'
    },
    {
      id: '3',
      title: 'Embalagem - Medical Equipment',
      type: 'embalagem',
      start: new Date(2025, 4, 17),
      description: 'Embalar equipamentos médicos para o City Hospital',
      related: 'EMB-002'
    },
    {
      id: '4',
      title: 'Faturamento - Global Foods',
      type: 'financeiro',
      start: new Date(2025, 4, 25),
      description: 'Vencimento da fatura de Packaging Materials',
      related: 'F-003'
    },
    {
      id: '5',
      title: 'Entrega - City Hospital',
      type: 'entrega',
      start: new Date(2025, 4, 18),
      description: 'Entrega de equipamentos médicos',
      related: 'RT-002'
    },
    {
      id: '6',
      title: 'Fechamento de Vendas',
      type: 'venda',
      start: new Date(2025, 4, 31),
      description: 'Fechamento do mês - Relatório de vendas',
      related: '-'
    }
  ]);

  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'pedido',
    description: '',
    related: ''
  });

  // Filtrar eventos do dia selecionado
  const eventsForSelectedDate = events.filter(
    event => date && 
    event.start.getDate() === date.getDate() &&
    event.start.getMonth() === date.getMonth() &&
    event.start.getFullYear() === date.getFullYear()
  );

  // Verificar se uma data tem eventos
  const hasEvents = (date: Date) => {
    return events.some(
      event => 
      event.start.getDate() === date.getDate() &&
      event.start.getMonth() === date.getMonth() &&
      event.start.getFullYear() === date.getFullYear()
    );
  };

  const handleAddEvent = () => {
    if (!date) return;
    
    if (!newEvent.title.trim()) {
      toast.error("O título do evento é obrigatório");
      return;
    }

    const event = {
      id: Date.now().toString(),
      title: newEvent.title,
      type: newEvent.type,
      start: new Date(date),
      description: newEvent.description,
      related: newEvent.related
    };

    setEvents([...events, event]);
    setNewEvent({
      title: '',
      type: 'pedido',
      description: '',
      related: ''
    });
    setShowEventModal(false);
    toast.success("Evento adicionado com sucesso");
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    setEvents(events.filter(event => event.id !== selectedEvent.id));
    setShowEventDetails(false);
    toast.success("Evento removido com sucesso");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-muted-foreground">Visualize e gerencie eventos e prazos.</p>
        </div>
        <Button onClick={() => setShowEventModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Evento
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="col-span-1 lg:col-span-3">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="w-full"
              modifiersClassNames={{
                selected: 'bg-primary text-primary-foreground',
              }}
              modifiers={{
                hasEvents: (date) => hasEvents(date),
              }}
              modifiersStyles={{
                hasEvents: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  backgroundColor: 'rgba(var(--primary), 0.1)'
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsForSelectedDate.length > 0 ? (
              <div className="space-y-3">
                {eventsForSelectedDate.map(event => (
                  <div 
                    key={event.id} 
                    className={`p-3 rounded ${eventColors[event.type as keyof typeof eventColors]} cursor-pointer hover:opacity-90`}
                    onClick={() => handleEventClick(event)}
                  >
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <p className="text-xs opacity-90 truncate">{event.description}</p>
                    {event.related !== '-' && <p className="text-xs mt-1">#{event.related}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum evento para esta data.
              </p>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => setShowEventModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar Evento
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal para adicionar evento */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Evento</DialogTitle>
            <DialogDescription>
              Crie um novo evento para {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "a data selecionada"}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input 
                id="title" 
                value={newEvent.title} 
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select 
                value={newEvent.type} 
                onValueChange={(value) => setNewEvent({...newEvent, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pedido">Pedido</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                  <SelectItem value="embalagem">Embalagem</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                value={newEvent.description} 
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="related">ID Relacionado</Label>
              <Input 
                id="related" 
                value={newEvent.related} 
                onChange={(e) => setNewEvent({...newEvent, related: e.target.value})}
                placeholder="Ex: PED-001, PR-002, etc."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventModal(false)}>Cancelar</Button>
            <Button onClick={handleAddEvent}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para detalhes do evento */}
      {selectedEvent && (
        <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Evento</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className={`p-3 rounded ${eventColors[(selectedEvent as any).type]}`}>
                <h3 className="text-lg font-medium">{(selectedEvent as any).title}</h3>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Data</Label>
                <p>{format((selectedEvent as any).start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Tipo</Label>
                <p className="capitalize">{(selectedEvent as any).type}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <p>{(selectedEvent as any).description || "Sem descrição"}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">ID Relacionado</Label>
                <p>{(selectedEvent as any).related || "-"}</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="destructive" onClick={handleDeleteEvent}>
                <X className="h-4 w-4 mr-1" /> Remover Evento
              </Button>
              <Button variant="outline" onClick={() => setShowEventDetails(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CalendarPage;
