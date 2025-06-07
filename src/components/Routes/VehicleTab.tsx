
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Plus, Edit, Trash2 } from 'lucide-react';
import { useVehicles, Vehicle } from '@/hooks/useVehicles';

const VehicleTab = () => {
  const { vehicles, loading, fetchVehicles, createVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  const [formData, setFormData] = useState({
    model: '',
    license_plate: '',
    capacity: '',
    driver_name: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const vehicleData = {
      ...formData,
      capacity: Number(formData.capacity)
    };

    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleData);
      } else {
        await createVehicle(vehicleData);
      }
      
      setIsModalOpen(false);
      setEditingVehicle(null);
      setFormData({
        model: '',
        license_plate: '',
        capacity: '',
        driver_name: '',
        status: 'active',
        notes: ''
      });
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      model: vehicle.model,
      license_plate: vehicle.license_plate,
      capacity: vehicle.capacity.toString(),
      driver_name: vehicle.driver_name || '',
      status: vehicle.status,
      notes: vehicle.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este veículo?')) {
      await deleteVehicle(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Cadastro de Veículos</h2>
          <p className="text-muted-foreground">Gerencie os veículos da frota</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingVehicle(null);
              setFormData({
                model: '',
                license_plate: '',
                capacity: '',
                driver_name: '',
                status: 'active',
                notes: ''
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  placeholder="Ex: Furgão Fiat Ducato"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="license_plate">Placa</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                  placeholder="Ex: ABC-1234"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade (kg)</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="0.01"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  placeholder="Ex: 1000"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="driver_name">Motorista</Label>
                <Input
                  id="driver_name"
                  value={formData.driver_name}
                  onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                  placeholder="Nome do motorista"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="maintenance">Em Manutenção</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Observações sobre o veículo"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {vehicle.model}
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.license_plate}</TableCell>
                  <TableCell>{vehicle.capacity} kg</TableCell>
                  <TableCell>{vehicle.driver_name || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
                      vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.status === 'active' ? 'Ativo' :
                       vehicle.status === 'maintenance' ? 'Manutenção' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {vehicles.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum veículo cadastrado ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleTab;
