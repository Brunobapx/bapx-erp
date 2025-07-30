import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Target } from 'lucide-react';

interface TechnicianPerformance {
  id: string;
  name: string;
  totalOrders: number;
  completedOrders: number;
  avgTime: number;
  efficiency: number;
}

interface TechnicianPerformanceCardProps {
  technicians: TechnicianPerformance[];
}

export const TechnicianPerformanceCard: React.FC<TechnicianPerformanceCardProps> = ({ technicians }) => {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Performance dos Técnicos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {technicians.map((tech) => (
            <div key={tech.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{tech.name}</h4>
                <Badge variant={tech.efficiency >= 80 ? "default" : tech.efficiency >= 60 ? "secondary" : "destructive"}>
                  {tech.efficiency.toFixed(0)}% eficiência
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total OSs</div>
                  <div className="font-bold">{tech.totalOrders}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Finalizadas</div>
                  <div className="font-bold text-green-600">{tech.completedOrders}</div>
                </div>
                <div className="text-center flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Tempo Médio</div>
                    <div className="font-bold">{tech.avgTime}h</div>
                  </div>
                </div>
              </div>
              
              <Progress value={tech.efficiency} className="h-2" />
            </div>
          ))}
          
          {technicians.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              Nenhum técnico encontrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};